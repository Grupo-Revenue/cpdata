
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
  sync_from_hubspot?: boolean;
  recovery_mode?: boolean;
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

    const { 
      presupuesto_id, 
      negocio_id, 
      regenerate = false, 
      existing_property, 
      sync_from_hubspot = false,
      recovery_mode = false 
    }: LinkRequest = await req.json();

    console.log('🔗 [HubSpot Link Manager] Request params:', {
      presupuesto_id,
      negocio_id,
      regenerate,
      sync_from_hubspot,
      recovery_mode
    });

    // If sync_from_hubspot is true, try to recover the link from HubSpot
    if (sync_from_hubspot) {
      console.log('🔄 [HubSpot Link Manager] Attempting to sync link from HubSpot for presupuesto:', presupuesto_id);
      
      // Check if there's already a local record
      const { data: existingLink } = await supabase
        .from('public_budget_links')
        .select('*')
        .eq('presupuesto_id', presupuesto_id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (existingLink) {
        console.log('✅ [HubSpot Link Manager] Link already exists locally');
        return new Response(JSON.stringify({ 
          success: true, 
          link: existingLink,
          message: 'Link already exists locally'
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Get negocio data to check HubSpot ID
      const { data: negocioData, error: negocioError } = await supabase
        .from('negocios')
        .select('hubspot_id, user_id')
        .eq('id', negocio_id)
        .single();

      if (negocioError || !negocioData?.hubspot_id) {
        console.log('⚠️ [HubSpot Link Manager] No HubSpot ID found for negocio:', negocio_id);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No HubSpot integration found' 
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Get HubSpot API key with fallback to global key
      const apiKey = await getHubSpotApiKey(supabase, negocioData.user_id);
      
      if (!apiKey) {
        console.log('⚠️ [HubSpot Link Manager] No HubSpot API key found (user or global)');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No HubSpot API key configured' 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      try {
        // Fetch deal properties from HubSpot
        const hubspotResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${negocioData.hubspot_id}?properties=${HUBSPOT_LINK_PROPERTIES.join(',')}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (hubspotResponse.ok) {
          const dealData = await hubspotResponse.json();
          const properties = dealData.properties || {};
          
          // Look for any public link that matches our pattern
          const linkPattern = new RegExp(`/presupuesto/${negocio_id}/${presupuesto_id}/view$`);
          
          let foundUrl = null;
          let foundProperty = null;
          
          for (const propName of HUBSPOT_LINK_PROPERTIES) {
            const propValue = properties[propName];
            if (propValue && linkPattern.test(propValue)) {
              foundUrl = propValue;
              foundProperty = propName;
              break;
            }
          }
          
          if (foundUrl) {
            // Create the missing local record
            const { data: newLink, error: insertError } = await supabase
              .from('public_budget_links')
              .insert({
                presupuesto_id,
                negocio_id,
                link_url: foundUrl,
                hubspot_property: foundProperty,
                is_active: true,
                created_by: negocioData.user_id
              })
              .select()
              .single();

            if (insertError) {
              console.error('❌ [HubSpot Link Manager] Error creating local link record:', insertError);
              return new Response(JSON.stringify({ 
                success: false, 
                error: 'Failed to create local record' 
              }), { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              });
            }

            console.log('✅ [HubSpot Link Manager] Successfully synced link from HubSpot:', foundUrl);
            return new Response(JSON.stringify({ 
              success: true, 
              link: newLink,
              message: 'Link synced from HubSpot successfully',
              hubspot_synced: true
            }), { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }
        }
        
        console.log('⚠️ [HubSpot Link Manager] No matching link found in HubSpot for presupuesto:', presupuesto_id);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No link found in HubSpot' 
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
        
      } catch (hubspotError) {
        console.error('❌ [HubSpot Link Manager] Error fetching from HubSpot:', hubspotError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Error communicating with HubSpot' 
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Get presupuesto data
    const { data: presupuesto, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select('nombre, estado, facturado')
      .eq('id', presupuesto_id)
      .single();

    if (presupuestoError || !presupuesto) {
      console.error('❌ [HubSpot Link Manager] Presupuesto not found:', presupuestoError);
      throw new Error('Presupuesto no encontrado');
    }

    // Verify presupuesto is eligible for public link
    const isEligible = presupuesto.estado === 'publicado' || 
                      presupuesto.estado === 'aprobado' || 
                      presupuesto.facturado;

    if (!isEligible && !recovery_mode) {
      console.log('⚠️ [HubSpot Link Manager] Presupuesto not eligible for public link:', {
        estado: presupuesto.estado,
        facturado: presupuesto.facturado
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Presupuesto not eligible for public link' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get negocio data
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('hubspot_id, user_id')
      .eq('id', negocio_id)
      .single();

    if (negocioError || !negocio) {
      console.error('❌ [HubSpot Link Manager] Negocio not found:', negocioError);
      throw new Error('Negocio no encontrado');
    }

    // Generate public URL - detect environment from request origin
    const origin = req.headers.get('origin') || req.headers.get('referer');
    let baseUrl = 'https://ejvtuuvigcqpibpfcxch.lovable.app'; // fallback
    
    if (origin) {
      try {
        const url = new URL(origin);
        baseUrl = url.origin;
      } catch {
        // Use fallback if origin parsing fails
      }
    }
    
    const publicUrl = `${baseUrl}/presupuesto/${negocio_id}/${presupuesto_id}/view`;

    let hubspotProperty = existing_property;
    let hubspotUpdateSuccess = true;

    // HubSpot integration (only if we have hubspot_id)
    if (negocio.hubspot_id) {
      try {
        // Get HubSpot API key with fallback to global key
        const apiKey = await getHubSpotApiKey(supabase, negocio.user_id);

        if (!apiKey) {
          console.log('⚠️ [HubSpot Link Manager] No HubSpot API key found (user or global)');
          hubspotUpdateSuccess = false;
        } else {
          console.log('🔑 [HubSpot Link Manager] Using HubSpot API key for user:', negocio.user_id);
          
          // Get current HubSpot deal properties
          const hubspotResponse = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}?properties=${HUBSPOT_LINK_PROPERTIES.join(',')}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
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

            console.log(`🔄 [HubSpot Link Manager] Updating HubSpot property ${hubspotProperty} with URL: ${publicUrl}`);

            // Update HubSpot with the link
            const updateResponse = await fetch(
              `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`,
              {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
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
              const errorData = await updateResponse.text();
              console.error('❌ [HubSpot Link Manager] Failed to update HubSpot deal:', errorData);
              hubspotUpdateSuccess = false;
            } else {
              console.log(`✅ [HubSpot Link Manager] Successfully updated HubSpot property: ${hubspotProperty}`);
            }
          } else {
            const errorData = await hubspotResponse.text();
            console.error('❌ [HubSpot Link Manager] Failed to get HubSpot deal data:', errorData);
            hubspotUpdateSuccess = false;
          }
        }
      } catch (hubspotError) {
        console.error('❌ [HubSpot Link Manager] HubSpot error:', hubspotError);
        hubspotUpdateSuccess = false;
      }
    } else {
      console.log('ℹ️ [HubSpot Link Manager] No HubSpot ID for negocio, skipping HubSpot sync');
    }

    // Database operations
    if (regenerate) {
      // Only deactivate the specific presupuesto's link when regenerating
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
        hubspot_property: hubspotProperty,
        is_active: true,
        created_by: negocio.user_id
      })
      .select()
      .single();

    if (linkError) {
      console.error('❌ [HubSpot Link Manager] Error creating link:', linkError);
      throw new Error(`Error creating link: ${linkError.message}`);
    }

    console.log('✅ [HubSpot Link Manager] Link management completed successfully');
    console.log('📊 [HubSpot Link Manager] Final result:', {
      link_created: !!linkData,
      hubspot_updated: hubspotUpdateSuccess,
      hubspot_property: hubspotProperty
    });

    return new Response(JSON.stringify({
      success: true,
      link: linkData,
      hubspot_updated: hubspotUpdateSuccess,
      hubspot_property: hubspotProperty,
      recovery_mode
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

// Helper function to get HubSpot API key with fallback to global key
async function getHubSpotApiKey(supabase: any, userId: string): Promise<string | null> {
  console.log('🔑 [HubSpot Link Manager] Looking for API key for user:', userId);
  
  // First try to get user-specific API key
  const { data: userKey } = await supabase
    .from('hubspot_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .eq('activo', true)
    .single();

  if (userKey?.api_key) {
    console.log('✅ [HubSpot Link Manager] Found user-specific API key');
    return userKey.api_key;
  }

  console.log('🔍 [HubSpot Link Manager] No user-specific key found, trying global key...');
  
  // If no user-specific key, try to get global key
  const { data: globalKey } = await supabase
    .from('hubspot_api_keys')
    .select('api_key')
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (globalKey?.api_key) {
    console.log('✅ [HubSpot Link Manager] Found global API key as fallback');
    return globalKey.api_key;
  }

  console.log('❌ [HubSpot Link Manager] No API key found (user or global)');
  return null;
}

function findAvailableProperty(currentProperties: Record<string, string>, newUrl: string): string {
  // First check if the exact same link already exists (same presupuesto)
  for (const property of HUBSPOT_LINK_PROPERTIES) {
    const existingValue = currentProperties[property];
    if (existingValue && existingValue === newUrl) {
      console.log(`🔄 [HubSpot Link Manager] Exact link already exists in ${property}`);
      return property; // Return the property where the exact link exists
    }
  }

  // Find first available property in ascending order
  for (const property of HUBSPOT_LINK_PROPERTIES) {
    if (!currentProperties[property] || currentProperties[property].trim() === '') {
      console.log(`📍 [HubSpot Link Manager] Using empty property: ${property}`);
      return property;
    }
  }

  // If all properties are occupied, throw error - no more space available
  throw new Error('No hay propiedades disponibles. Máximo 10 links por negocio alcanzado.');
}
