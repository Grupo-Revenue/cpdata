
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

    const { action, negocioId, hubspotDealId, userId, resolvedState } = await req.json()
    console.log('Bidirectional sync action:', action, { negocioId, hubspotDealId, userId })

    switch (action) {
      case 'sync_to_hubspot':
        return await syncToHubSpot(supabase, negocioId, userId)
      
      case 'sync_from_hubspot':
        return await syncFromHubSpot(supabase, hubspotDealId, userId)
      
      case 'poll_changes':
        return await pollHubSpotChanges(supabase, userId)
      
      case 'resolve_conflict':
        return await resolveConflict(supabase, negocioId, userId, resolvedState)
      
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
  console.log('Starting sync to HubSpot for negocio:', negocioId)
  
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

  if (negocioError) {
    console.error('Error fetching negocio:', negocioError)
    throw negocioError
  }

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

  if (apiKeyError) {
    console.error('Error fetching API key:', apiKeyError)
    throw apiKeyError
  }

  // Get state mapping
  const { data: mapping, error: mappingError } = await supabase
    .from('hubspot_state_mapping')
    .select('*')
    .eq('user_id', userId)
    .eq('business_state', negocio.estado)
    .single()

  if (mappingError) {
    console.error('No mapping found for business state:', negocio.estado)
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
        const errorText = await updateResponse.text()
        console.error('HubSpot API error:', errorText)
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
        const errorText = await createResponse.text()
        console.error('HubSpot API error:', errorText)
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

    console.log('Successfully synced to HubSpot:', hubspotDealId)
    return new Response(
      JSON.stringify({ success: true, hubspotDealId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing to HubSpot:', error)
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

async function syncFromHubSpot(supabase: any, hubspotDealIdOrNegocioId: string, userId: string) {
  console.log('Starting sync from HubSpot for:', hubspotDealIdOrNegocioId)
  
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

  if (!apiKeyData?.api_key) {
    throw new Error('HubSpot API key not found')
  }

  let hubspotDealId = hubspotDealIdOrNegocioId
  let negocioId = null

  // Check if we got a negocio ID instead of HubSpot deal ID
  if (hubspotDealIdOrNegocioId.length === 36) { // UUID length
    const { data: syncRecord } = await supabase
      .from('hubspot_sync')
      .select('hubspot_deal_id, negocio_id')
      .eq('negocio_id', hubspotDealIdOrNegocioId)
      .single()

    if (syncRecord) {
      hubspotDealId = syncRecord.hubspot_deal_id
      negocioId = syncRecord.negocio_id
    }
  } else {
    // Find corresponding business
    const { data: syncRecord } = await supabase
      .from('hubspot_sync')
      .select('negocio_id')
      .eq('hubspot_deal_id', hubspotDealId)
      .single()

    if (syncRecord) {
      negocioId = syncRecord.negocio_id
    }
  }

  if (!negocioId || !hubspotDealId) {
    throw new Error('No corresponding business or HubSpot deal found')
  }

  // Fetch deal from HubSpot
  const dealResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}`, {
    headers: {
      'Authorization': `Bearer ${apiKeyData.api_key}`
    }
  })

  if (!dealResponse.ok) {
    const errorText = await dealResponse.text()
    console.error('Failed to fetch deal from HubSpot:', errorText)
    throw new Error(`Failed to fetch deal from HubSpot: ${dealResponse.statusText}`)
  }

  const deal: HubSpotDeal = await dealResponse.json()
  console.log('Fetched HubSpot deal:', deal.id, 'stage:', deal.properties.dealstage)

  // Get current business state
  const { data: negocio } = await supabase
    .from('negocios')
    .select('estado, updated_at')
    .eq('id', negocioId)
    .single()

  if (!negocio) {
    throw new Error('Business not found')
  }

  // Find business state mapping from HubSpot stage
  const { data: mapping } = await supabase
    .from('hubspot_state_mapping')
    .select('business_state')
    .eq('user_id', userId)
    .eq('hubspot_stage_id', deal.properties.dealstage)
    .single()

  if (!mapping) {
    console.error(`No mapping found for HubSpot stage: ${deal.properties.dealstage}`)
    throw new Error(`No mapping found for HubSpot stage: ${deal.properties.dealstage}`)
  }

  // Check if state actually changed
  if (negocio.estado === mapping.business_state) {
    console.log('States already match, no update needed')
    return new Response(
      JSON.stringify({ success: true, newState: mapping.business_state, changed: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Updating business state from ${negocio.estado} to ${mapping.business_state}`)

  // Update business state
  const { error: updateError } = await supabase
    .from('negocios')
    .update({ estado: mapping.business_state })
    .eq('id', negocioId)

  if (updateError) {
    console.error('Error updating business state:', updateError)
    throw updateError
  }

  // Update sync record
  await supabase
    .from('hubspot_sync')
    .update({
      last_sync_at: new Date().toISOString(),
      hubspot_last_modified: deal.properties.hs_lastmodifieddate
    })
    .eq('negocio_id', negocioId)

  // Log the operation
  await supabase
    .from('hubspot_sync_log')
    .insert({
      negocio_id: negocioId,
      hubspot_deal_id: hubspotDealId,
      operation_type: 'hubspot_to_app',
      old_state: negocio.estado,
      new_state: mapping.business_state,
      hubspot_new_stage: deal.properties.dealstage,
      success: true,
      sync_direction: 'inbound'
    })

  console.log('Successfully synced from HubSpot')
  return new Response(
    JSON.stringify({ success: true, newState: mapping.business_state, changed: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function pollHubSpotChanges(supabase: any, userId: string) {
  console.log('Starting to poll HubSpot changes for user:', userId)
  
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

  console.log('Found synced businesses:', syncedBusinesses?.length || 0)

  const results = []

  for (const business of syncedBusinesses || []) {
    try {
      console.log('Processing business:', business.negocio_id)
      const result = await syncFromHubSpot(supabase, business.hubspot_deal_id, userId)
      const resultData = await result.json()
      results.push({ 
        negocio_id: business.negocio_id, 
        success: resultData.success,
        changed: resultData.changed 
      })
    } catch (error) {
      console.error('Error syncing business:', business.negocio_id, error.message)
      results.push({ 
        negocio_id: business.negocio_id, 
        success: false, 
        error: error.message 
      })
    }
  }

  // Update last poll time
  await supabase
    .from('hubspot_config')
    .update({ last_poll_at: new Date().toISOString() })
    .eq('user_id', userId)

  console.log('Polling complete, results:', results)
  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function resolveConflict(supabase: any, negocioId: string, userId: string, resolvedState: string) {
  console.log('Resolving conflict for negocio:', negocioId, 'with state:', resolvedState)
  
  // Update business with resolved state
  const { error: updateError } = await supabase
    .from('negocios')
    .update({ estado: resolvedState })
    .eq('id', negocioId)
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error resolving conflict:', updateError)
    throw updateError
  }

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
