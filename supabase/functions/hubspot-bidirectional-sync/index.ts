
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount: string;
    hs_lastmodifieddate: string;
    [key: string]: any;
  };
}

interface BusinessStateMapping {
  id: string;
  business_state: string;
  hubspot_pipeline_id: string;
  hubspot_stage_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, negocioId, hubspotDealId, userId, webhookData } = await req.json()

    switch (action) {
      case 'sync_to_hubspot':
        return await syncToHubSpot(supabase, negocioId, userId)
      
      case 'sync_from_hubspot':
        return await syncFromHubSpot(supabase, hubspotDealId, userId)
      
      case 'handle_webhook':
        return await handleWebhook(supabase, webhookData)
      
      case 'poll_changes':
        return await pollHubSpotChanges(supabase, userId)
      
      case 'resolve_conflict':
        return await resolveConflict(supabase, negocioId, userId, req.json())
      
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error in bidirectional sync:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncToHubSpot(supabase: any, negocioId: string, userId: string) {
  // Get business data
  const { data: negocio, error: negocioError } = await supabase
    .from('negocios')
    .select(`
      *,
      contacto:contactos(*),
      presupuestos(*)
    `)
    .eq('id', negocioId)
    .eq('user_id', userId)
    .single()

  if (negocioError) throw negocioError

  // Get HubSpot configuration
  const { data: config, error: configError } = await supabase
    .from('hubspot_config')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (configError || !config.api_key_set) {
    throw new Error('HubSpot not configured')
  }

  // Get API key
  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('hubspot_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .single()

  if (apiKeyError) throw apiKeyError

  // Get state mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('hubspot_state_mapping')
    .select('*')
    .eq('user_id', userId)
    .eq('business_state', negocio.estado)
    .single()

  if (mappingError) {
    throw new Error(`No mapping found for business state: ${negocio.estado}`)
  }

  // Check if deal exists in HubSpot
  const { data: existingSync } = await supabase
    .from('hubspot_sync')
    .select('hubspot_deal_id')
    .eq('negocio_id', negocioId)
    .single()

  const dealData = {
    dealname: `${negocio.nombre_evento} - #${negocio.numero}`,
    dealstage: mapping.hubspot_stage_id,
    amount: calculateBusinessValue(negocio),
    pipeline: mapping.hubspot_pipeline_id,
    // Add contact association
    hubspot_owner_id: null // Could be mapped from user
  }

  let hubspotDealId = existingSync?.hubspot_deal_id

  try {
    if (hubspotDealId) {
      // Update existing deal
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: dealData })
      })

      if (!updateResponse.ok) {
        throw new Error(`HubSpot API error: ${updateResponse.statusText}`)
      }
    } else {
      // Create new deal
      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: dealData })
      })

      if (!createResponse.ok) {
        throw new Error(`HubSpot API error: ${createResponse.statusText}`)
      }

      const newDeal = await createResponse.json()
      hubspotDealId = newDeal.id
    }

    // Update sync record
    await supabase
      .from('hubspot_sync')
      .upsert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        last_hubspot_sync_at: new Date().toISOString(),
        app_last_modified: negocio.updated_at
      })

    // Log the operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        operation_type: 'app_to_hubspot',
        new_state: negocio.estado,
        hubspot_new_stage: mapping.hubspot_stage_id,
        success: true,
        sync_direction: 'outbound'
      })

    return new Response(
      JSON.stringify({ success: true, hubspotDealId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    // Log failed operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        operation_type: 'app_to_hubspot',
        new_state: negocio.estado,
        success: false,
        error_message: error.message,
        sync_direction: 'outbound'
      })

    throw error
  }
}

