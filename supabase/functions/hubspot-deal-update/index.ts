import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [HubSpot Deal Update] Starting function execution');
    
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { negocio_id, estado_anterior, estado_nuevo } = body;

    console.log(`📋 [HubSpot Deal Update] Processing negocio ${negocio_id}: ${estado_anterior} → ${estado_nuevo}`);

    if (!negocio_id || !estado_nuevo) {
      console.error('❌ [HubSpot Deal Update] Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing negocio_id or estado_nuevo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get business details from database
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocio_id)
      .single();

    if (negocioError || !negocio) {
      console.error('❌ [HubSpot Deal Update] Error fetching negocio:', negocioError);
      return new Response(
        JSON.stringify({ error: 'Negocio not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if business has HubSpot ID
    if (!negocio.hubspot_id) {
      console.log(`ℹ️ [HubSpot Deal Update] Negocio ${negocio_id} has no HubSpot ID, skipping sync`);
      return new Response(
        JSON.stringify({ message: 'No HubSpot ID, sync skipped' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active HubSpot API key
    const { data: hubspotKey, error: keyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('activo', true)
      .single();

    if (keyError || !hubspotKey) {
      console.error('❌ [HubSpot Deal Update] No active HubSpot API key found:', keyError);
      await updateSyncLog(supabase, negocio_id, 'failed', 'No active HubSpot API key found');
      return new Response(
        JSON.stringify({ error: 'No active HubSpot API key configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get HubSpot stage mapping
    const { data: stageMapping, error: stageMappingError } = await supabase
      .from('hubspot_stage_mapping')
      .select('stage_id')
      .eq('estado_negocio', estado_nuevo)
      .single();

    if (stageMappingError || !stageMapping) {
      console.error(`❌ [HubSpot Deal Update] No stage mapping found for estado: ${estado_nuevo}`, stageMappingError);
      await updateSyncLog(supabase, negocio_id, 'failed', `No stage mapping for estado: ${estado_nuevo}`);
      return new Response(
        JSON.stringify({ error: `No stage mapping for estado: ${estado_nuevo}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update deal stage in HubSpot
    const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`;
    const hubspotPayload = {
      properties: {
        dealstage: stageMapping.stage_id
      }
    };

    console.log(`🔄 [HubSpot Deal Update] Updating HubSpot deal ${negocio.hubspot_id} to stage ${stageMapping.stage_id}`);

    const hubspotResponse = await fetch(hubspotUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${hubspotKey.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hubspotPayload)
    });

    if (!hubspotResponse.ok) {
      const errorText = await hubspotResponse.text();
      console.error('❌ [HubSpot Deal Update] HubSpot API error:', errorText);
      
      // DETECT 404 AND DELETE NEGOCIO
      if (hubspotResponse.status === 404) {
        console.log('🗑️ [HubSpot Deal Update] Deal not found in HubSpot, deleting negocio from system:', {
          negocio_id,
          hubspot_id: negocio.hubspot_id
        })
        
        // Delete negocio (cascade will delete presupuestos, productos, logs, etc.)
        const { error: deleteError } = await supabase
          .from('negocios')
          .delete()
          .eq('id', negocio_id)
        
        if (deleteError) {
          console.error('❌ [HubSpot Deal Update] Error deleting negocio:', deleteError)
          await updateSyncLog(supabase, negocio_id, 'failed', `Deal not found in HubSpot, failed to delete: ${deleteError.message}`)
          return new Response(
            JSON.stringify({ 
              error: 'Deal not found in HubSpot and failed to delete from system',
              details: deleteError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('✅ [HubSpot Deal Update] Successfully deleted negocio from system')
        await updateSyncLog(supabase, negocio_id, 'success', 'Deal not found in HubSpot, negocio deleted from system')
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Deal not found in HubSpot, negocio deleted from system',
            negocio_id,
            hubspot_id: negocio.hubspot_id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Other errors (not 404)
      await updateSyncLog(supabase, negocio_id, 'failed', `HubSpot API error: ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'HubSpot API error', details: errorText }),
        { status: hubspotResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hubspotResult = await hubspotResponse.json();
    console.log('✅ [HubSpot Deal Update] Successfully updated HubSpot deal:', hubspotResult);

    // Update sync log as successful
    await updateSyncLog(supabase, negocio_id, 'success', 'Deal stage updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deal stage updated successfully',
        hubspot_deal_id: negocio.hubspot_id,
        new_stage: stageMapping.stage_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [HubSpot Deal Update] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateSyncLog(supabase: any, negocioId: string, status: string, message: string) {
  try {
    await supabase
      .from('hubspot_sync_log')
      .update({
        status,
        error_message: status === 'failed' ? message : null,
        processed_at: new Date().toISOString()
      })
      .eq('negocio_id', negocioId)
      .eq('status', 'pending');
    
    console.log(`📝 [HubSpot Deal Update] Updated sync log for negocio ${negocioId}: ${status}`);
  } catch (error) {
    console.error('❌ [HubSpot Deal Update] Error updating sync log:', error);
  }
}