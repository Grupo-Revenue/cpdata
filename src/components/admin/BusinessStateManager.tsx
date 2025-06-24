
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Clock,
  Database,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNegocio } from '@/context/NegocioContext';
import { validateAllBusinessStates, analyzeBusinessState } from '@/utils/businessCalculations';

interface StateInconsistency {
  negocioId: string;
  numero: number;
  currentState: string;
  expectedState: string;
  reason: string;
  budgetInfo: any;
}

const BusinessStateManager: React.FC = () => {
  const { negocios, loading } = useNegocio();
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [fixingInconsistencies, setFixingInconsistencies] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  // Auto-validate on component mount and when negocios change
  useEffect(() => {
    if (negocios.length > 0 && !loading) {
      validateStates();
    }
  }, [negocios, loading]);

  const validateStates = async () => {
    if (loading || negocios.length === 0) return;
    
    setValidating(true);
    try {
      console.log('[BusinessStateManager] Starting state validation...');
      
      const results = validateAllBusinessStates(negocios);
      setValidationResults(results);
      setLastValidation(new Date());
      
      console.log('[BusinessStateManager] Validation results:', results);
      
      if (results.inconsistencies > 0) {
        toast({
          title: "Inconsistencias detectadas",
          description: `Se encontraron ${results.inconsistencies} negocios con estados incorrectos`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Validación completada",
          description: `Todos los ${results.totalBusinesses} negocios tienen estados correctos`,
        });
      }
    } catch (error) {
      console.error('[BusinessStateManager] Error in validation:', error);
      toast({
        title: "Error en validación",
        description: "No se pudo completar la validación",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const recalculateAllStates = async () => {
    setRecalculatingAll(true);
    try {
      console.log('[BusinessStateManager] Starting mass recalculation...');
      
      const { data, error } = await supabase.rpc('recalcular_todos_estados_negocios');
      
      if (error) {
        console.error('[BusinessStateManager] Error in mass recalculation:', error);
        throw error;
      }

      console.log(`[BusinessStateManager] Mass recalculation completed: ${data} businesses updated`);
      
      toast({
        title: "Recálculo completado",
        description: `Se actualizaron ${data || 0} negocios correctamente`
      });
      
      // Re-validate after recalculation
      setTimeout(() => validateStates(), 1000);
      
    } catch (error) {
      console.error('[BusinessStateManager] Error in mass recalculation:', error);
      toast({
        title: "Error en recálculo",
        description: "No se pudo completar el recálculo masivo",
        variant: "destructive"
      });
    } finally {
      setRecalculatingAll(false);
    }
  };

  const fixInconsistencies = async () => {
    if (!validationResults?.inconsistentBusinesses?.length) return;
    
    setFixingInconsistencies(true);
    let fixedCount = 0;
    let errorCount = 0;
    
    try {
      console.log('[BusinessStateManager] Starting to fix inconsistencies...');
      
      for (const inconsistency of validationResults.inconsistentBusinesses) {
        try {
          console.log(`[BusinessStateManager] Fixing business ${inconsistency.numero} (${inconsistency.negocioId})`);
          
          const { error } = await supabase
            .from('negocios')
            .update({ 
              estado: inconsistency.expectedState,
              updated_at: new Date().toISOString()
            })
            .eq('id', inconsistency.negocioId);

          if (error) {
            console.error(`[BusinessStateManager] Error fixing business ${inconsistency.numero}:`, error);
            errorCount++;
          } else {
            console.log(`[BusinessStateManager] Successfully fixed business ${inconsistency.numero}`);
            fixedCount++;
          }
        } catch (error) {
          console.error(`[BusinessStateManager] Exception fixing business ${inconsistency.numero}:`, error);
          errorCount++;
        }
      }
      
      console.log(`[BusinessStateManager] Fix completed: ${fixedCount} fixed, ${errorCount} errors`);
      
      toast({
        title: "Corrección completada",
        description: `Se corrigieron ${fixedCount} negocios. ${errorCount > 0 ? `${errorCount} errores.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });
      
      // Re-validate after fixing
      setTimeout(() => validateStates(), 1000);
      
    } catch (error) {
      console.error('[BusinessStateManager] Error in fix process:', error);
      toast({
        title: "Error en corrección",
        description: "No se pudo completar la corrección de inconsistencias",
        variant: "destructive"
      });
    } finally {
      setFixingInconsistencies(false);
    }
  };

  const getStateColor = (state: string) => {
    const colors = {
      'oportunidad_creada': 'bg-slate-100 text-slate-700',
      'presupuesto_enviado': 'bg-blue-100 text-blue-700',
      'parcialmente_aceptado': 'bg-yellow-100 text-yellow-700',
      'negocio_aceptado': 'bg-emerald-100 text-emerald-700',
      'negocio_cerrado': 'bg-green-100 text-green-700',
      'negocio_perdido': 'bg-red-100 text-red-700'
    };
    return colors[state] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Gestión de Estados de Negocios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={validateStates}
              disabled={validating || loading}
              className="flex items-center space-x-2"
            >
              <Search className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
              <span>Validar Estados</span>
            </Button>
            
            <Button
              onClick={recalculateAllStates}
              disabled={recalculatingAll || loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${recalculatingAll ? 'animate-spin' : ''}`} />
              <span>Recalcular Todo</span>
            </Button>
            
            <Button
              onClick={fixInconsistencies}
              disabled={fixingInconsistencies || !validationResults?.inconsistencies}
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Activity className={`w-4 h-4 ${fixingInconsistencies ? 'animate-spin' : ''}`} />
              <span>Corregir Inconsistencias</span>
            </Button>
          </div>
          
          {lastValidation && (
            <div className="mt-4 text-sm text-gray-500 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Última validación: {lastValidation.toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados de Validación</span>
              <div className="flex items-center space-x-2">
                {validationResults.inconsistencies === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {validationResults.totalBusinesses}
                </div>
                <div className="text-sm text-gray-500">Total Negocios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResults.validStates}
                </div>
                <div className="text-sm text-gray-500">Estados Correctos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResults.inconsistencies}
                </div>
                <div className="text-sm text-gray-500">Inconsistencias</div>
              </div>
            </div>

            {validationResults.inconsistencies === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ Todos los estados de negocios son correctos. No se detectaron inconsistencias.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ Se detectaron {validationResults.inconsistencies} inconsistencias que requieren corrección.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inconsistencies Detail */}
      {validationResults?.inconsistentBusinesses?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Negocios con Inconsistencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationResults.inconsistentBusinesses.map((inconsistency: StateInconsistency) => (
                <div key={inconsistency.negocioId} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Negocio #{inconsistency.numero}</h4>
                    <div className="flex space-x-2">
                      <Badge className={getStateColor(inconsistency.currentState)}>
                        Actual: {inconsistency.currentState}
                      </Badge>
                      <Badge className={getStateColor(inconsistency.expectedState)}>
                        Esperado: {inconsistency.expectedState}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{inconsistency.reason}</p>
                  <div className="text-xs text-gray-500">
                    Presupuestos: {inconsistency.budgetInfo.totalPresupuestos} total, {' '}
                    {inconsistency.budgetInfo.presupuestosAprobados} aprobados, {' '}
                    {inconsistency.budgetInfo.presupuestosEnviados} enviados
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessStateManager;
