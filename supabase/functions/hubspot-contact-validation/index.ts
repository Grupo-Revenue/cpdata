
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

    const { email, action, contactData } = requestBody;
    console.log(`Processing ${action} for email: ${email}`)

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
      console.log('Searching for contact with email:', email)
      
      // Search for contact by email using the correct contacts API
      const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
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
                  propertyName: "email",
                  operator: "EQ",
                  value: email
                }
              ]
            }
          ],
          properties: ["firstname", "lastname", "email", "phone"],
          limit: 1
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
        const contact = searchResult.results[0]
        return new Response(JSON.stringify({
          success: true,
          found: true,
          contact: {
            firstname: contact.properties.firstname || '',
            lastname: contact.properties.lastname || '',
            email: contact.properties.email || '',
            phone: contact.properties.phone || ''
          }
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        return new Response(JSON.stringify({
          success: true,
          found: false,
          message: 'Contact not found in HubSpot'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } else if (action === 'create') {
      console.log('Creating contact with data:', contactData)
      
      // Create new contact in HubSpot using the correct contacts API
      const createResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: contactData.nombre || '',
            lastname: contactData.apellido || '',
            email: contactData.email || '',
            phone: contactData.telefono || ''
          }
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('HubSpot create error:', createResponse.status, errorText)
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to create contact in HubSpot: ${createResponse.status} - ${errorText}`
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const createdContact = await createResponse.json()
      console.log('Contact created in HubSpot:', createdContact.id)

      return new Response(JSON.stringify({
        success: true,
        created: true,
        hubspotId: createdContact.id,
        message: 'Contact created successfully in HubSpot'
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
    console.error('Error in hubspot-contact-validation:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
