
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔧 [HubSpot Deal Update] Request received:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    })

    // Detect if call is from database trigger (uses Service Role Key) or frontend (uses Anon Key)
    const authHeader = req.headers.get('Authorization')
    const isFromTrigger = authHeader?.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnR1dXZpZ2NxcGlicGZjeGNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDM3ODQzMSwiZXhwIjoyMDY1OTU0NDMxfQ.u5kUfOa1Lw2qzmbFhQ0YhD1Qe_VwAGDgDa_oBTa7ZQ0')
    
    console.log('🔍 [HubSpot Deal Update] Call origin detected:', {
      isFromTrigger,
      authHeaderLength: authHeader?.length
    })

    // Initialize Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('✅ [HubSpot Deal Update] Supabase client initialized with SERVICE_ROLE')

    // Parse request body
    const { negocio_id, estado_anterior, estado_nuevo } = await req.json()

    if (!negocio_id || !estado_nuevo) {
      console.error('🚫 [HubSpot Deal Update] Missing required parameters:', {
        negocio_id,
        estado_nuevo,
        received_body: { negocio_id, estado_nuevo }
      })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 [HubSpot Deal Update] Processing business state change:', {
      negocio_id,
      estado_anterior,
      estado_nuevo
    })

    // Get business info with user_id and hubspot_id
    const { data: negocio, error: negocioError } = await supabaseClient
      .from('negocios')
      .select('user_id, hubspot_id')
      .eq('id', negocio_id)
      .single()

    console.log('📊 [HubSpot Deal Update] Business data retrieved:', {
      negocio,
      error: negocioError
    })

    if (negocioError || !negocio) {
      console.error('❌ [HubSpot Deal Update] Error getting business:', negocioError)
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skip if no HubSpot ID
    if (!negocio.hubspot_id) {
      console.log('⚠️ [HubSpot Deal Update] Business has no HubSpot ID, skipping sync:', {
        negocio_id,
        user_id: negocio.user_id
      })
      return new Response(
        JSON.stringify({ message: 'Business not synced with HubSpot' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the global active HubSpot API key (not user-specific)
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key, user_id')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('🔑 [HubSpot Deal Update] Global API key retrieval:', {
      hasApiKey: !!apiKeyData,
      apiKeyUserId: apiKeyData?.user_id,
      businessUserId: negocio.user_id,
      error: apiKeyError
    })

    if (apiKeyError || !apiKeyData) {
      console.error('❌ [HubSpot Deal Update] Error getting global HubSpot API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: 'No active global HubSpot API key found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stage mapping for the new state (global mapping, not user-specific)
    const { data: stageMapping, error: mappingError } = await supabaseClient
      .from('hubspot_stage_mapping')
      .select('stage_id, user_id')
      .eq('estado_negocio', estado_nuevo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('🎯 [HubSpot Deal Update] Stage mapping retrieval:', {
      estado_nuevo,
      stageMapping,
      error: mappingError
    })

    if (mappingError || !stageMapping) {
      console.warn('⚠️ [HubSpot Deal Update] No stage mapping found for this state:', { 
        estado_nuevo, 
        error: mappingError 
      })
      return new Response(
        JSON.stringify({ message: 'No stage mapping configured for this state' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🚀 [HubSpot Deal Update] Updating HubSpot deal stage:', {
      dealId: negocio.hubspot_id,
      stageId: stageMapping.stage_id,
      estado_nuevo
    })

    // Update deal stage in HubSpot
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
    )

    const responseText = await updateResponse.text()
    console.log('📡 [HubSpot Deal Update] HubSpot API response:', {
      status: updateResponse.status,
      statusText: updateResponse.statusText,
      responseText: responseText.substring(0, 500) // Log first 500 chars
    })

    if (!updateResponse.ok) {
      console.error('❌ [HubSpot Deal Update] HubSpot API error:', {
        status: updateResponse.status,
        statusText: updateResponse.statusText,
        response: responseText
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update deal stage in HubSpot',
          details: responseText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updatedDeal = JSON.parse(responseText)
    console.log('✅ [HubSpot Deal Update] Successfully updated HubSpot deal stage:', {
      dealId: updatedDeal.id,
      stageId: stageMapping.stage_id
    })

    // Update the sync log status to success
    const updateLogResult = await supabaseClient
      .from('hubspot_sync_log')
      .update({
        status: 'success',
        processed_at: new Date().toISOString(),
        response_payload: updatedDeal,
        execution_time_ms: Date.now() // Simple execution time tracking
      })
      .eq('negocio_id', negocio_id)
      .eq('operation_type', 'estado_change')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)

    console.log('📝 [HubSpot Deal Update] Sync log updated:', updateLogResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deal stage updated in HubSpot',
        hubspot_deal_id: updatedDeal.id,
        stage_id: stageMapping.stage_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ [HubSpot Deal Update] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
