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

    // Get user's active HubSpot API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', negocio.user_id)
      .eq('activo', true)
      .single()

    console.log('🔑 [HubSpot Deal Update] API key retrieval:', {
      user_id: negocio.user_id,
      hasApiKey: !!apiKeyData,
      error: apiKeyError
    })

    if (apiKeyError || !apiKeyData) {
      console.error('❌ [HubSpot Deal Update] Error getting HubSpot API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: 'No active HubSpot API key found' }),
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

    console.log('🎯 [HubSpot Deal Update] Stage mapping retrieval:', {
      user_id: negocio.user_id,
      estado_nuevo,
      stageMapping,
      error: mappingError
    })

    if (mappingError || !stageMapping) {
      console.warn('⚠️ [HubSpot Deal Update] No stage mapping found for this state:', { estado_nuevo, user_id: negocio.user_id, error: mappingError })
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

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ [HubSpot Deal Update] HubSpot API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update deal stage in HubSpot',
          details: errorText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updatedDeal = await updateResponse.json()
    console.log('✅ [HubSpot Deal Update] Successfully updated HubSpot deal stage:', {
      dealId: updatedDeal.id,
      stageId: stageMapping.stage_id
    })

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