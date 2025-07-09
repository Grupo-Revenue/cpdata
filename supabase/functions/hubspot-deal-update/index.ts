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
    const { negocio_id, estado_anterior, estado_nuevo, update_type } = await req.json()

    if (!negocio_id || (!estado_nuevo && !update_type)) {
      console.error('🚫 [HubSpot Deal Update] Missing required parameters:', {
        negocio_id,
        estado_nuevo,
        update_type,
        received_body: { negocio_id, estado_anterior, estado_nuevo, update_type }
      })
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 [HubSpot Deal Update] Processing request:', {
      negocio_id,
      update_type,
      estado_anterior,
      estado_nuevo
    })

    // Get business info with user_id
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

    let updateProperties = {}
    let updateMessage = ''

    // Handle different update types
    if (update_type === 'value') {
      // Calculate business value from approved budgets
      const { data: presupuestos, error: presupuestosError } = await supabaseClient
        .from('presupuestos')
        .select('total, estado')
        .eq('negocio_id', negocio_id)

      if (presupuestosError) {
        console.error('❌ [HubSpot Deal Update] Error getting budgets:', presupuestosError)
        return new Response(
          JSON.stringify({ error: 'Failed to calculate business value' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate total value from approved budgets, fallback to sent budgets
      const approvedTotal = presupuestos
        .filter(p => p.estado === 'aprobado')
        .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0)

      const businessValue = approvedTotal > 0 ? approvedTotal : presupuestos
        .filter(p => p.estado === 'enviado')
        .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0)

      console.log('💰 [HubSpot Deal Update] Calculated business value:', {
        businessValue,
        approvedTotal,
        totalBudgets: presupuestos.length
      })

      updateProperties = { amount: businessValue.toString() }
      updateMessage = 'Deal value updated in HubSpot'

    } else {
      // Handle state update
      const { data: stageMapping, error: mappingError } = await supabaseClient
        .from('hubspot_stage_mapping')
        .select('stage_id')
        .eq('user_id', negocio.user_id)
        .eq('estado_negocio', estado_nuevo)
        .single()

      console.log('🗺️ [HubSpot Deal Update] Stage mapping retrieval:', {
        user_id: negocio.user_id,
        estado_nuevo,
        stageMapping,
        error: mappingError
      })

      if (mappingError || !stageMapping) {
        console.log('⚠️ [HubSpot Deal Update] No stage mapping found for state:', {
          estado_nuevo,
          user_id: negocio.user_id,
          error: mappingError
        })
        return new Response(
          JSON.stringify({ message: 'No stage mapping configured for this state' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      updateProperties = { dealstage: stageMapping.stage_id }
      updateMessage = 'Deal stage updated in HubSpot'
    }

    console.log('🚀 [HubSpot Deal Update] Updating HubSpot deal:', {
      dealId: negocio.hubspot_id,
      properties: updateProperties,
      updateType: update_type || 'state'
    })

    // Update deal in HubSpot
    const updateResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: updateProperties
        })
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('HubSpot deal update error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to update deal in HubSpot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updatedDeal = await updateResponse.json()
    console.log('Successfully updated HubSpot deal:', updatedDeal.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: updateMessage,
        hubspot_deal_id: updatedDeal.id,
        updated_properties: updateProperties
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})