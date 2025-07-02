import { useEffect, useState, useRef } from 'react';
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
  const channelRef = useRef<any>(null);
  const subscriptionActiveRef = useRef(false);
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({
    inconsistencyCount: 0,
    lastCheck: null,
    isMonitoring: false,
    autoFixEnabled: false,
    lastAuditResults: null
  });

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

  // Clean up channel function
  const cleanupChannel = () => {
    if (channelRef.current && subscriptionActiveRef.current) {
      console.log('[useBusinessStateMonitor] Cleaning up existing channel...');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('[useBusinessStateMonitor] Error removing channel:', error);
      }
      channelRef.current = null;
      subscriptionActiveRef.current = false;
    }
  };

  // Monitor en tiempo real con subscripción a cambios en la base de datos
  useEffect(() => {
    // Skip if loading or no negocios
    if (loading || negocios.length === 0) {
      cleanupChannel();
      return;
    }

    // Skip if already subscribed
    if (subscriptionActiveRef.current) {
      return;
    }

    console.log('[useBusinessStateMonitor] Setting up real-time monitoring...');
    
    // Clean up any existing channel first
    cleanupChannel();

    // Create a unique channel name
    const channelName = `business-state-monitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;
    
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
      .subscribe((status) => {
        console.log(`[useBusinessStateMonitor] Channel subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          subscriptionActiveRef.current = true;
        } else if (status === 'CLOSED') {
          subscriptionActiveRef.current = false;
        }
      });

    return () => {
      console.log('[useBusinessStateMonitor] Cleaning up real-time monitoring...');
      cleanupChannel();
    };
  }, [loading]); // Only depend on loading state

  // Validación inicial
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[useBusinessStateMonitor] Performing initial validation...');
      setTimeout(() => validateCurrentStates(), 500);
    }
  }, [loading, negocios.length]);

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
