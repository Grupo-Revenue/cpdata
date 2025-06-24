
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

interface SyncConflict {
  negocio_id: string;
  app_state: string;
  hubspot_state: string;
  app_amount?: number;
  hubspot_amount?: number;
  conflict_type: 'state' | 'amount' | 'both';
  timestamp: string;
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

    // Validate required parameters
    if (!userId) {
      throw new Error('Missing userId parameter')
    }

    switch (action) {
      case 'sync_to_hubspot':
        if (!negocioId) throw new Error('Missing negocioId for sync_to_hubspot')
        return await syncToHubSpot(supabase, negocioId, userId, forceAmountSync)
      
      case 'sync_from_hubspot':
        if (!hubspotDealId) throw new Error('Missing hubspotDealId for sync_from_hubspot')
        return await syncFromHubSpot(supabase, hubspotDealId, userId)
      
      case 'poll_changes':
        return await pollHubSpotChanges(supabase, userId, checkAmounts)
      
      case 'mass_sync_amounts':
        return await massSyncAmounts(supabase, userId)
      
      case 'resolve_conflict':
        if (!negocioId || !resolvedState) throw new Error('Missing parameters for resolve_conflict')
        return await resolveConflict(supabase, negocioId, userId, resolvedState, resolvedAmount)
      
      default:
        throw new Error(`Invalid action: ${action}`)
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
  console.log('=== SYNC TO HUBSPOT START ===')
  console.log('Negocio ID:', negocioId, 'Force Amount Sync:', forceAmountSync)
  
  try {
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
      throw new Error(`Failed to fetch business: ${negocioError.message}`)
    }

    if (!negocio) {
      throw new Error('Business not found')
    }

    console.log('Business data loaded:', negocio.numero, negocio.estado)

    // Get HubSpot configuration
    const { data: config, error: configError } = await supabase
      .from('hubspot_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !config?.api_key_set) {
      throw new Error('HubSpot not configured or API key not set')
    }

    // Get API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .single()

    if (apiKeyError || !apiKeyData?.api_key) {
      console.error('Error fetching API key:', apiKeyError)
      throw new Error('HubSpot API key not found')
    }

    // Get state mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('hubspot_state_mapping')
      .select('*')
      .eq('user_id', userId)
      .eq('business_state', negocio.estado)
      .single()

    if (mappingError || !mapping) {
      console.error('No mapping found for business state:', negocio.estado, mappingError)
      throw new Error(`No mapping configured for business state: ${negocio.estado}. Please configure state mappings first.`)
    }

    console.log('State mapping found:', negocio.estado, '->', mapping.hubspot_stage_id)

    // Check if deal exists in HubSpot
    const { data: existingSync } = await supabase
      .from('hubspot_sync')
      .select('hubspot_deal_id, app_last_modified')
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
    if (negocio.fecha_cierre && negocio.fecha_cierre !== '1970-01-01') {
      try {
        const closeDateTimestamp = new Date(negocio.fecha_cierre).getTime()
        dealData.closedate = closeDateTimestamp.toString()
        console.log('Added close date to deal:', negocio.fecha_cierre, 'as timestamp:', closeDateTimestamp)
      } catch (error) {
        console.error('Error parsing close date:', negocio.fecha_cierre, error)
      }
    }

    let hubspotDealId = existingSync?.hubspot_deal_id
    let amountUpdated = false

    if (hubspotDealId) {
      console.log('Updating existing HubSpot deal:', hubspotDealId)
      
      // Check for potential conflicts before updating
      if (!forceAmountSync && config.bidirectional_sync) {
        const conflictResult = await checkForConflicts(supabase, negocioId, userId, apiKeyData.api_key, hubspotDealId, negocio, currentValue, mapping)
        if (conflictResult.hasConflict) {
          console.log('Conflict detected, storing for manual resolution')
          await storeConflict(supabase, conflictResult.conflict)
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              conflict: true,
              conflictData: conflictResult.conflict,
              message: 'Conflict detected - manual resolution required'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
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
        throw new Error(`HubSpot API error: ${updateResponse.status} ${updateResponse.statusText}`)
      }

      amountUpdated = forceAmountSync || true
      console.log('Successfully updated HubSpot deal')
    } else {
      console.log('Creating new HubSpot deal')
      
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
        throw new Error(`HubSpot API error: ${createResponse.status} ${createResponse.statusText}`)
      }

      const newDeal = await createResponse.json()
      hubspotDealId = newDeal.id
      amountUpdated = true
      console.log('Successfully created HubSpot deal:', hubspotDealId)
    }

    // Update sync record with precedence timestamp
    await supabase
      .from('hubspot_sync')
      .upsert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        last_hubspot_sync_at: new Date().toISOString(),
        app_last_modified: negocio.updated_at,
        sync_direction: 'outbound'
      })

    // Log the operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        operation_type: 'app_to_hubspot',
        old_state: 'unknown',
        new_state: negocio.estado,
        old_amount: null,
        new_amount: parseFloat(currentValue),
        hubspot_old_stage: 'unknown',
        hubspot_new_stage: mapping.hubspot_stage_id,
        success: true,
        sync_direction: 'outbound',
        force_sync: forceAmountSync
      })

    console.log('=== SYNC TO HUBSPOT COMPLETE ===')
    return new Response(
      JSON.stringify({ success: true, hubspotDealId, amountUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing to HubSpot:', error)
    
    // Log failed operation
    try {
      await supabase
        .from('hubspot_sync_log')
        .insert({
          negocio_id: negocioId,
          operation_type: 'app_to_hubspot',
          new_state: 'unknown',
          success: false,
          error_message: error.message,
          sync_direction: 'outbound'
        })
    } catch (logError) {
      console.error('Failed to log sync error:', logError)
    }

    throw error
  }
}

async function checkForConflicts(supabase: any, negocioId: string, userId: string, apiKey: string, hubspotDealId: string, negocio: any, currentValue: number, mapping: any) {
  console.log('=== CHECKING FOR CONFLICTS ===')
  
  try {
    // Fetch current HubSpot deal data
    const hubspotResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}?properties=dealstage,amount,hs_lastmodifieddate,closedate`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!hubspotResponse.ok) {
      console.error('Failed to fetch HubSpot deal for conflict check')
      return { hasConflict: false }
    }

    const hubspotDeal = await hubspotResponse.json()
    console.log('HubSpot deal data for conflict check:', hubspotDeal.properties)

    // Find the business state that corresponds to HubSpot stage
    const { data: reverseMapping } = await supabase
      .from('hubspot_state_mapping')
      .select('business_state')
      .eq('user_id', userId)
      .eq('hubspot_stage_id', hubspotDeal.properties.dealstage)
      .single()

    const hubspotBusinessState = reverseMapping?.business_state || 'unknown'
    const hubspotAmount = parseFloat(hubspotDeal.properties.amount || '0')
    
    console.log('Conflict check - App state:', negocio.estado, 'HubSpot state:', hubspotBusinessState)
    console.log('Conflict check - App amount:', currentValue, 'HubSpot amount:', hubspotAmount)

    // Check for state conflicts
    const stateConflict = negocio.estado !== hubspotBusinessState && hubspotBusinessState !== 'unknown'
    
    // Check for amount conflicts (with tolerance for small differences)
    const amountTolerance = 100 // Allow $100 difference
    const amountConflict = Math.abs(currentValue - hubspotAmount) > amountTolerance

    if (stateConflict || amountConflict) {
      const conflictType = stateConflict && amountConflict ? 'both' : 
                          stateConflict ? 'state' : 'amount'

      const conflict: SyncConflict = {
        negocio_id: negocioId,
        app_state: negocio.estado,
        hubspot_state: hubspotBusinessState,
        app_amount: currentValue,
        hubspot_amount: hubspotAmount,
        conflict_type: conflictType,
        timestamp: new Date().toISOString()
      }

      console.log('Conflict detected:', conflict)
      return { hasConflict: true, conflict }
    }

    console.log('No conflicts detected')
    return { hasConflict: false }

  } catch (error) {
    console.error('Error checking for conflicts:', error)
    return { hasConflict: false }
  }
}

async function storeConflict(supabase: any, conflict: SyncConflict) {
  console.log('Storing conflict for manual resolution')
  
  try {
    await supabase
      .from('hubspot_sync_conflicts')
      .upsert({
        negocio_id: conflict.negocio_id,
        app_state: conflict.app_state,
        hubspot_state: conflict.hubspot_state,
        app_amount: conflict.app_amount,
        hubspot_amount: conflict.hubspot_amount,
        conflict_type: conflict.conflict_type,
        status: 'pending',
        created_at: conflict.timestamp
      })
      
    console.log('Conflict stored successfully')
  } catch (error) {
    console.error('Error storing conflict:', error)
  }
}

async function syncFromHubSpot(supabase: any, hubspotDealIdOrNegocioId: string, userId: string) {
  console.log('=== SYNC FROM HUBSPOT START ===')
  console.log('Input ID:', hubspotDealIdOrNegocioId)
  
  try {
    // Get HubSpot configuration
    const { data: config, error: configError } = await supabase
      .from('hubspot_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !config?.api_key_set) {
      throw new Error('HubSpot not configured or API key not set')
    }

    // Get API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .single()

    if (apiKeyError || !apiKeyData?.api_key) {
      throw new Error('HubSpot API key not found')
    }

    // Check if input is negocio ID or HubSpot deal ID
    let hubspotDealId = hubspotDealIdOrNegocioId
    let negocioId = null

    // Try to find sync record first
    const { data: syncRecord } = await supabase
      .from('hubspot_sync')
      .select('negocio_id, hubspot_deal_id')
      .or(`negocio_id.eq.${hubspotDealIdOrNegocioId},hubspot_deal_id.eq.${hubspotDealIdOrNegocioId}`)
      .single()

    if (syncRecord) {
      negocioId = syncRecord.negocio_id
      hubspotDealId = syncRecord.hubspot_deal_id
      console.log('Found sync record - Negocio:', negocioId, 'HubSpot Deal:', hubspotDealId)
    } else {
      // Assume it's a HubSpot deal ID
      console.log('No sync record found, assuming HubSpot deal ID')
    }

    // Fetch HubSpot deal
    const hubspotResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}?properties=dealname,dealstage,amount,hs_lastmodifieddate,closedate,pipeline`, {
      headers: {
        'Authorization': `Bearer ${apiKeyData.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!hubspotResponse.ok) {
      throw new Error(`Failed to fetch HubSpot deal: ${hubspotResponse.status}`)
    }

    const hubspotDeal = await hubspotResponse.json()
    console.log('Fetched HubSpot deal:', hubspotDeal.id, 'stage:', hubspotDeal.properties.dealstage, 'amount:', hubspotDeal.properties.amount)

    if (!negocioId) {
      console.log('No corresponding business found for HubSpot deal:', hubspotDealId)
      return new Response(
        JSON.stringify({ success: false, error: 'No corresponding business found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current business data
    const { data: currentNegocio, error: negocioError } = await supabase
      .from('negocios')
      .select(`
        *,
        presupuestos(*)
      `)
      .eq('id', negocioId)
      .eq('user_id', userId)
      .single()

    if (negocioError || !currentNegocio) {
      throw new Error('Business not found')
    }

    console.log('Current business state:', currentNegocio.estado)

    // Calculate current business value
    const currentValue = calculateBusinessValue(currentNegocio)
    console.log('Calculated business value:', currentValue, 'from', currentNegocio.presupuestos?.length || 0, 'budgets')

    // Find corresponding business state from HubSpot stage
    const { data: stateMapping } = await supabase
      .from('hubspot_state_mapping')
      .select('business_state')
      .eq('user_id', userId)
      .eq('hubspot_stage_id', hubspotDeal.properties.dealstage)
      .single()

    const newState = stateMapping?.business_state
    if (!newState) {
      console.log('No mapping found for HubSpot stage:', hubspotDeal.properties.dealstage)
      return new Response(
        JSON.stringify({ success: false, error: 'No state mapping found for HubSpot stage' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hubspotAmount = parseFloat(hubspotDeal.properties.amount || '0')
    const hubspotCloseDate = hubspotDeal.properties.closedate ? 
      new Date(parseInt(hubspotDeal.properties.closedate)).toISOString().split('T')[0] : null

    // Check what needs to be updated
    const stateChanged = currentNegocio.estado !== newState
    const amountChanged = Math.abs(currentValue - hubspotAmount) > 100 // $100 tolerance
    const closeDateChanged = currentNegocio.fecha_cierre !== hubspotCloseDate

    console.log('Comparison:', {
      currentState: currentNegocio.estado,
      newState: newState,
      stateChanged: stateChanged,
      currentAmount: currentValue.toString(),
      hubspotAmount: hubspotAmount,
      amountChanged: amountChanged,
      currentCloseDate: currentNegocio.fecha_cierre || '1970-01-01',
      newCloseDate: hubspotCloseDate,
      closeDateChanged: closeDateChanged
    })

    let updated = false
    const updateData: any = {}

    if (stateChanged) {
      updateData.estado = newState
      updated = true
      console.log('Updating business with:', { estado: newState })
    }

    if (closeDateChanged && hubspotCloseDate) {
      updateData.fecha_cierre = hubspotCloseDate
      updated = true
    }

    if (updated) {
      const { error: updateError } = await supabase
        .from('negocios')
        .update(updateData)
        .eq('id', negocioId)

      if (updateError) {
        throw new Error(`Failed to update business: ${updateError.message}`)
      }

      console.log('Successfully updated business')
    } else {
      console.log('No changes detected, skipping update')
    }

    // Update sync record
    await supabase
      .from('hubspot_sync')
      .upsert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        last_hubspot_sync_at: hubspotDeal.properties.hs_lastmodifieddate,
        sync_direction: 'inbound'
      })

    // Log the operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        hubspot_deal_id: hubspotDealId,
        operation_type: 'hubspot_to_app',
        old_state: currentNegocio.estado,
        new_state: newState,
        old_amount: currentValue,
        new_amount: hubspotAmount,
        hubspot_old_stage: 'unknown',
        hubspot_new_stage: hubspotDeal.properties.dealstage,
        success: true,
        sync_direction: 'inbound'
      })

    console.log('Successfully synced from HubSpot')
    console.log('=== SYNC FROM HUBSPOT COMPLETE ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        changed: updated,
        stateChanged: stateChanged,
        amountChanged: amountChanged,
        closeDateChanged: closeDateChanged,
        newState: newState
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error syncing from HubSpot:', error)
    throw error
  }
}

async function pollHubSpotChanges(supabase: any, userId: string, checkAmounts: boolean = true) {
  console.log('=== POLLING HUBSPOT CHANGES ===')
  
  try {
    // Get all synced businesses
    const { data: syncedBusinesses, error: syncError } = await supabase
      .from('hubspot_sync')
      .select('negocio_id, hubspot_deal_id')
      .eq('sync_status', 'success')

    if (syncError) {
      throw new Error(`Failed to fetch synced businesses: ${syncError.message}`)
    }

    if (!syncedBusinesses || syncedBusinesses.length === 0) {
      console.log('No synced businesses found')
      return new Response(
        JSON.stringify({ success: true, results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found', syncedBusinesses.length, 'synced businesses to check')

    const results = []
    for (const sync of syncedBusinesses) {
      console.log('Processing business:', sync.negocio_id)
      
      try {
        const syncResult = await syncFromHubSpot(supabase, sync.negocio_id, userId)
        const resultData = await syncResult.json()
        
        results.push({
          negocio_id: sync.negocio_id,
          success: resultData.success,
          changed: resultData.changed || false,
          stateChanged: resultData.stateChanged || false,
          amountChanged: resultData.amountChanged || false,
          closeDateChanged: resultData.closeDateChanged || false
        })
      } catch (error) {
        console.error('Error syncing business:', sync.negocio_id, error)
        results.push({
          negocio_id: sync.negocio_id,
          success: false,
          error: error.message
        })
      }
    }

    console.log('Polling complete, results:', results)

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error polling HubSpot changes:', error)
    throw error
  }
}

async function massSyncAmounts(supabase: any, userId: string) {
  console.log('=== MASS SYNC AMOUNTS START ===')
  
  try {
    // Get all businesses with budgets
    const { data: businesses, error: businessError } = await supabase
      .from('negocios')
      .select(`
        id,
        numero,
        estado,
        presupuestos(*)
      `)
      .eq('user_id', userId)

    if (businessError) {
      throw new Error(`Failed to fetch businesses: ${businessError.message}`)
    }

    console.log('Found', businesses?.length || 0, 'businesses to sync amounts')

    const results = { updated: 0, failed: 0, skipped: 0 }

    for (const business of businesses || []) {
      try {
        const currentValue = calculateBusinessValue(business)
        
        if (currentValue > 0) {
          const syncResult = await syncToHubSpot(supabase, business.id, userId, true) // Force amount sync
          const resultData = await syncResult.json()
          
          if (resultData.success) {
            results.updated++
            console.log('Updated business:', business.numero, 'with amount:', currentValue)
          } else {
            results.failed++
            console.error('Failed to update business:', business.numero)
          }
        } else {
          results.skipped++
          console.log('Skipped business:', business.numero, 'no budget value')
        }
      } catch (error) {
        results.failed++
        console.error('Error syncing business:', business.numero, error)
      }
    }

    console.log('Mass sync complete:', results)

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in mass sync amounts:', error)
    throw error
  }
}

async function resolveConflict(supabase: any, negocioId: string, userId: string, resolvedState: string, resolvedAmount?: number) {
  console.log('=== RESOLVING CONFLICT ===')
  console.log('Negocio:', negocioId, 'Resolved state:', resolvedState, 'Resolved amount:', resolvedAmount)
  
  try {
    // Update the business with resolved values
    const updateData: any = { estado: resolvedState }
    
    const { error: updateError } = await supabase
      .from('negocios')
      .update(updateData)
      .eq('id', negocioId)

    if (updateError) {
      throw new Error(`Failed to update business: ${updateError.message}`)
    }

    // Remove the conflict record
    await supabase
      .from('hubspot_sync_conflicts')
      .delete()
      .eq('negocio_id', negocioId)

    // Sync the resolved state to HubSpot
    await syncToHubSpot(supabase, negocioId, userId, true)

    // Log the resolution
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        operation_type: 'conflict_resolution',
        new_state: resolvedState,
        new_amount: resolvedAmount,
        success: true,
        sync_direction: 'resolution'
      })

    console.log('Conflict resolved successfully')

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error resolving conflict:', error)
    throw error
  }
}

function calculateBusinessValue(negocio: any): number {
  if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
    return 0
  }

  // Sum all approved budgets
  const approvedTotal = negocio.presupuestos
    .filter((p: any) => p.estado === 'aprobado')
    .reduce((sum: number, p: any) => sum + parseFloat(p.total || '0'), 0)

  // If no approved budgets, use sent budgets
  if (approvedTotal === 0) {
    return negocio.presupuestos
      .filter((p: any) => p.estado === 'enviado')
      .reduce((sum: number, p: any) => sum + parseFloat(p.total || '0'), 0)
  }

  return approvedTotal
}
