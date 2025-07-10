import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced logging function
function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] [HubSpot Deal Update] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

// Enhanced error handling
class HubSpotSyncError extends Error {
  constructor(message: string, public code: string, public retryable: boolean = false) {
    super(message);
    this.name = 'HubSpotSyncError';
  }
}

serve(async (req) => {
  const startTime = Date.now();
  let syncLogId: string | null = null;
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Parse request body with better error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      log('DEBUG', 'Received request body (text):', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      log('DEBUG', 'Parsed request body:', requestBody);
    } catch (parseError) {
      log('ERROR', 'Failed to parse request body', { error: parseError.message });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { negocio_id, estado_anterior, estado_nuevo, sync_log_id } = requestBody;
    syncLogId = sync_log_id;

    if (!negocio_id || !estado_nuevo) {
      log('ERROR', 'Missing required parameters', {
        negocio_id,
        estado_nuevo,
        estado_anterior,
        received_body: requestBody
      });
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'failed', 'Missing required parameters: negocio_id and estado_nuevo are required', Date.now() - startTime);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: 'negocio_id and estado_nuevo are required',
          received: { negocio_id, estado_nuevo, estado_anterior }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('INFO', 'Processing business state change', {
      negocio_id,
      estado_anterior,
      estado_nuevo,
      sync_log_id: syncLogId
    });

    // Update sync log to processing if provided
    if (syncLogId) {
      await updateSyncLog(supabaseClient, syncLogId, 'processing', null, null);
    }

    // Get business info with user_id
    const { data: negocio, error: negocioError } = await supabaseClient
      .from('negocios')
      .select('user_id, hubspot_id')
      .eq('id', negocio_id)
      .single()

    log('DEBUG', 'Business data retrieved', { negocio, error: negocioError });

    if (negocioError || !negocio) {
      const errorMsg = 'Business not found';
      log('ERROR', errorMsg, negocioError);
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'failed', errorMsg, Date.now() - startTime);
      }
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skip if no HubSpot ID but mark as success since no action needed
    if (!negocio.hubspot_id) {
      const message = 'Business not synced with HubSpot';
      log('WARN', message, { negocio_id, user_id: negocio.user_id });
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'success', message, Date.now() - startTime);
      }
      
      return new Response(
        JSON.stringify({ message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's active HubSpot API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', negocio.user_id)
      .eq('activo', true)
      .single()

    log('DEBUG', 'API key retrieval', {
      user_id: negocio.user_id,
      hasApiKey: !!apiKeyData,
      error: apiKeyError
    });

    if (apiKeyError || !apiKeyData) {
      const errorMsg = 'No active HubSpot API key found';
      log('ERROR', errorMsg, apiKeyError);
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'failed', errorMsg, Date.now() - startTime);
      }
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stage mapping for the new state
    const { data: stageMapping, error: mappingError } = await supabaseClient
      .from('hubspot_stage_mapping')
      .select('stage_id')
      .eq('user_id', negocio.user_id)
      .eq('estado_negocio', estado_nuevo)
      .single()

    log('DEBUG', 'Stage mapping retrieval', {
      user_id: negocio.user_id,
      estado_nuevo,
      stageMapping,
      error: mappingError
    });

    if (mappingError || !stageMapping) {
      const message = 'No stage mapping configured for this state';
      log('WARN', message, { estado_nuevo, user_id: negocio.user_id, error: mappingError });
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'success', message, Date.now() - startTime);
      }
      
      return new Response(
        JSON.stringify({ message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    log('INFO', 'Updating HubSpot deal stage', {
      dealId: negocio.hubspot_id,
      stageId: stageMapping.stage_id,
      estado_nuevo
    });

    // Perform HubSpot update with retry logic
    const result = await updateHubSpotDealWithRetry(
      negocio.hubspot_id,
      stageMapping.stage_id,
      apiKeyData.api_key,
      0
    );

    if (result.success) {
      const executionTime = Date.now() - startTime;
      log('INFO', `Successfully updated HubSpot deal in ${executionTime}ms`, result.data);
      
      if (syncLogId) {
        await updateSyncLog(
          supabaseClient, 
          syncLogId, 
          'success', 
          null, 
          executionTime, 
          { hubspot_deal_id: result.data.id }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Deal stage updated in HubSpot',
          hubspot_deal_id: result.data.id,
          execution_time_ms: executionTime
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      const executionTime = Date.now() - startTime;
      log('ERROR', 'Failed to update HubSpot deal after retries', result.error);
      
      if (syncLogId) {
        await updateSyncLog(supabaseClient, syncLogId, 'failed', result.error, executionTime);
      }

      return new Response(
        JSON.stringify({ error: 'Failed to update deal in HubSpot after retries' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    log('ERROR', 'Unexpected error', error);
    
    if (syncLogId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      await updateSyncLog(supabaseClient, syncLogId, 'failed', error.message, executionTime);
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to update sync log
async function updateSyncLog(
  supabaseClient: any, 
  syncLogId: string, 
  status: string, 
  errorMessage: string | null, 
  executionTime: number | null,
  responseData?: any
) {
  try {
    await supabaseClient
      .from('hubspot_sync_log')
      .update({
        status,
        error_message: errorMessage,
        execution_time_ms: executionTime,
        processed_at: new Date().toISOString(),
        response_payload: responseData,
        updated_at: new Date().toISOString()
      })
      .eq('id', syncLogId);
  } catch (error) {
    log('ERROR', 'Failed to update sync log', { syncLogId, error });
  }
}

// Enhanced HubSpot update function with retry logic
async function updateHubSpotDealWithRetry(
  dealId: string, 
  stageId: string, 
  apiKey: string, 
  retryCount: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const updateResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            dealstage: stageId
          }
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      
      // Check if error is retryable
      if (updateResponse.status >= 500 || updateResponse.status === 429) {
        if (retryCount < MAX_RETRIES) {
          log('WARN', `Retryable error (${updateResponse.status}), retrying in ${RETRY_DELAYS[retryCount]}ms`, {
            dealId,
            retryCount: retryCount + 1,
            error: errorText
          });
          
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
          return updateHubSpotDealWithRetry(dealId, stageId, apiKey, retryCount + 1);
        }
      }
      
      throw new HubSpotSyncError(
        `HubSpot API error: ${errorText}`, 
        updateResponse.status.toString(),
        updateResponse.status >= 500 || updateResponse.status === 429
      );
    }

    const updatedDeal = await updateResponse.json();
    return { success: true, data: updatedDeal };
    
  } catch (error) {
    if (error instanceof HubSpotSyncError && error.retryable && retryCount < MAX_RETRIES) {
      log('WARN', `Retrying due to ${error.code}`, { dealId, retryCount: retryCount + 1 });
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
      return updateHubSpotDealWithRetry(dealId, stageId, apiKey, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
}