async function syncFromHubSpot(supabase: any, hubspotDealId: string, userId: string) {
  // Get HubSpot configuration and API key
  const { data: config } = await supabase
    .from('hubspot_config')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: apiKeyData } = await supabase
    .from('hubspot_api_keys')
    .select('api_key')
    .eq('user_id', userId)
    .single()

  // Fetch deal from HubSpot
  const dealResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}`, {
    headers: {
      'Authorization': `Bearer ${apiKeyData.api_key}`
    }
  })

  if (!dealResponse.ok) {
    throw new Error(`Failed to fetch deal from HubSpot: ${dealResponse.statusText}`)
  }

  const deal: HubSpotDeal = await dealResponse.json()

  // Find corresponding business
  const { data: syncRecord } = await supabase
    .from('hubspot_sync')
    .select('negocio_id')
    .eq('hubspot_deal_id', hubspotDealId)
    .single()

  if (!syncRecord) {
    throw new Error('No corresponding business found for HubSpot deal')
  }

  // Get current business state
  const { data: negocio } = await supabase
    .from('negocios')
    .select('estado, updated_at')
    .eq('id', syncRecord.negocio_id)
    .single()

  // Find business state mapping from HubSpot stage
  const { data: mapping } = await supabase
    .from('hubspot_state_mapping')
    .select('business_state')
    .eq('user_id', userId)
    .eq('hubspot_stage_id', deal.properties.dealstage)
    .single()

  if (!mapping) {
    throw new Error(`No mapping found for HubSpot stage: ${deal.properties.dealstage}`)
  }

  // Check for conflicts
  const hubspotModified = new Date(deal.properties.hs_lastmodifieddate)
  const appModified = new Date(negocio.updated_at)

  if (Math.abs(hubspotModified.getTime() - appModified.getTime()) < 60000) {
    // Less than 1 minute difference, potential conflict
    if (negocio.estado !== mapping.business_state) {
      return await handleConflict(supabase, syncRecord.negocio_id, negocio.estado, mapping.business_state, config.conflict_resolution_strategy)
    }
  }

  // Update business state
  const { error: updateError } = await supabase
    .from('negocios')
    .update({ estado: mapping.business_state })
    .eq('id', syncRecord.negocio_id)

  if (updateError) throw updateError

  // Update sync record
  await supabase
    .from('hubspot_sync')
    .update({
      last_sync_at: new Date().toISOString(),
      hubspot_last_modified: deal.properties.hs_lastmodifieddate
    })
    .eq('negocio_id', syncRecord.negocio_id)

  // Log the operation
  await supabase
    .from('hubspot_sync_log')
    .insert({
      negocio_id: syncRecord.negocio_id,
      hubspot_deal_id: hubspotDealId,
      operation_type: 'hubspot_to_app',
      old_state: negocio.estado,
      new_state: mapping.business_state,
      hubspot_new_stage: deal.properties.dealstage,
      success: true,
      sync_direction: 'inbound'
    })

  return new Response(
    JSON.stringify({ success: true, newState: mapping.business_state }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleWebhook(supabase: any, webhookData: any) {
  // Validate webhook signature (implementation depends on HubSpot's webhook signature validation)
  
  // Process the webhook data
  for (const event of webhookData) {
    if (event.objectType === 'deal' && event.eventType === 'deal.propertyChange') {
      // Handle deal property changes
      await syncFromHubSpot(supabase, event.objectId, event.userId)
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function pollHubSpotChanges(supabase: any, userId: string) {
  // Get all synced deals for the user
  const { data: syncedBusinesses } = await supabase
    .from('hubspot_sync')
    .select(`
      negocio_id,
      hubspot_deal_id,
      hubspot_last_modified,
      negocios!inner(user_id)
    `)
    .eq('negocios.user_id', userId)

  const results = []

  for (const business of syncedBusinesses || []) {
    try {
      const result = await syncFromHubSpot(supabase, business.hubspot_deal_id, userId)
      results.push({ negocio_id: business.negocio_id, success: true })
    } catch (error) {
      results.push({ negocio_id: business.negocio_id, success: false, error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleConflict(supabase: any, negocioId: string, appState: string, hubspotState: string, strategy: string) {
  let resolvedState = appState

  switch (strategy) {
    case 'hubspot_wins':
      resolvedState = hubspotState
      break
    case 'app_wins':
      resolvedState = appState
      break
    case 'most_recent':
      // Would need to compare timestamps more carefully
      resolvedState = hubspotState
      break
    case 'manual':
    default:
      // Log conflict for manual resolution
      await supabase
        .from('hubspot_sync_log')
        .insert({
          negocio_id: negocioId,
          operation_type: 'conflict_resolution',
          old_state: appState,
          new_state: hubspotState,
          success: false,
          error_message: 'Manual conflict resolution required',
          sync_direction: 'bidirectional'
        })
      
      throw new Error('Conflict detected: manual resolution required')
  }

  // Apply resolved state
  await supabase
    .from('negocios')
    .update({ estado: resolvedState })
    .eq('id', negocioId)

  return resolvedState
}

async function resolveConflict(supabase: any, negocioId: string, userId: string, resolution: any) {
  const { resolvedState } = resolution

  // Update business with resolved state
  await supabase
    .from('negocios')
    .update({ estado: resolvedState })
    .eq('id', negocioId)
    .eq('user_id', userId)

  // Log the resolution
  await supabase
    .from('hubspot_sync_log')
    .insert({
      negocio_id: negocioId,
      operation_type: 'conflict_resolution',
      new_state: resolvedState,
      success: true,
      conflict_resolved: true,
      sync_direction: 'bidirectional'
    })

  return new Response(
    JSON.stringify({ success: true, resolvedState }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function calculateBusinessValue(negocio: any): string {
  const total = negocio.presupuestos?.reduce((sum: number, p: any) => sum + parseFloat(p.total || 0), 0) || 0
  return total.toString()
}
