import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's active HubSpot API key
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('hubspot_api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('activo', true)
      .single()

    if (apiKeyError || !apiKeyData) {
      console.error('Error getting HubSpot API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: 'No se encontró una API key activa de HubSpot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Fetching HubSpot pipelines for user:', user.id)

    // Fetch pipelines from HubSpot
    const pipelinesResponse = await fetch(
      'https://api.hubapi.com/crm/v3/pipelines/deals',
      {
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!pipelinesResponse.ok) {
      const errorText = await pipelinesResponse.text()
      console.error('HubSpot API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Error al obtener pipelines de HubSpot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pipelinesData = await pipelinesResponse.json()
    console.log('Successfully fetched pipelines:', pipelinesData.results?.length || 0)

    // Transform the data to match our interface
    const pipelines = pipelinesData.results?.map((pipeline: any) => ({
      id: pipeline.id,
      name: pipeline.label,
      stages: pipeline.stages?.map((stage: any) => ({
        id: stage.id,
        name: stage.label
      })) || []
    })) || []

    return new Response(
      JSON.stringify({ pipelines }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})