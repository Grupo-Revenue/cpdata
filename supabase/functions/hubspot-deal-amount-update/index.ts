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
    const { negocio_id, amount, trigger_source } = await req.json()

    if (!negocio_id) {
      console.error('🚫 [HubSpot Amount Update] Missing negocio_id:', {
        negocio_id,
        received_body: { negocio_id, amount, trigger_source }
      })
      return new Response(
        JSON.stringify({ error: 'Missing negocio_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💰 [HubSpot Amount Update] Processing business amount update:', {
      negocio_id,
      amount: amount || 'auto-calculate',
      trigger_source: trigger_source || 'unknown'
    })

    // Get business info with presupuestos to calculate amount
    const { data: negocio, error: negocioError } = await supabaseClient
      .from('negocios')
      .select(`
        user_id,
        hubspot_id,
        presupuestos:presupuestos(
          id,
          total,
          estado
        )
      `)
      .eq('id', negocio_id)
      .single()

    console.log('📊 [HubSpot Amount Update] Business data retrieved:', {
      negocio,
      error: negocioError
    })

    if (negocioError || !negocio) {
      console.error('❌ [HubSpot Amount Update] Error getting business:', negocioError)
      return new Response(
        JSON.stringify({ error: 'Business not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Skip if no HubSpot ID
    if (!negocio.hubspot_id) {
      console.log('⚠️ [HubSpot Amount Update] Business has no HubSpot ID, skipping sync:', {
        negocio_id,
        user_id: negocio.user_id
      })
      return new Response(
        JSON.stringify({ message: 'Business not synced with HubSpot' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active HubSpot API key (global)
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('activo', true)
      .single()

    console.log('🔑 [HubSpot Amount Update] API key retrieval:', {
      hasApiKey: !!apiKeyData,
      error: apiKeyError
    })

    if (apiKeyError || !apiKeyData) {
      console.error('❌ [HubSpot Amount Update] Error getting HubSpot API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: 'No active HubSpot API key found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate business amount if not provided
    let businessAmount = amount;
    if (businessAmount === undefined || businessAmount === null) {
      // Calculate total value based on presupuestos priority:
      // 1. Sum all approved budgets first (highest priority)
      const approvedTotal = negocio.presupuestos
        .filter(p => p.estado === 'aprobado')
        .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

      if (approvedTotal > 0) {
        businessAmount = approvedTotal;
      } else {
        // 2. If no approved budgets, use sent budgets
        const sentTotal = negocio.presupuestos
          .filter(p => p.estado === 'enviado')
          .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

        if (sentTotal > 0) {
          businessAmount = sentTotal;
        } else {
          // 3. If no sent budgets, use draft budgets
          const draftTotal = negocio.presupuestos
            .filter(p => p.estado === 'borrador')
            .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);
          businessAmount = draftTotal;
        }
      }
    }

    // Format amount correctly for HubSpot (should be numeric string)
    const formattedAmount = Number(businessAmount).toString()

    console.log('🚀 [HubSpot Amount Update] Updating HubSpot deal amount:', {
      dealId: negocio.hubspot_id,
      amount: formattedAmount,
      originalAmount: amount,
      calculatedAmount: businessAmount,
      trigger_source: trigger_source || 'unknown',
      presupuestos_count: negocio.presupuestos?.length || 0
    })

    // Update deal amount in HubSpot
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
            amount: formattedAmount
          }
        })
      }
    )

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error('❌ [HubSpot Amount Update] HubSpot API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update deal amount in HubSpot',
          details: errorText
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const updatedDeal = await updateResponse.json()
    console.log('✅ [HubSpot Amount Update] Successfully updated HubSpot deal amount:', {
      dealId: updatedDeal.id,
      amount: formattedAmount
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deal amount updated in HubSpot',
        hubspot_deal_id: updatedDeal.id,
        amount: formattedAmount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ [HubSpot Amount Update] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})