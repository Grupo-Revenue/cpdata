
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HubSpotDeal {
  properties: {
    dealname: string;
    amount?: string;
    dealstage: string;
    pipeline: string;
    closedate?: string;
    hubspot_owner_id?: string;
    description?: string;
  };
}

interface NegocioData {
  id: string;
  numero: number;
  contacto: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  evento: {
    nombreEvento: string;
    tipoEvento: string;
    fechaEvento?: string;
    locacion: string;
  };
  valorTotal?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, negocioData } = await req.json();

    // Get user's HubSpot configuration
    const { data: hubspotConfig, error: configError } = await supabase
      .from('hubspot_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !hubspotConfig?.api_key_set) {
      console.log('HubSpot not configured for user, skipping sync');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'HubSpot not configured, sync skipped' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get HubSpot API key from user secrets (would be stored securely)
    // For now, we'll return success but not actually sync
    // In production, you'd retrieve the encrypted API key from a secure store

    const hubspotApiKey = Deno.env.get(`HUBSPOT_API_KEY_${user.id}`);
    if (!hubspotApiKey) {
      console.log('HubSpot API key not found for user');
      
      // Update sync status as error
      await supabase
        .from('hubspot_sync')
        .upsert({
          negocio_id: negocioData.id,
          sync_status: 'error',
          error_message: 'HubSpot API key not configured',
          last_sync_at: new Date().toISOString()
        });

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'HubSpot API key not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let hubspotResponse;
    let hubspotDealId;

    if (action === 'create' || action === 'update') {
      // Prepare deal data
      const dealData: HubSpotDeal = {
        properties: {
          dealname: `${negocioData.evento.nombreEvento} - #${negocioData.numero}`,
          dealstage: hubspotConfig.default_deal_stage || 'qualifiedtobuy',
          pipeline: hubspotConfig.default_pipeline_id || 'default',
          description: `Evento: ${negocioData.evento.tipoEvento} en ${negocioData.evento.locacion}. Contacto: ${negocioData.contacto.nombre} ${negocioData.contacto.apellido} (${negocioData.contacto.email})`,
        }
      };

      if (negocioData.valorTotal) {
        dealData.properties.amount = negocioData.valorTotal.toString();
      }

      if (negocioData.evento.fechaEvento) {
        // Convert to HubSpot date format (timestamp in milliseconds)
        const closeDate = new Date(negocioData.evento.fechaEvento).getTime();
        dealData.properties.closedate = closeDate.toString();
      }

      // Check if deal already exists in HubSpot
      const { data: existingSync } = await supabase
        .from('hubspot_sync')
        .select('hubspot_deal_id')
        .eq('negocio_id', negocioData.id)
        .single();

      if (existingSync?.hubspot_deal_id && action === 'update') {
        // Update existing deal
        hubspotResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/deals/${existingSync.hubspot_deal_id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dealData),
          }
        );
        hubspotDealId = existingSync.hubspot_deal_id;
      } else {
        // Create new deal
        hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dealData),
        });

        if (hubspotResponse.ok) {
          const hubspotData = await hubspotResponse.json();
          hubspotDealId = hubspotData.id;
        }
      }

      if (!hubspotResponse.ok) {
        const errorText = await hubspotResponse.text();
        console.error('HubSpot API error:', errorText);
        
        // Update sync status as error
        await supabase
          .from('hubspot_sync')
          .upsert({
            negocio_id: negocioData.id,
            sync_status: 'error',
            error_message: `HubSpot API error: ${errorText}`,
            last_sync_at: new Date().toISOString()
          });

        return new Response(JSON.stringify({ 
          success: false, 
          error: `HubSpot API error: ${errorText}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update sync status as successful
      await supabase
        .from('hubspot_sync')
        .upsert({
          negocio_id: negocioData.id,
          hubspot_deal_id: hubspotDealId,
          sync_status: 'success',
          error_message: null,
          last_sync_at: new Date().toISOString()
        });

      console.log(`Successfully ${action}d deal in HubSpot:`, hubspotDealId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      hubspot_deal_id: hubspotDealId,
      action: action 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in hubspot-sync function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
