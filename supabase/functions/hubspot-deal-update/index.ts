import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple logging function
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [HubSpot Deal Update] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  const startTime = Date.now();
  
  log('INFO', '🚀 Edge function started', { method: req.method, url: req.url });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('INFO', 'Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    log('INFO', 'Supabase client initialized');

    // Parse request body
    const bodyText = await req.text();
    log('INFO', 'Request body received', { bodyLength: bodyText.length, body: bodyText });

    if (!bodyText || bodyText.trim() === '') {
      log('ERROR', 'Empty request body');
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = JSON.parse(bodyText);
    log('INFO', 'Request body parsed successfully', requestBody);

    const { negocio_id, estado_anterior, estado_nuevo, sync_log_id } = requestBody;

    // Validate required parameters
    if (!negocio_id || !estado_nuevo) {
      log('ERROR', 'Missing required parameters', { negocio_id, estado_nuevo });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: 'negocio_id and estado_nuevo are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('INFO', 'Processing business state change', {
      negocio_id,
      estado_anterior,
      estado_nuevo,
      sync_log_id
    });

    // Get business info
    const { data: negocio, error: negocioError } = await supabaseClient
      .from('negocios')
      .select('user_id, hubspot_id')
      .eq('id', negocio_id)
      .single();

    log('INFO', 'Business data retrieved', { negocio, error: negocioError });

    if (negocioError || !negocio) {
      log('ERROR', 'Business not found', negocioError);
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if business has HubSpot ID
    if (!negocio.hubspot_id) {
      log('WARN', 'Business has no HubSpot ID, skipping sync', { negocio_id, user_id: negocio.user_id });
      return new Response(
        JSON.stringify({ message: 'Business not synced with HubSpot' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active HubSpot API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', negocio.user_id)
      .eq('activo', true)
      .single();

    log('INFO', 'API key retrieval', { user_id: negocio.user_id, hasApiKey: !!apiKeyData, error: apiKeyError });

    if (apiKeyError || !apiKeyData) {
      log('ERROR', 'No active HubSpot API key found', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'No active HubSpot API key found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stage mapping for the new state
    const { data: stageMapping, error: mappingError } = await supabaseClient
      .from('hubspot_stage_mapping')
      .select('stage_id')
      .eq('user_id', negocio.user_id)
      .eq('estado_negocio', estado_nuevo)
      .single();

    log('INFO', 'Stage mapping retrieval', { user_id: negocio.user_id, estado_nuevo, stageMapping, error: mappingError });

    if (mappingError || !stageMapping) {
      log('WARN', 'No stage mapping found for this state', { estado_nuevo, user_id: negocio.user_id, error: mappingError });
      return new Response(
        JSON.stringify({ message: 'No stage mapping configured for this state' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update HubSpot deal stage
    log('INFO', 'Updating HubSpot deal stage', {
      dealId: negocio.hubspot_id,
      stageId: stageMapping.stage_id,
      estado_nuevo
    });

    const updateResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            dealstage: stageMapping.stage_id
          }
        })
      }
    );

    log('INFO', 'HubSpot API response', { 
      status: updateResponse.status, 
      statusText: updateResponse.statusText 
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      log('ERROR', 'HubSpot API error', { status: updateResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ error: 'Failed to update deal in HubSpot', details: errorText }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedDeal = await updateResponse.json();
    const executionTime = Date.now() - startTime;
    
    log('INFO', `✅ Successfully updated HubSpot deal in ${executionTime}ms`, updatedDeal);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deal stage updated in HubSpot',
        hubspot_deal_id: updatedDeal.id,
        execution_time_ms: executionTime
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    log('ERROR', 'Unexpected error', { error: error.message, stack: error.stack });
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});