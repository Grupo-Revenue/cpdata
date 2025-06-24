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
    closedate: string;
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

    const { action, negocioId, hubspotDealId, userId, resolvedState, resolvedAmount, forceAmountSync, checkAmounts } = await req.json()
    console.log('Bidirectional sync action:', action, { negocioId, hubspotDealId, userId, forceAmountSync, checkAmounts })

    switch (action) {
      case 'sync_to_hubspot':
        return await syncToHubSpot(supabase, negocioId, userId, forceAmountSync)
      
      case 'sync_from_hubspot':
        return await syncFromHubSpot(supabase, hubspotDealId, userId)
      
      case 'poll_changes':
        return await pollHubSpotChanges(supabase, userId, checkAmounts)
      
      case 'mass_sync_amounts':
        return await massSyncAmounts(supabase, userId)
      
      case 'resolve_conflict':
        return await resolveConflict(supabase, negocioId, userId, resolvedState, resolvedAmount)
      
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

async function syncToHubSpot(supabase: any, negocioId: string, userId: string, forceAmountSync: boolean = false) {
  console.log('Starting sync to HubSpot for negocio:', negocioId, 'Force amount sync:', forceAmountSync)
  
  // Get business data with related data for value calculation
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

  // Calculate current business value
  const currentValue = calculateBusinessValue(negocio)
  console.log('Calculated business value:', currentValue)

  const dealData = {
    dealname: `${negocio.nombre_evento} - #${negocio.numero}`,
    dealstage: mapping.hubspot_stage_id,
    amount: currentValue,
    pipeline: mapping.hubspot_pipeline_id,
  }

  // Add close date if available
  if (negocio.fechaCierre) {
    // Convert to timestamp in milliseconds for HubSpot
    const closeDateTimestamp = new Date(negocio.fechaCierre).getTime()
    dealData.closedate = closeDateTimestamp.toString()
  }

  let hubspotDealId = existingSync?.hubspot_deal_id
  let amountUpdated = false

  try {
    if (hubspotDealId) {
      // For existing deals, check if we need to update the amount
      if (forceAmountSync) {
        console.log('Force updating amount in HubSpot deal:', hubspotDealId)
      }
      
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

      amountUpdated = forceAmountSync || true // Always consider amount updated for now
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
      amountUpdated = true
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
        new_amount: parseFloat(currentValue),
        hubspot_new_stage: mapping.hubspot_stage_id,
        success: true,
        sync_direction: 'outbound'
      })

    console.log('Successfully synced to HubSpot:', hubspotDealId, 'Amount updated:', amountUpdated)
    return new Response(
      JSON.stringify({ success: true, hubspotDealId, amountUpdated }),
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

  // Fetch deal from HubSpot with close date
  const dealResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}?properties=dealname,dealstage,amount,closedate,hs_lastmodifieddate`, {
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
  console.log('Fetched HubSpot deal:', deal.id, 'stage:', deal.properties.dealstage, 'amount:', deal.properties.amount, 'closedate:', deal.properties.closedate)

  // Get current business data with budgets for amount comparison
  const { data: negocio } = await supabase
    .from('negocios')
    .select(`
      *,
      presupuestos(*)
    `)
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

  // Check for changes
  const currentAppAmount = calculateBusinessValue(negocio)
  const hubspotAmount = parseFloat(deal.properties.amount || '0')
  
  const stateChanged = negocio.estado !== mapping.business_state
  const amountChanged = Math.abs(parseFloat(currentAppAmount) - hubspotAmount) > 0.01 // Allow for small rounding differences
  
  // Check close date changes
  let closeDateChanged = false
  let newCloseDate = null
  
  if (deal.properties.closedate) {
    // Convert HubSpot timestamp to date string
    const hubspotCloseDate = new Date(parseInt(deal.properties.closedate)).toISOString().split('T')[0]
    const currentCloseDate = negocio.fechaCierre
    
    if (currentCloseDate !== hubspotCloseDate) {
      closeDateChanged = true
      newCloseDate = hubspotCloseDate
    }
  } else if (negocio.fechaCierre) {
    // HubSpot has no close date but we have one
    closeDateChanged = true
    newCloseDate = null
  }
  
  console.log('Comparison:', {
    currentState: negocio.estado,
    newState: mapping.business_state,
    stateChanged,
    currentAmount: currentAppAmount,
    hubspotAmount,
    amountChanged,
    currentCloseDate: negocio.fechaCierre,
    newCloseDate,
    closeDateChanged
  })

  if (!stateChanged && !amountChanged && !closeDateChanged) {
    console.log('No changes detected, skipping update')
    return new Response(
      JSON.stringify({ 
        success: true, 
        newState: mapping.business_state, 
        newAmount: currentAppAmount,
        changed: false,
        stateChanged: false,
        amountChanged: false,
        closeDateChanged: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Prepare update data
  const updateData: any = {}
  
  if (stateChanged) {
    updateData.estado = mapping.business_state
  }
  
  if (closeDateChanged) {
    updateData.fechaCierre = newCloseDate
  }

  // Update business if needed
  if (Object.keys(updateData).length > 0) {
    console.log('Updating business with:', updateData)
    const { error: updateError } = await supabase
      .from('negocios')
      .update(updateData)
      .eq('id', negocioId)

    if (updateError) {
      console.error('Error updating business:', updateError)
      throw updateError
    }
  }

  // Note: We don't sync amounts from HubSpot to the app since our app is the source of truth for amounts
  // The amount in HubSpot should reflect the calculated total from our budgets

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
      new_state: stateChanged ? mapping.business_state : negocio.estado,
      old_amount: parseFloat(currentAppAmount),
      new_amount: hubspotAmount,
      hubspot_new_stage: deal.properties.dealstage,
      success: true,
      sync_direction: 'inbound'
    })

  console.log('Successfully synced from HubSpot')
  return new Response(
    JSON.stringify({ 
      success: true, 
      newState: stateChanged ? mapping.business_state : negocio.estado, 
      newAmount: stateChanged ? currentAppAmount : undefined,
      newCloseDate: closeDateChanged ? newCloseDate : undefined,
      changed: stateChanged || amountChanged || closeDateChanged,
      stateChanged,
      amountChanged: false, // We don't change amounts from HubSpot
      closeDateChanged
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function massSyncAmounts(supabase: any, userId: string) {
  console.log('Starting mass amount sync for user:', userId)
  
  // Get all synced businesses for the user
  const { data: syncedBusinesses } = await supabase
    .from('hubspot_sync')
    .select(`
      negocio_id,
      hubspot_deal_id,
      negocios!inner(user_id, presupuestos(*))
    `)
    .eq('negocios.user_id', userId)

  console.log('Found synced businesses for mass amount sync:', syncedBusinesses?.length || 0)

  const results = { updated: 0, failed: 0, skipped: 0 }

  for (const business of syncedBusinesses || []) {
    try {
      console.log('Mass syncing amounts for business:', business.negocio_id)
      const result = await syncToHubSpot(supabase, business.negocio_id, userId, true) // Force amount sync
      const resultData = await result.json()
      
      if (resultData.success) {
        results.updated++
      } else {
        results.failed++
      }
    } catch (error) {
      console.error('Error in mass sync for business:', business.negocio_id, error.message)
      results.failed++
    }
  }

  console.log('Mass amount sync complete:', results)
  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function pollHubSpotChanges(supabase: any, userId: string, checkAmounts: boolean = false) {
  console.log('Starting to poll HubSpot changes for user:', userId, 'Check amounts:', checkAmounts)
  
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
        changed: resultData.changed,
        stateChanged: resultData.stateChanged,
        amountChanged: resultData.amountChanged,
        closeDateChanged: resultData.closeDateChanged
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

async function resolveConflict(supabase: any, negocioId: string, userId: string, resolvedState: string, resolvedAmount?: number) {
  console.log('Resolving conflict for negocio:', negocioId, 'with state:', resolvedState, 'amount:', resolvedAmount)
  
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

  // If amount is provided, we would update budgets here, but that's complex
  // For now, we'll just sync the current calculated amount to HubSpot
  
  // Sync the resolved state to HubSpot
  try {
    await syncToHubSpot(supabase, negocioId, userId, true)
  } catch (error) {
    console.log('Warning: Could not sync resolved conflict to HubSpot:', error.message)
  }

  // Log the resolution
  await supabase
    .from('hubspot_sync_log')
    .insert({
      negocio_id: negocioId,
      operation_type: 'conflict_resolution',
      new_state: resolvedState,
      new_amount: resolvedAmount,
      success: true,
      conflict_resolved: true,
      sync_direction: 'bidirectional'
    })

  return new Response(
    JSON.stringify({ success: true, resolvedState, resolvedAmount }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function calculateBusinessValue(negocio: any): string {
  const total = negocio.presupuestos?.reduce((sum: number, p: any) => sum + parseFloat(p.total || 0), 0) || 0
  return total.toString()
}
