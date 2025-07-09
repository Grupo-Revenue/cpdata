import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DealData {
  nombre_correlativo: string;
  tipo_evento: string;
  nombre_evento: string;
  valor_negocio: number;
  fecha_evento: string;
  fecha_evento_fin?: string;
  fecha_cierre?: string;
  locacion: string;
  cantidad_invitados: number;
  cantidad_asistentes: number;
  contactId: string;
  productoraId?: string;
  clienteFinalId?: string;
}

serve(async (req) => {
  console.log(`Method: ${req.method}, URL: ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, dealData } = requestBody;
    console.log(`Processing ${action} for deal`)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's HubSpot API key
    const { data: hubspotConfig, error: configError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('activo', true)
      .single()

    if (configError || !hubspotConfig) {
      console.error('HubSpot API key not found:', configError)
      return new Response(JSON.stringify({
        success: false,
        error: 'HubSpot API key not found or inactive'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const hubspotApiKey = hubspotConfig.api_key

    if (action === 'generate_correlative') {
      // Generate unique correlative number
      const correlativeNumber = await generateUniqueCorrelative(hubspotApiKey, supabase, user.id);
      
      return new Response(JSON.stringify({
        success: true,
        correlative: correlativeNumber
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_deal') {
      console.log('Creating deal with data:', dealData)
      
      // Convert dates to timestamps in milliseconds
      const formatDateToTimestamp = (dateStr: string, timeStr?: string) => {
        if (!dateStr) return null;
        
        let fullDateTime = dateStr;
        if (timeStr) {
          fullDateTime = `${dateStr}T${timeStr}:00`;
        } else {
          fullDateTime = `${dateStr}T00:00:00`;
        }
        
        const date = new Date(fullDateTime);
        return date.getTime();
      };

      const fechaEventoTimestamp = formatDateToTimestamp(dealData.fecha_evento, dealData.horario_inicio);
      const fechaEventoFinTimestamp = dealData.fecha_evento_fin ? formatDateToTimestamp(dealData.fecha_evento_fin, dealData.horario_fin) : null;
      const fechaCierreTimestamp = dealData.fecha_cierre ? formatDateToTimestamp(dealData.fecha_cierre) : null;

      // Prepare deal properties
      const properties: any = {
        dealname: dealData.nombre_correlativo,
        pipeline: "755372600",
        dealstage: "Oportunidad creada",
        amount: dealData.valor_negocio.toString(),
        tipo_de_evento: dealData.tipo_evento,
        nombre_del_evento: dealData.nombre_evento,
        locacion_del_evento: dealData.locacion,
        cantidad_de_invitados: dealData.cantidad_invitados.toString(),
        cantidad_de_asistentes: dealData.cantidad_asistentes.toString()
      };

      // Add date properties if they exist
      if (fechaEventoTimestamp) {
        properties.fecha_y_hora_del_evento = fechaEventoTimestamp.toString();
      }
      if (fechaEventoFinTimestamp) {
        properties.fecha_y_hora_del_evento_termino = fechaEventoFinTimestamp.toString();
      }
      if (fechaCierreTimestamp) {
        properties.fecha_y_hora_de_cierre = fechaCierreTimestamp.toString();
      }

      // Prepare associations
      const associations = [];
      
      // Always associate with contact
      associations.push({
        to: { id: dealData.contactId },
        types: [
          { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }
        ]
      });

      // Associate with companies if they exist
      if (dealData.clienteFinalId) {
        associations.push({
          to: { id: dealData.clienteFinalId },
          types: [
            { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 5 }
          ]
        });
      }

      if (dealData.productoraId) {
        associations.push({
          to: { id: dealData.productoraId },
          types: [
            { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 5 }
          ]
        });
      }

      // Create deal in HubSpot
      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties,
          associations
        })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('HubSpot deal creation error:', createResponse.status, errorText)
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to create deal in HubSpot: ${createResponse.status} - ${errorText}`
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const createdDeal = await createResponse.json()
      console.log('Deal created in HubSpot:', createdDeal.id)

      return new Response(JSON.stringify({
        success: true,
        deal: {
          hubspotId: createdDeal.id,
          dealname: dealData.nombre_correlativo
        },
        message: 'Deal created successfully in HubSpot'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in hubspot-deal-creation:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function generateUniqueCorrelative(hubspotApiKey: string, supabase: any, userId: string): Promise<string> {
  // Get current counter from local database
  let { data: counter, error } = await supabase
    .from('contadores_usuario')
    .select('contador_negocio')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error getting counter: ${error.message}`);
  }

  let currentNumber = counter?.contador_negocio || 0;
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    currentNumber++;
    const correlativeNumber = `#${currentNumber}`;
    
    // Check if exists in local database
    const { data: localExists } = await supabase
      .from('negocios')
      .select('id')
      .eq('user_id', userId)
      .eq('numero', currentNumber)
      .single();

    if (localExists) {
      attempts++;
      continue;
    }

    // Check if exists in HubSpot
    const hubspotExists = await checkDealExistsInHubSpot(hubspotApiKey, correlativeNumber);
    
    if (!hubspotExists) {
      // Update counter in database
      await supabase
        .from('contadores_usuario')
        .upsert({
          user_id: userId,
          contador_negocio: currentNumber,
          updated_at: new Date().toISOString()
        });

      return correlativeNumber;
    }

    attempts++;
  }

  throw new Error('Could not generate unique correlative after maximum attempts');
}

async function checkDealExistsInHubSpot(hubspotApiKey: string, correlativeNumber: string): Promise<boolean> {
  try {
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/deals/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "dealname",
                operator: "EQ",
                value: correlativeNumber
              }
            ]
          }
        ],
        limit: 1
      })
    });

    if (!searchResponse.ok) {
      console.error('Error checking deal in HubSpot:', searchResponse.status);
      return false; // Assume it doesn't exist if we can't check
    }

    const searchResult = await searchResponse.json();
    return searchResult.results && searchResult.results.length > 0;
  } catch (error) {
    console.error('Error checking deal existence:', error);
    return false; // Assume it doesn't exist if we can't check
  }
}