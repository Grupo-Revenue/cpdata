
import { useEffect, useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { validateAllBusinessStates } from '@/utils/businessCalculations';
import { supabase } from '@/integrations/supabase/client';

export const useBusinessStateMonitor = () => {
  const { negocios, loading } = useNegocio();
  const [inconsistencyCount, setInconsistencyCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Monitor en tiempo real con subscripción a cambios en la base de datos
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      const channel = supabase
        .channel('business-state-monitor')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'negocios',
            filter: 'estado=neq.null'
          },
          (payload) => {
            console.log('[useBusinessStateMonitor] Business state changed:', payload);
            // Trigger re-validation after state change
            setTimeout(() => {
              validateCurrentStates();
            }, 1000);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'presupuestos'
          },
          (payload) => {
            console.log('[useBusinessStateMonitor] Budget changed:', payload);
            // Trigger re-validation after budget change
            setTimeout(() => {
              validateCurrentStates();
            }, 1000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [negocios, loading]);

  const validateCurrentStates = async () => {
    if (isMonitoring || negocios.length === 0) return;
    
    setIsMonitoring(true);
    try {
      console.log('[useBusinessStateMonitor] Validating current states...');
      
      const results = validateAllBusinessStates(negocios);
      setInconsistencyCount(results.inconsistencies);
      setLastCheck(new Date());
      
      if (results.inconsistencies > 0) {
        console.warn('[useBusinessStateMonitor] Inconsistencies found:', results.inconsistentBusinesses);
        
        // Log inconsistencies to database
        for (const business of results.inconsistentBusinesses) {
          try {
            await supabase.from('hubspot_sync_log').insert({
              negocio_id: business.negocioId,
              operation_type: 'state_inconsistency_detected',
              sync_direction: 'internal',
              old_state: business.currentState,
              new_state: business.expectedState,
              success: false,
              error_message: business.reason
            });
          } catch (error) {
            console.error('[useBusinessStateMonitor] Error logging inconsistency:', error);
          }
        }
      }
    } catch (error) {
      console.error('[useBusinessStateMonitor] Error during validation:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  // Validación inicial
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      validateCurrentStates();
    }
  }, [negocios, loading]);

  const fixSpecificBusiness = async (negocioId: string) => {
    try {
      console.log(`[useBusinessStateMonitor] Fixing business state for: ${negocioId}`);
      
      const { data, error } = await supabase.rpc('calcular_estado_negocio', {
        negocio_id_param: negocioId
      });
      
      if (error) throw error;
      
      // Update the business state
      const { error: updateError } = await supabase
        .from('negocios')
        .update({ 
          estado: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', negocioId);
        
      if (updateError) throw updateError;
      
      console.log(`[useBusinessStateMonitor] Successfully fixed business ${negocioId} to state: ${data}`);
      return { success: true, newState: data };
      
    } catch (error) {
      console.error(`[useBusinessStateMonitor] Error fixing business ${negocioId}:`, error);
      return { success: false, error };
    }
  };

  return {
    inconsistencyCount,
    lastCheck,
    isMonitoring,
    validateCurrentStates,
    fixSpecificBusiness
  };
};
