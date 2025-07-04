
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, action, contactData } = await req.json()
    console.log(`Processing ${action} for email: ${email}`)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's HubSpot API key
    const { data: hubspotConfig, error: configError } = await supabase
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('activo', true)
      .single()

    if (configError || !hubspotConfig) {
      throw new Error('HubSpot API key not found or inactive')
    }

    const hubspotApiKey = hubspotConfig.api_key

    if (action === 'search') {
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
        console.error('HubSpot search error:', errorText)
        throw new Error(`HubSpot API error: ${searchResponse.status}`)
      }

      const searchResult = await searchResponse.json()
      console.log('HubSpot search result:', searchResult)

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
        console.error('HubSpot create error:', errorText)
        throw new Error(`Failed to create contact in HubSpot: ${createResponse.status}`)
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

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error in hubspot-contact-validation:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
