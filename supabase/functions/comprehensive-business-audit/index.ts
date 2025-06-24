
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessAnalysis {
  negocioId: string;
  numero: number;
  currentState: string;
  expectedState: string;
  isInconsistent: boolean;
  reason: string;
  budgetBreakdown: {
    total: number;
    approved: number;
    sent: number;
    rejected: number;
    expired: number;
    draft: number;
    invoiced: number;
  };
  confidence: 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[comprehensive-business-audit] Starting comprehensive audit...')

    // Get all businesses with their budgets
    const { data: businesses, error: fetchError } = await supabase
      .from('negocios')
      .select(`
        id,
        numero,
        estado,
        updated_at,
        presupuestos (
          id,
          estado,
          facturado,
          total,
          created_at,
          fecha_vencimiento
        )
      `)
      .order('numero', { ascending: true })

    if (fetchError) {
      console.error('[comprehensive-business-audit] Error fetching businesses:', fetchError)
      throw fetchError
    }

    console.log(`[comprehensive-business-audit] Analyzing ${businesses?.length || 0} businesses...`)

    const analysisResults: BusinessAnalysis[] = []
    let fixedCount = 0
    let highConfidenceInconsistencies = 0

    for (const business of businesses || []) {
      const budgets = business.presupuestos || []
      
      // Calculate budget breakdown
      const budgetBreakdown = {
        total: budgets.length,
        approved: budgets.filter(b => b.estado === 'aprobado').length,
        sent: budgets.filter(b => b.estado === 'enviado').length,
        rejected: budgets.filter(b => b.estado === 'rechazado').length,
        expired: budgets.filter(b => b.estado === 'vencido').length,
        draft: budgets.filter(b => b.estado === 'borrador').length,
        invoiced: budgets.filter(b => b.estado === 'aprobado' && b.facturado === true).length,
      }

      // Determine expected state using business rules
      let expectedState = 'oportunidad_creada'
      let reason = 'No budgets exist'
      let confidence: 'high' | 'medium' | 'low' = 'high'

      if (budgetBreakdown.total === 0) {
        expectedState = 'oportunidad_creada'
        reason = 'No budgets created'
      } else if (budgetBreakdown.invoiced > 0 && budgetBreakdown.invoiced === budgetBreakdown.approved) {
        expectedState = 'negocio_cerrado'
        reason = 'All approved budgets are invoiced'
      } else if (budgetBreakdown.approved === budgetBreakdown.total) {
        expectedState = 'negocio_aceptado'
        reason = 'All budgets are approved'
      } else if (budgetBreakdown.approved > 0 && budgetBreakdown.approved < budgetBreakdown.total) {
        expectedState = 'parcialmente_aceptado'
        reason = `${budgetBreakdown.approved} of ${budgetBreakdown.total} budgets approved`
      } else if ((budgetBreakdown.rejected + budgetBreakdown.expired) === budgetBreakdown.total) {
        expectedState = 'negocio_perdido'
        reason = 'All budgets rejected or expired'
      } else if (budgetBreakdown.sent > 0 || budgetBreakdown.draft > 0) {
        expectedState = 'presupuesto_enviado'
        reason = 'Has sent or draft budgets'
      }

      // Determine confidence level
      if (budgetBreakdown.total === 0 || budgetBreakdown.approved === budgetBreakdown.total || 
          (budgetBreakdown.rejected + budgetBreakdown.expired) === budgetBreakdown.total) {
        confidence = 'high'
      } else if (budgetBreakdown.approved > 0) {
        confidence = 'high'
      } else {
        confidence = 'medium'
      }

      const isInconsistent = business.estado !== expectedState
      const autoFixable = confidence === 'high' && isInconsistent

      const analysis: BusinessAnalysis = {
        negocioId: business.id,
        numero: business.numero,
        currentState: business.estado,
        expectedState,
        isInconsistent,
        reason,
        budgetBreakdown,
        confidence,
        autoFixable
      }

      analysisResults.push(analysis)

      if (isInconsistent) {
        console.log(`[comprehensive-business-audit] Business ${business.numero}: ${business.estado} -> ${expectedState} (${confidence} confidence)`)
        
        if (confidence === 'high') {
          highConfidenceInconsistencies++
        }

        // Auto-fix high confidence inconsistencies
        if (autoFixable) {
          try {
            const { error: updateError } = await supabase
              .from('negocios')
              .update({ 
                estado: expectedState,
                updated_at: new Date().toISOString()
              })
              .eq('id', business.id)

            if (updateError) {
              console.error(`[comprehensive-business-audit] Error fixing business ${business.numero}:`, updateError)
            } else {
              console.log(`[comprehensive-business-audit] Auto-fixed business ${business.numero}: ${business.estado} -> ${expectedState}`)
              fixedCount++
            }
          } catch (error) {
            console.error(`[comprehensive-business-audit] Exception fixing business ${business.numero}:`, error)
          }
        }
      }
    }

    // Generate detailed report
    const totalBusinesses = analysisResults.length
    const inconsistentBusinesses = analysisResults.filter(a => a.isInconsistent)
    const autoFixableCount = analysisResults.filter(a => a.autoFixable).length

    const report = {
      summary: {
        totalBusinesses,
        inconsistentBusinesses: inconsistentBusinesses.length,
        highConfidenceInconsistencies,
        autoFixableInconsistencies: autoFixableCount,
        fixedInThisRun: fixedCount,
        auditTimestamp: new Date().toISOString()
      },
      inconsistencies: inconsistentBusinesses.map(analysis => ({
        numero: analysis.numero,
        negocioId: analysis.negocioId,
        currentState: analysis.currentState,
        expectedState: analysis.expectedState,
        reason: analysis.reason,
        confidence: analysis.confidence,
        autoFixable: analysis.autoFixable,
        budgetBreakdown: analysis.budgetBreakdown
      })),
      fixedBusinesses: analysisResults
        .filter(a => a.autoFixable && a.isInconsistent)
        .slice(0, fixedCount)
        .map(a => ({
          numero: a.numero,
          from: a.currentState,
          to: a.expectedState,
          reason: a.reason
        }))
    }

    console.log(`[comprehensive-business-audit] Audit complete:`, report.summary)

    return new Response(
      JSON.stringify(report),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('[comprehensive-business-audit] Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
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
