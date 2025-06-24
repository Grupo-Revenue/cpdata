
import { useEffect, useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { validateAllBusinessStates } from '@/utils/businessCalculations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MonitoringState {
  inconsistencyCount: number;
  lastCheck: Date | null;
  isMonitoring: boolean;
  autoFixEnabled: boolean;
  lastAuditResults: any;
}

export const useBusinessStateMonitor = () => {
  const { negocios, loading, refreshNegocios } = useNegocio();
  const { toast } = useToast();
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    inconsistencyCount: 0,
    lastCheck: null,
    isMonitoring: false,
    autoFixEnabled: false,
    lastAuditResults: null
  });

  // Monitor en tiempo real con subscripción a cambios en la base de datos
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[useBusinessStateMonitor] Setting up real-time monitoring...');
      
      // Create a unique channel name to avoid conflicts
      const channelName = `business-state-monitor-${Date.now()}-${Math.random()}`;
      const channel = supabase.channel(channelName);
      
      channel
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
            setTimeout(() => validateCurrentStates(), 1000);
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
            setTimeout(() => validateCurrentStates(), 1000);
          }
        )
        .subscribe();

      return () => {
        console.log('[useBusinessStateMonitor] Cleaning up real-time monitoring...');
        supabase.removeChannel(channel);
      };
    }
  }, [negocios.length, loading]); // Simplified dependencies to prevent unnecessary re-subscriptions

  const validateCurrentStates = async () => {
    if (monitoringState.isMonitoring || negocios.length === 0) return;
    
    setMonitoringState(prev => ({ ...prev, isMonitoring: true }));
    
    try {
      console.log('[useBusinessStateMonitor] Validating current states...');
      
      const results = validateAllBusinessStates(negocios);
      
      setMonitoringState(prev => ({
        ...prev,
        inconsistencyCount: results.inconsistencies,
        lastCheck: new Date(),
        isMonitoring: false
      }));
      
      if (results.inconsistencies > 0) {
        console.warn('[useBusinessStateMonitor] Inconsistencies found:', results.inconsistentBusinesses);
        
        // Log inconsistencies to database for tracking
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
      setMonitoringState(prev => ({ ...prev, isMonitoring: false }));
    }
  };

  // Validación inicial
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[useBusinessStateMonitor] Performing initial validation...');
      validateCurrentStates();
    }
  }, [negocios.length, loading]); // Simplified dependencies

  const runComprehensiveAudit = async () => {
    try {
      console.log('[useBusinessStateMonitor] Running comprehensive audit...');
      
      const { data, error } = await supabase.functions.invoke('comprehensive-business-audit');
      
      if (error) {
        console.error('[useBusinessStateMonitor] Audit error:', error);
        throw error;
      }
      
      console.log('[useBusinessStateMonitor] Audit results:', data);
      
      setMonitoringState(prev => ({
        ...prev,
        lastAuditResults: data,
        inconsistencyCount: data.summary.inconsistentBusinesses - data.summary.fixedInThisRun
      }));
      
      toast({
        title: "Auditoría completada",
        description: `${data.summary.fixedInThisRun} inconsistencias corregidas automáticamente de ${data.summary.inconsistentBusinesses} encontradas`,
        variant: data.summary.fixedInThisRun > 0 ? "default" : "destructive"
      });
      
      // Refresh data after audit
      await refreshNegocios();
      
      return data;
    } catch (error) {
      console.error('[useBusinessStateMonitor] Error in comprehensive audit:', error);
      toast({
        title: "Error en auditoría",
        description: "No se pudo completar la auditoría comprehensiva",
        variant: "destructive"
      });
      throw error;
    }
  };

  const fixSpecificBusiness = async (negocioId: string) => {
    try {
      console.log(`[useBusinessStateMonitor] Fixing specific business: ${negocioId}`);
      
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
      
      // Log the fix
      await supabase.from('hubspot_sync_log').insert({
        negocio_id: negocioId,
        operation_type: 'state_correction_applied',
        sync_direction: 'internal',
        new_state: data,
        success: true,
        error_message: 'Manual state correction'
      });
      
      return { success: true, newState: data };
      
    } catch (error) {
      console.error(`[useBusinessStateMonitor] Error fixing business ${negocioId}:`, error);
      return { success: false, error };
    }
  };

  const toggleAutoFix = (enabled: boolean) => {
    setMonitoringState(prev => ({ ...prev, autoFixEnabled: enabled }));
    console.log(`[useBusinessStateMonitor] Auto-fix ${enabled ? 'enabled' : 'disabled'}`);
  };

  return {
    ...monitoringState,
    validateCurrentStates,
    runComprehensiveAudit,
    fixSpecificBusiness,
    toggleAutoFix
  };
};
