
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueueItem {
  id: string;
  negocio_id: string;
  operation_type: string;
  payload: any;
  attempts: number;
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

    const { queueItemId, negocioId, operation, payload } = await req.json()
    console.log('Processing queue item:', queueItemId, 'Operation:', operation)

    // Get the queue item
    const { data: queueItem, error: queueError } = await supabase
      .from('hubspot_sync_queue')
      .select('*')
      .eq('id', queueItemId)
      .single()

    if (queueError || !queueItem) {
      throw new Error(`Queue item not found: ${queueItemId}`)
    }

    // Get business data with all related information
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select(`
        *,
        contacto:contactos(*),
        presupuestos(*)
      `)
      .eq('id', negocioId)
      .single()

    if (negocioError || !negocio) {
      throw new Error(`Business not found: ${negocioId}`)
    }

    // Get user's HubSpot configuration
    const { data: hubspotConfig, error: configError } = await supabase
      .from('hubspot_config')
      .select('*')
      .eq('user_id', negocio.user_id)
      .single()

    if (configError || !hubspotConfig?.api_key_set) {
      throw new Error('HubSpot configuration not found or API key not set')
    }

    // Get API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', negocio.user_id)
      .single()

    if (apiKeyError || !apiKeyData?.api_key) {
      throw new Error('HubSpot API key not found')
    }

    let result;
    
    switch (operation) {
      case 'update':
      case 'force_amount_update':
      case 'budget_update':
      case 'mass_amount_sync':
        result = await syncToHubSpot(supabase, negocio, apiKeyData.api_key, hubspotConfig, operation === 'force_amount_update')
        break
      
      case 'sync_from_hubspot':
        result = await syncFromHubSpot(supabase, negocio, apiKeyData.api_key, hubspotConfig)
        break
      
      case 'resolve_conflict_use_app':
        result = await resolveConflictUseApp(supabase, negocio, apiKeyData.api_key, hubspotConfig)
        break
      
      case 'resolve_conflict_use_hubspot':
        result = await resolveConflictUseHubSpot(supabase, negocio, apiKeyData.api_key, hubspotConfig)
        break
      
      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    // Log the operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        queue_id: queueItemId,
        operation_type: operation,
        success: result.success,
        error_message: result.error,
        sync_direction: result.direction || 'outbound',
        trigger_source: 'queue'
      })

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

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

async function syncToHubSpot(supabase: any, negocio: any, apiKey: string, config: any, forceAmount: boolean = false) {
  console.log('=== SYNC TO HUBSPOT ===', negocio.numero, 'Force:', forceAmount)

  try {
    // Get state mapping
    const { data: mapping, error: mappingError } = await supabase
      .from('hubspot_state_mapping')
      .select('*')
      .eq('user_id', negocio.user_id)
      .eq('business_state', negocio.estado)
      .single()

    if (mappingError || !mapping) {
      throw new Error(`No mapping found for business state: ${negocio.estado}`)
    }

    // Calculate business value
    const currentValue = calculateBusinessValue(negocio)
    console.log('Business value:', currentValue)

    // Check if deal exists
    const { data: existingSync } = await supabase
      .from('hubspot_sync')
      .select('hubspot_deal_id')
      .eq('negocio_id', negocio.id)
      .single()

    const dealData = {
      dealname: `${negocio.nombre_evento} - #${negocio.numero}`,
      dealstage: mapping.hubspot_stage_id,
      amount: currentValue,
      pipeline: mapping.hubspot_pipeline_id,
    }

    // Add close date if available
    if (negocio.fecha_cierre && negocio.fecha_cierre !== '1970-01-01') {
      const closeDateTimestamp = new Date(negocio.fecha_cierre).getTime()
      dealData.closedate = closeDateTimestamp.toString()
    }

    let hubspotDealId = existingSync?.hubspot_deal_id
    let isNewDeal = false

    if (hubspotDealId) {
      // Update existing deal
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${hubspotDealId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: dealData })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`HubSpot API error: ${updateResponse.status} - ${errorText}`)
      }
    } else {
      // Create new deal
      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ properties: dealData })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`HubSpot API error: ${createResponse.status} - ${errorText}`)
      }

      const newDeal = await createResponse.json()
      hubspotDealId = newDeal.id
      isNewDeal = true
    }

    // Update sync record
    await supabase
      .from('hubspot_sync')
      .upsert({
        negocio_id: negocio.id,
        hubspot_deal_id: hubspotDealId,
        sync_status: 'success',
        last_sync_at: new Date().toISOString(),
        last_hubspot_sync_at: new Date().toISOString(),
        app_last_modified: negocio.updated_at,
        sync_direction: 'outbound'
      })

    console.log('Successfully synced to HubSpot:', hubspotDealId, 'New deal:', isNewDeal)

    return {
      success: true,
      hubspotDealId,
      isNewDeal,
      direction: 'outbound'
    }

  } catch (error) {
    console.error('Error syncing to HubSpot:', error)
    return {
      success: false,
      error: error.message,
      direction: 'outbound'
    }
  }
}

