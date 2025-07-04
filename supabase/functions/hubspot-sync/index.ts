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

    const requestBody = await req.json();
    const { action, negocioData, pipelineId, apiKey } = requestBody;

    console.log('HubSpot Sync Action:', action);

    // Handle temporary connection test (without saving)
    if (action === 'test_connection_temp') {
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'API key is required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        console.log('Testing HubSpot connection with provided API key...');
        const testResponse = await fetch('https://api.hubapi.com/integrations/v1/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('HubSpot API test failed:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `HubSpot API connection failed: ${errorText}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const responseData = await testResponse.json();
        console.log('HubSpot connection test successful:', responseData);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Connection test successful',
          data: responseData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error testing connection:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Connection test failed: ${error.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle saving API key with active token management
    if (action === 'save_api_key') {
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'API key is required' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        console.log('Saving API key for user:', user.id);
        
        // Check if this exact API key already exists for this user BEFORE deactivating
        const { data: existingToken, error: searchError } = await supabase
          .from('hubspot_api_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('api_key', apiKey)
          .maybeSingle();

        if (searchError) {
          console.error('Error searching for existing token:', searchError);
          throw new Error(`Failed to search for existing token: ${searchError.message}`);
        }

        // Now deactivate all existing tokens for this user
        const { error: deactivateError } = await supabase
          .from('hubspot_api_keys')
          .update({ activo: false })
          .eq('user_id', user.id);

        if (deactivateError) {
          console.error('Error deactivating existing tokens:', deactivateError);
          throw new Error(`Failed to deactivate existing tokens: ${deactivateError.message}`);
        }

        if (existingToken) {
          // Token exists, just activate it and update timestamp
          const { error: updateError } = await supabase
            .from('hubspot_api_keys')
            .update({
              activo: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingToken.id);

          if (updateError) {
            console.error('Error updating existing token:', updateError);
            throw new Error(`Failed to update existing token: ${updateError.message}`);
          }

          console.log('Existing token updated and activated successfully');
        } else {
          // Token doesn't exist, create new one
          const { error: insertError } = await supabase
            .from('hubspot_api_keys')
            .insert({
              user_id: user.id,
              api_key: apiKey,
              activo: true,
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error inserting new token:', insertError);
            throw new Error(`Failed to insert new token: ${insertError.message}`);
          }

          console.log('New token created and activated successfully');
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'API key saved successfully and set as active'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error saving API key:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Failed to save API key: ${error.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get the user's active API key from our table
    const { data: apiKeyData, error: keyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('activo', true)
      .single();

    if (keyError || !apiKeyData?.api_key) {
      console.log('Active HubSpot API key not found for user:', user.id);
      
      // Only update sync status for negocio-related actions
      if (negocioData?.id) {
        await supabase
          .from('hubspot_sync')
          .upsert({
            negocio_id: negocioData.id,
            sync_status: 'error',
            error_message: 'HubSpot API key not configured or not active',
            last_sync_at: new Date().toISOString()
          });
      }

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'HubSpot API key not configured or not active. Please configure your API key in settings.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hubspotApiKey = apiKeyData.api_key;
    console.log('Found active API key for user:', user.id);

    // Handle test connection
    if (action === 'test_connection') {
      try {
        console.log('Testing HubSpot connection...');
        const testResponse = await fetch('https://api.hubapi.com/integrations/v1/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${hubspotApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error('HubSpot API test failed:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `HubSpot API connection failed: ${errorText}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const responseData = await testResponse.json();
        console.log('HubSpot connection test successful:', responseData);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Connection test successful',
          data: responseData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error testing connection:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Connection test failed: ${error.message}` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

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

    // Handle different actions
    if (action === 'fetch_pipelines') {
      console.log('Fetching HubSpot pipelines');
      
      const pipelinesResponse = await fetch('https://api.hubapi.com/crm/v3/pipelines/deals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!pipelinesResponse.ok) {
        const errorText = await pipelinesResponse.text();
        console.error('HubSpot pipelines API error:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `HubSpot API error: ${errorText}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const pipelinesData = await pipelinesResponse.json();
      console.log('Successfully fetched pipelines:', pipelinesData.results?.length || 0);
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: pipelinesData.results || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetch_deal_stages') {
      if (!pipelineId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Pipeline ID is required for fetching deal stages' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Fetching HubSpot deal stages for pipeline:', pipelineId);
      
      const stagesResponse = await fetch(`https://api.hubapi.com/crm/v3/pipelines/deals/${pipelineId}/stages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!stagesResponse.ok) {
        const errorText = await stagesResponse.text();
        console.error('HubSpot stages API error:', errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `HubSpot API error: ${errorText}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const stagesData = await stagesResponse.json();
      console.log('Successfully fetched deal stages:', stagesData.results?.length || 0);
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: stagesData.results || [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle create and update actions (require negocioData)
    if (action === 'create' || action === 'update') {
      if (!negocioData) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Negocio data is required for create/update actions' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`${action}ing deal for negocio:`, negocioData.id);

      let hubspotResponse;
      let hubspotDealId;

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
        console.log('Updated existing deal:', hubspotDealId);
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
          console.log('Created new deal:', hubspotDealId);
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

      return new Response(JSON.stringify({ 
        success: true, 
        hubspot_deal_id: hubspotDealId,
        action: action 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Invalid action
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Invalid action: ${action}` 
    }), {
      status: 400,
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
