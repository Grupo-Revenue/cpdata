import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [HubSpot Deal Properties Update] Starting function');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { negocio_id, eventData } = body;

    if (!negocio_id || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Missing negocio_id or eventData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get negocio with hubspot_id
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select('hubspot_id')
      .eq('id', negocio_id)
      .single();

    if (negocioError || !negocio || !negocio.hubspot_id) {
      console.log('ℹ️ No HubSpot ID found, skipping sync');
      return new Response(
        JSON.stringify({ message: 'No HubSpot ID, sync skipped' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get HubSpot API key
    const { data: hubspotKey, error: keyError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('activo', true)
      .single();

    if (keyError || !hubspotKey) {
      return new Response(
        JSON.stringify({ error: 'No active HubSpot API key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert date to timestamp (milliseconds) for HubSpot
    const formatDateToTimestamp = (dateStr: string) => {
      if (!dateStr) return null;
      const date = new Date(`${dateStr}T00:00:00`);
      return date.getTime();
    };

    // Prepare properties to update
    const properties: any = {};

    if (eventData.tipo_evento) {
      properties.tipo_de_evento = eventData.tipo_evento;
    }
    if (eventData.nombre_evento) {
      properties.nombre_del_evento = eventData.nombre_evento;
    }
    if (eventData.locacion) {
      properties.locacion_del_evento = eventData.locacion;
    }
    if (eventData.cantidad_invitados !== undefined) {
      properties.cantidad_de_invitados = eventData.cantidad_invitados.toString();
    }
    if (eventData.cantidad_asistentes !== undefined) {
      properties.cantidad_de_asistentes = eventData.cantidad_asistentes.toString();
    }
    if (eventData.fecha_evento) {
      const timestamp = formatDateToTimestamp(eventData.fecha_evento);
      if (timestamp) {
        properties.fecha_y_hora_del_evento = timestamp.toString();
      }
    }
    if (eventData.fecha_cierre) {
      const timestamp = formatDateToTimestamp(eventData.fecha_cierre);
      if (timestamp) {
        properties.closedate = timestamp.toString();
      }
    }

    // Update deal in HubSpot
    const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/deals/${negocio.hubspot_id}`;
    
    console.log(`🔄 Updating HubSpot deal ${negocio.hubspot_id} with properties:`, properties);

    const hubspotResponse = await fetch(hubspotUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${hubspotKey.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties })
    });

    if (!hubspotResponse.ok) {
      const errorText = await hubspotResponse.text();
      console.error('❌ HubSpot API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'HubSpot API error', details: errorText }),
        { status: hubspotResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hubspotResult = await hubspotResponse.json();
    console.log('✅ Successfully updated HubSpot deal properties');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Deal properties updated successfully',
        hubspot_deal_id: negocio.hubspot_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
