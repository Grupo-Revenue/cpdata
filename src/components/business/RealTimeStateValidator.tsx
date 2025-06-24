
import React, { useEffect, useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { validateAllBusinessStates } from '@/utils/businessCalculations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const RealTimeStateValidator: React.FC = () => {
  const { negocios, loading, refreshNegocios } = useNegocio();
  const { toast } = useToast();
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  // Validación automática al cargar la página
  useEffect(() => {
    if (!loading && negocios.length > 0) {
      console.log('[RealTimeStateValidator] Starting automatic validation on page load...');
      performValidation();
    }
  }, [negocios, loading]);

  // Validación periódica cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && negocios.length > 0) {
        console.log('[RealTimeStateValidator] Performing periodic validation...');
        performValidation();
      }
    }, 120000); // 2 minutos

    return () => clearInterval(interval);
  }, [negocios, loading]);

  const performValidation = async () => {
    if (isValidating || negocios.length === 0) return;
    
    setIsValidating(true);
    try {
      console.log('[RealTimeStateValidator] Validating business states...');
      
      const results = validateAllBusinessStates(negocios);
      setValidationResults(results);
      setLastValidation(new Date());
      
      if (results.inconsistencies > 0) {
        console.warn('[RealTimeStateValidator] Found inconsistencies:', results.inconsistentBusinesses);
        
        // Mostrar notificación discreta
        toast({
          title: "Inconsistencias detectadas",
          description: `${results.inconsistencies} negocios con estados incorrectos`,
          variant: "destructive",
        });
      } else {
        console.log('[RealTimeStateValidator] All business states are consistent');
      }
    } catch (error) {
      console.error('[RealTimeStateValidator] Error during validation:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const fixBusiness17662 = async () => {
    setIsFixing(true);
    try {
      console.log('[RealTimeStateValidator] Fixing business #17662...');
      
      // Find business 17662
      const business17662 = negocios.find(n => n.numero === 17662);
      if (!business17662) {
        throw new Error('Business #17662 not found');
      }

      // Calculate correct state
      const { data: correctState, error: calcError } = await supabase.rpc('calcular_estado_negocio', {
        negocio_id_param: business17662.id
      });
      
      if (calcError) throw calcError;

      // Update the business state
      const { error: updateError } = await supabase
        .from('negocios')
        .update({ 
          estado: correctState,
          updated_at: new Date().toISOString()
        })
        .eq('id', business17662.id);
        
      if (updateError) throw updateError;

      console.log('[RealTimeStateValidator] Successfully fixed business #17662');
      
      toast({
        title: "Negocio corregido",
        description: `Negocio #17662 actualizado al estado: ${correctState}`,
        variant: "default"
      });
      
      // Refrescar datos después de la corrección
      await refreshNegocios();
      
      // Re-validar después de la corrección
      setTimeout(() => performValidation(), 1000);
      
    } catch (error) {
      console.error('[RealTimeStateValidator] Error in fix process:', error);
      toast({
        title: "Error",
        description: "No se pudo corregir el negocio #17662",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  const runComprehensiveAudit = async () => {
    setIsFixing(true);
    let fixedCount = 0;
    let errorCount = 0;
    
    try {
      console.log('[RealTimeStateValidator] Running comprehensive audit...');
      
      if (validationResults?.inconsistentBusinesses?.length > 0) {
        for (const inconsistency of validationResults.inconsistentBusinesses) {
          try {
            console.log(`[RealTimeStateValidator] Fixing business ${inconsistency.numero} (${inconsistency.negocioId})`);
            
            const { error } = await supabase
              .from('negocios')
              .update({ 
                estado: inconsistency.expectedState,
                updated_at: new Date().toISOString()
              })
              .eq('id', inconsistency.negocioId);

            if (error) {
              console.error(`[RealTimeStateValidator] Error fixing business ${inconsistency.numero}:`, error);
              errorCount++;
            } else {
              console.log(`[RealTimeStateValidator] Successfully fixed business ${inconsistency.numero}`);
              fixedCount++;
            }
          } catch (error) {
            console.error(`[RealTimeStateValidator] Exception fixing business ${inconsistency.numero}:`, error);
            errorCount++;
          }
        }
      }

      console.log(`[RealTimeStateValidator] Audit completed: ${fixedCount} fixed, ${errorCount} errors`);
      
      toast({
        title: "Auditoría completada",
        description: `${fixedCount} inconsistencias corregidas. ${errorCount > 0 ? `${errorCount} errores.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });
      
      // Refrescar datos después de la auditoría
      await refreshNegocios();
      
      // Re-validar después de la auditoría
      setTimeout(() => performValidation(), 1000);
      
    } catch (error) {
      console.error('[RealTimeStateValidator] Error in audit process:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la auditoría",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  // No mostrar nada si no hay inconsistencias
  if (!validationResults || validationResults.inconsistencies === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Inconsistencias detectadas:</strong> {validationResults.inconsistencies} negocios con estados incorrectos.
              {lastValidation && (
                <div className="text-xs text-gray-500 mt-1">
                  Última validación: {lastValidation.toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="flex space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={fixBusiness17662}
                disabled={isFixing}
                className="h-8"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isFixing ? 'animate-spin' : ''}`} />
                Corregir #17662
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={runComprehensiveAudit}
                disabled={isFixing}
                className="h-8"
              >
                <CheckCircle className={`w-3 h-3 mr-1 ${isFixing ? 'animate-spin' : ''}`} />
                Auditoría Completa
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={performValidation}
                disabled={isValidating}
                className="h-8"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isValidating ? 'animate-spin' : ''}`} />
                Re-validar
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RealTimeStateValidator;
