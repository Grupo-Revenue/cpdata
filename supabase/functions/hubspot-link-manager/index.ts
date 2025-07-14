import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LinkRequest {
  presupuesto_id: string;
  negocio_id: string;
  regenerate?: boolean;
  existing_property?: string;
}

interface HubSpotProperty {
  name: string;
  value: string;
}

// HubSpot link properties (link_cotizacion_1 to link_cotizacion_10)
const HUBSPOT_LINK_PROPERTIES = Array.from({ length: 10 }, (_, i) => `link_cotizacion_${i + 1}`);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔗 [HubSpot Link Manager] Starting link management process');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { presupuesto_id, negocio_id, regenerate = false, existing_property }: LinkRequest = await req.json();

    // Get presupuesto data
    const { data: presupuesto, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select('nombre')
      .eq('id', presupuesto_id)
      .single();

    if (presupuestoError || !presupuesto) {
      throw new Error('Presupuesto no encontrado');
    }

    // Get negocio data
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('hubspot_id, user_id')
      .eq('id', negocio_id)
      .single();

    if (negocioError || !negocio) {
      throw new Error('Negocio no encontrado');
    }

    if (!negocio.hubspot_id) {
      console.log('⚠️ [HubSpot Link Manager] Negocio sin HubSpot ID, solo creando link local');
    }

    // Generate public URL
    const presupuestoName = presupuesto.nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const publicUrl = `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').replace('supabase.co', 'lovable.app') || 'https://your-domain.com'}/public/presupuesto/${presupuestoName}/${negocio_id}/${presupuesto_id}/view`;

    let hubspotProperty = existing_property;
    let hubspotUpdateSuccess = true;

    // HubSpot integration (only if we have hubspot_id)
    if (negocio.hubspot_id) {
      try {
        // Get HubSpot API key
        const { data: hubspotKey } = await supabase
          .from('hubspot_api_keys')
          .select('api_key')
          .eq('user_id', negocio.user_id)
          .eq('activo', true)
          .single();

        if (!hubspotKey?.api_key) {
          console.log('⚠️ [HubSpot Link Manager] No active HubSpot API key found');
          hubspotUpdateSuccess = false;
        } else {
          // Get current HubSpot deal properties
          const hubspotResponse = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}?properties=${HUBSPOT_LINK_PROPERTIES.join(',')}`,
            {
              headers: {
                'Authorization': `Bearer ${hubspotKey.api_key}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (hubspotResponse.ok) {
            const dealData = await hubspotResponse.json();
            const currentProperties = dealData.properties;

            // If regenerating and we have existing_property, use it
            if (regenerate && existing_property) {
              hubspotProperty = existing_property;
            } else {
              // Find available property or detect existing link
              hubspotProperty = findAvailableProperty(currentProperties, publicUrl);
            }

            // Update HubSpot with the link
            const updateResponse = await fetch(
              `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${hubspotKey.api_key}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  properties: {
                    [hubspotProperty!]: publicUrl
                  }
                }),
              }
            );

            if (!updateResponse.ok) {
              console.error('❌ [HubSpot Link Manager] Failed to update HubSpot deal');
              hubspotUpdateSuccess = false;
            } else {
              console.log(`✅ [HubSpot Link Manager] Updated HubSpot property: ${hubspotProperty}`);
            }
          } else {
            console.error('❌ [HubSpot Link Manager] Failed to get HubSpot deal data');
            hubspotUpdateSuccess = false;
          }
        }
      } catch (hubspotError) {
        console.error('❌ [HubSpot Link Manager] HubSpot error:', hubspotError);
        hubspotUpdateSuccess = false;
      }
    }

    // Database operations
    if (regenerate) {
      // Deactivate existing link
      await supabase
        .from('public_budget_links')
        .update({ is_active: false, updated_at: 'now()' })
        .eq('presupuesto_id', presupuesto_id)
        .eq('is_active', true);
    }

    // Create new link record
    const { data: linkData, error: linkError } = await supabase
      .from('public_budget_links')
      .insert({
        presupuesto_id,
        negocio_id,
        link_url: publicUrl,
        hubspot_property,
        is_active: true,
        created_by: negocio.user_id
      })
      .select()
      .single();

    if (linkError) {
      throw new Error(`Error creating link: ${linkError.message}`);
    }

    console.log('✅ [HubSpot Link Manager] Link management completed successfully');

    return new Response(JSON.stringify({
      success: true,
      link: linkData,
      hubspot_updated: hubspotUpdateSuccess,
      hubspot_property: hubspotProperty
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [HubSpot Link Manager] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function findAvailableProperty(currentProperties: Record<string, string>, newUrl: string): string {
  // Check if the new URL already exists in any property
  for (const property of HUBSPOT_LINK_PROPERTIES) {
    const existingValue = currentProperties[property];
    if (existingValue && isSimilarUrl(existingValue, newUrl)) {
      return property; // Update existing property
    }
  }

  // Find first available property
  for (const property of HUBSPOT_LINK_PROPERTIES) {
    if (!currentProperties[property] || currentProperties[property].trim() === '') {
      return property;
    }
  }

  // If all properties are occupied, use the first one
  return HUBSPOT_LINK_PROPERTIES[0];
}

function isSimilarUrl(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    
    // Compare path structure to see if they're for the same presupuesto
    const path1Parts = u1.pathname.split('/');
    const path2Parts = u2.pathname.split('/');
    
    // Check if they have the same presupuesto_id (last part before /view)
    if (path1Parts.length >= 2 && path2Parts.length >= 2) {
      const id1 = path1Parts[path1Parts.length - 2];
      const id2 = path2Parts[path2Parts.length - 2];
      return id1 === id2;
    }
    
    return false;
  } catch {
    return false;
  }
}