
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[business-state-maintenance] Starting maintenance task...')

    // Run comprehensive audit and fix
    const { data: auditResult, error: auditError } = await supabase
      .rpc('comprehensive_state_audit_and_fix')

    if (auditError) {
      console.error('[business-state-maintenance] Audit error:', auditError)
      throw auditError
    }

    console.log('[business-state-maintenance] Audit completed:', auditResult)

    // Update expired budgets
    const { error: expiredError } = await supabase
      .rpc('actualizar_presupuestos_vencidos')

    if (expiredError) {
      console.error('[business-state-maintenance] Error updating expired budgets:', expiredError)
      throw expiredError
    }

    // Recalculate all business states
    const { data: recalcResult, error: recalcError } = await supabase
      .rpc('recalcular_todos_estados_negocios')

    if (recalcError) {
      console.error('[business-state-maintenance] Recalculation error:', recalcError)
      throw recalcError
    }

    console.log('[business-state-maintenance] Recalculated states for', recalcResult, 'businesses')

    // Create maintenance log entry
    const maintenanceResult = {
      timestamp: new Date().toISOString(),
      audit_result: auditResult,
      recalculated_businesses: recalcResult,
      success: true
    }

    console.log('[business-state-maintenance] Maintenance completed successfully:', maintenanceResult)

    return new Response(
      JSON.stringify(maintenanceResult),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('[business-state-maintenance] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    )
  }
})
