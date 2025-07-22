import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ConsistencyIssue {
  issue_type: string;
  description: string;
  expected_number: number;
  actual_number: number;
  negocio_id: string;
}

export const useBusinessNumberingAudit = () => {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<ConsistencyIssue[]>([]);

  const checkConsistency = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      
      const currentUser = userId || (await supabase.auth.getUser()).data.user?.id;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .rpc('check_business_numbering_consistency', { p_user_id: currentUser });

      if (error) throw error;

      setIssues(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Inconsistencias detectadas",
          description: `Se encontraron ${data.length} problema(s) en la numeración.`,
          variant: "destructive"
        });
      }

      return { success: true, issues: data || [] };
    } catch (error) {
      console.error('Error checking numbering consistency:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar la consistencia de la numeración.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logNumberAssignment = useCallback(async (
    businessNumber: number,
    negocioId?: string,
    status: string = 'assigned',
    notes?: string
  ) => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .rpc('log_business_number_assignment', {
          p_user_id: currentUser,
          p_business_number: businessNumber,
          p_negocio_id: negocioId,
          p_status: status,
          p_notes: notes
        });

      if (error) throw error;

      return { success: true, auditId: data };
    } catch (error) {
      console.error('Error logging number assignment:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const getNextNumber = useCallback(async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user?.id;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .rpc('get_next_business_number', { p_user_id: currentUser });

      if (error) throw error;

      return { success: true, number: data };
    } catch (error) {
      console.error('Error getting next number:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const runSystemMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('run_numbering_system_maintenance');

      if (error) throw error;
      
      toast({
        title: "Mantenimiento completado",
        description: `${data?.[0]?.corrections_made || 0} correcciones aplicadas`,
      });
      return { success: true, results: data };
    } catch (error) {
      console.error('Error running maintenance:', error);
      toast({
        title: "Error",
        description: "Error en el mantenimiento del sistema",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fixAllCounters = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('fix_all_user_counters');

      if (error) throw error;
      
      const corrections = data?.filter((r: any) => r.correction_applied)?.length || 0;
      toast({
        title: "Corrección completada",
        description: `${corrections} contadores corregidos`,
      });
      return { success: true, results: data };
    } catch (error) {
      console.error('Error fixing counters:', error);
      toast({
        title: "Error",
        description: "Error corrigiendo contadores",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    issues,
    checkConsistency,
    logNumberAssignment,
    getNextNumber,
    runSystemMaintenance,
    fixAllCounters
  };
};