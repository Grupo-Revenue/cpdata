import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { companyName, action, companyData } = requestBody;
    console.log(`Processing ${action} for company: ${companyName}`)

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

    if (action === 'search') {
      console.log('Searching for company with name:', companyName)
      
      // Search for company by name using case-insensitive search
      const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
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
                  propertyName: "name",
                  operator: "CONTAINS_TOKEN",
                  value: companyName
                }
              ]
            }
          ],
          properties: [
            "name",
            "tipo_de_cliente", 
            "rut_cliente_final",
            "rut_productora",
            "address"
          ],
          limit: 10
        })
      })

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text()
        console.error('HubSpot search error:', searchResponse.status, errorText)
        return new Response(JSON.stringify({
          success: false,
          error: `HubSpot API error: ${searchResponse.status} - ${errorText}`
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const searchResult = await searchResponse.json()
      console.log('HubSpot search result:', JSON.stringify(searchResult, null, 2))

      if (searchResult.results && searchResult.results.length > 0) {
        const company = searchResult.results[0]
        const tipoCliente = company.properties.tipo_de_cliente || ''
        
        // Determine RUT based on company type
        let rut = ''
        if (tipoCliente === 'Cliente Final') {
          rut = company.properties.rut_cliente_final || ''
        } else if (tipoCliente === 'Productora') {
          rut = company.properties.rut_productora || ''
        }
        
        return new Response(JSON.stringify({
          success: true,
          found: true,
          company: {
            hubspotId: company.id,
            name: company.properties.name || '',
            tipoCliente: tipoCliente,
            rut: rut,
            address: company.properties.address || ''
          }
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({
          success: true,
          found: false,
          message: 'Company not found in HubSpot'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else if (action === 'create') {
      console.log('Creating company with data:', companyData)
      
      // Determine which RUT property to set based on company type
      const properties: any = {
        name: companyData.nombre || '',
        tipo_de_cliente: companyData.tipoCliente || '',
        address: companyData.direccion || ''
      }
      
      if (companyData.tipoCliente === 'Cliente Final') {
        properties.rut_cliente_final = companyData.rut || ''
      } else if (companyData.tipoCliente === 'Productora') {
        properties.rut_productora = companyData.rut || ''
      }
      
      // Create new company in HubSpot using the correct companies API
      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('HubSpot create error:', createResponse.status, errorText)
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to create company in HubSpot: ${createResponse.status} - ${errorText}`
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const createdCompany = await createResponse.json()
      console.log('Company created in HubSpot:', createdCompany.id)

      return new Response(JSON.stringify({
        success: true,
        created: true,
        company: {
          hubspotId: createdCompany.id,
          name: companyData.nombre || '',
          tipoCliente: companyData.tipoCliente || '',
          rut: companyData.rut || '',
          address: companyData.direccion || ''
        },
        message: 'Company created successfully in HubSpot'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else if (action === 'update') {
      console.log('Updating company with data:', companyData)
      
      if (!companyData.hubspotId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'HubSpot ID is required for update operation'
        }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Determine which RUT property to set based on company type
      const properties: any = {
        name: companyData.nombre || '',
        tipo_de_cliente: companyData.tipoCliente || '',
        address: companyData.direccion || ''
      }
      
      if (companyData.tipoCliente === 'Cliente Final') {
        properties.rut_cliente_final = companyData.rut || ''
      } else if (companyData.tipoCliente === 'Productora') {
        properties.rut_productora = companyData.rut || ''
      }

      // Update company in HubSpot
      const updateResponse = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${companyData.hubspotId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties
        })
      })

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        console.error('HubSpot update error:', updateResponse.status, errorText)
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to update company in HubSpot: ${updateResponse.status} - ${errorText}`
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updatedCompany = await updateResponse.json()
      console.log('Company updated in HubSpot:', updatedCompany.id)

      return new Response(JSON.stringify({
        success: true,
        updated: true,
        company: {
          hubspotId: updatedCompany.id,
          name: companyData.nombre || '',
          tipoCliente: companyData.tipoCliente || '',
          rut: companyData.rut || '',
          address: companyData.direccion || ''
        },
        message: 'Company updated successfully in HubSpot'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in hubspot-company-validation:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})