async function syncFromHubSpot(supabase: any, negocio: any, apiKey: string, config: any) {
  console.log('=== SYNC FROM HUBSPOT ===', negocio.numero)

  try {
    // Get existing sync record
    const { data: syncRecord } = await supabase
      .from('hubspot_sync')
      .select('hubspot_deal_id')
      .eq('negocio_id', negocio.id)
      .single()

    if (!syncRecord?.hubspot_deal_id) {
      throw new Error('No HubSpot deal ID found for this business')
    }

    // Fetch deal from HubSpot
    const dealResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${syncRecord.hubspot_deal_id}?properties=dealname,dealstage,amount,hs_lastmodifieddate,closedate,pipeline`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!dealResponse.ok) {
      throw new Error(`Failed to fetch HubSpot deal: ${dealResponse.status}`)
    }

    const hubspotDeal = await dealResponse.json()
    console.log('Fetched HubSpot deal:', hubspotDeal.id)

    // Find corresponding business state
    const { data: stateMapping } = await supabase
      .from('hubspot_state_mapping')
      .select('business_state')
      .eq('user_id', negocio.user_id)
      .eq('hubspot_stage_id', hubspotDeal.properties.dealstage)
      .single()

    const newState = stateMapping?.business_state
    if (!newState) {
      throw new Error(`No mapping found for HubSpot stage: ${hubspotDeal.properties.dealstage}`)
    }

    const hubspotCloseDate = hubspotDeal.properties.closedate ? 
      new Date(parseInt(hubspotDeal.properties.closedate)).toISOString().split('T')[0] : null

    // Check what needs to be updated
    const stateChanged = negocio.estado !== newState
    const closeDateChanged = negocio.fecha_cierre !== hubspotCloseDate

    let updated = false
    const updateData: any = {}

    if (stateChanged) {
      updateData.estado = newState
      updated = true
    }

    if (closeDateChanged && hubspotCloseDate) {
      updateData.fecha_cierre = hubspotCloseDate
      updated = true
    }

    if (updated) {
      const { error: updateError } = await supabase
        .from('negocios')
        .update(updateData)
        .eq('id', negocio.id)

      if (updateError) {
        throw new Error(`Failed to update business: ${updateError.message}`)
      }
    }

    // Update sync record
    await supabase
      .from('hubspot_sync')
      .update({
        last_sync_at: new Date().toISOString(),
        last_hubspot_sync_at: hubspotDeal.properties.hs_lastmodifieddate,
        sync_direction: 'inbound'
      })
      .eq('negocio_id', negocio.id)

    console.log('Successfully synced from HubSpot, updated:', updated)

    return {
      success: true,
      changed: updated,
      stateChanged,
      closeDateChanged,
      newState,
      direction: 'inbound'
    }

  } catch (error) {
    console.error('Error syncing from HubSpot:', error)
    return {
      success: false,
      error: error.message,
      direction: 'inbound'
    }
  }
}

async function resolveConflictUseApp(supabase: any, negocio: any, apiKey: string, config: any) {
  console.log('=== RESOLVE CONFLICT - USE APP ===', negocio.numero)

  // Delete the conflict record
  await supabase
    .from('hubspot_sync_conflicts')
    .delete()
    .eq('negocio_id', negocio.id)

  // Sync app data to HubSpot
  return await syncToHubSpot(supabase, negocio, apiKey, config, true)
}

async function resolveConflictUseHubSpot(supabase: any, negocio: any, apiKey: string, config: any) {
  console.log('=== RESOLVE CONFLICT - USE HUBSPOT ===', negocio.numero)

  // Delete the conflict record
  await supabase
    .from('hubspot_sync_conflicts')
    .delete()
    .eq('negocio_id', negocio.id)

  // Sync HubSpot data to app
  return await syncFromHubSpot(supabase, negocio, apiKey, config)
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
