
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssociationRequest {
  negocioId: string;
  contactHubSpotId: string;
  productoraHubSpotId?: string;
  clienteFinalHubSpotId?: string;
  tipoCliente: 'productora' | 'cliente_final';
  hubspotDealId: string;
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

    const { negocioId, contactHubSpotId, productoraHubSpotId, clienteFinalHubSpotId, tipoCliente, hubspotDealId }: AssociationRequest = requestBody;

    console.log('Processing associations:', {
      negocioId,
      contactHubSpotId,
      productoraHubSpotId,
      clienteFinalHubSpotId,
      tipoCliente,
      hubspotDealId
    });

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

    // Get global HubSpot API key
    const { data: hubspotConfig, error: configError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('activo', true)
      .maybeSingle()

    if (configError || !hubspotConfig) {
      console.error('Global HubSpot API key not found:', configError)
      return new Response(JSON.stringify({
        success: false,
        error: 'HubSpot API key not configured'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const hubspotApiKey = hubspotConfig.api_key;
    const associationsCreated = [];
    const associationErrors = [];

    // Helper function to create bidirectional association
    const createBidirectionalAssociation = async (
      fromObjectType: string,
      fromObjectId: string,
      toObjectType: string,
      toObjectId: string,
      associationTypeId: number,
      associationCategory: string = 'HUBSPOT_DEFINED'
    ) => {
      console.log(`Creating bidirectional association: ${fromObjectType}(${fromObjectId}) ↔ ${toObjectType}(${toObjectId}) with typeId: ${associationTypeId}`);

      try {
        // Check if association already exists (from -> to)
        const checkResponse = await fetch(
          `https://api.hubapi.com/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${hubspotApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        let associationExists = false;
        if (checkResponse.ok) {
          const existingAssociations = await checkResponse.json();
          associationExists = existingAssociations.results?.some((assoc: any) => 
            assoc.toObjectId === toObjectId && 
            assoc.associationTypes?.some((type: any) => type.typeId === associationTypeId)
          );
        }

        if (!associationExists) {
          // Create association from -> to
          const createResponse = await fetch(
            `https://api.hubapi.com/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${hubspotApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                types: [{
                  associationCategory,
                  associationTypeId
                }]
              })
            }
          );

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            throw new Error(`Failed to create association ${fromObjectType} -> ${toObjectType}: ${createResponse.status} - ${errorText}`);
          }

          associationsCreated.push({
            from: `${fromObjectType}(${fromObjectId})`,
            to: `${toObjectType}(${toObjectId})`,
            typeId: associationTypeId,
            direction: 'bidirectional'
          });

          console.log(`✓ Association created: ${fromObjectType}(${fromObjectId}) ↔ ${toObjectType}(${toObjectId})`);
        } else {
          console.log(`→ Association already exists: ${fromObjectType}(${fromObjectId}) ↔ ${toObjectType}(${toObjectId})`);
        }

      } catch (error) {
        console.error(`Error creating association ${fromObjectType} ↔ ${toObjectType}:`, error);
        associationErrors.push({
          from: `${fromObjectType}(${fromObjectId})`,
          to: `${toObjectType}(${toObjectId})`,
          error: error.message
        });
      }
    };

    // Create associations based on business type
    if (tipoCliente === 'productora' && productoraHubSpotId) {
      console.log('Creating associations for Productora business type');

      // Contacto ↔ Empresa Productora (associationTypeId: 3)
      await createBidirectionalAssociation(
        'contacts', contactHubSpotId,
        'companies', productoraHubSpotId,
        3, 'USER_DEFINED'
      );

      // Contacto ↔ Empresa Cliente Final (associationTypeId: 5) - si existe
      if (clienteFinalHubSpotId) {
        await createBidirectionalAssociation(
          'contacts', contactHubSpotId,
          'companies', clienteFinalHubSpotId,
          5, 'USER_DEFINED'
        );
      }

      // Contacto ↔ Negocio (HUBSPOT_DEFINED)
      await createBidirectionalAssociation(
        'contacts', contactHubSpotId,
        'deals', hubspotDealId,
        3, 'HUBSPOT_DEFINED'
      );

      // Negocio ↔ Empresa Productora (HUBSPOT_DEFINED)
      await createBidirectionalAssociation(
        'deals', hubspotDealId,
        'companies', productoraHubSpotId,
        5, 'HUBSPOT_DEFINED'
      );

      // Empresa Productora ↔ Empresa Cliente Final (si existe)
      if (clienteFinalHubSpotId) {
        await createBidirectionalAssociation(
          'companies', productoraHubSpotId,
          'companies', clienteFinalHubSpotId,
          3, 'HUBSPOT_DEFINED'
        );
      }

    } else if (tipoCliente === 'cliente_final' && clienteFinalHubSpotId) {
      console.log('Creating associations for Cliente Final business type');

      // Contacto ↔ Empresa Cliente Final (associationTypeId: 5)
      await createBidirectionalAssociation(
        'contacts', contactHubSpotId,
        'companies', clienteFinalHubSpotId,
        5, 'USER_DEFINED'
      );

      // Contacto ↔ Negocio (HUBSPOT_DEFINED)
      await createBidirectionalAssociation(
        'contacts', contactHubSpotId,
        'deals', hubspotDealId,
        3, 'HUBSPOT_DEFINED'
      );

      // Negocio ↔ Empresa Cliente Final (HUBSPOT_DEFINED)
      await createBidirectionalAssociation(
        'deals', hubspotDealId,
        'companies', clienteFinalHubSpotId,
        5, 'HUBSPOT_DEFINED'
      );
    }

    // Log the sync operation
    await supabase
      .from('hubspot_sync_log')
      .insert({
        negocio_id: negocioId,
        operation_type: 'associations_creation',
        status: associationErrors.length === 0 ? 'success' : 'partial_success',
        request_payload: requestBody,
        response_payload: {
          associationsCreated,
          associationErrors,
          totalCreated: associationsCreated.length,
          totalErrors: associationErrors.length
        },
        processed_at: new Date().toISOString(),
        trigger_source: 'wizard_completion'
      });

    console.log(`Associations process completed. Created: ${associationsCreated.length}, Errors: ${associationErrors.length}`);

    return new Response(JSON.stringify({
      success: true,
      associationsCreated,
      associationErrors,
      summary: {
        totalCreated: associationsCreated.length,
        totalErrors: associationErrors.length,
        tipoCliente,
        negocioId
      }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in hubspot-associations:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
