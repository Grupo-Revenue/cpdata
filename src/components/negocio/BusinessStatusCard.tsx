import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Bug, AlertTriangle } from 'lucide-react';
import { Negocio } from '@/types';
import BusinessStateBadge from '@/components/business/BusinessStateBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calcularValorNegocio, obtenerInfoPresupuestos } from '@/utils/businessCalculations';

interface BusinessStatusCardProps {
  negocio: Negocio;
  onRefresh: () => void;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio, onRefresh }) => {
  const { toast } = useToast();
  const [recalculating, setRecalculating] = React.useState(false);
  const [diagnosing, setDiagnosing] = React.useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>(null);
  const [fixingBusiness, setFixingBusiness] = React.useState(false);

  const handleRecalculateStates = async () => {
    setRecalculating(true);
    try {
      console.log('[BusinessStatusCard] Starting mass state recalculation...');
      
      const { data, error } = await supabase.rpc('recalcular_todos_estados_negocios');
      
      if (error) {
        console.error('[BusinessStatusCard] Error recalculating business states:', error);
        throw error;
      }

      console.log(`[BusinessStatusCard] Successfully recalculated ${data || 0} business states`);
      
      toast({
        title: "Estados recalculados",
        description: `Se actualizaron ${data || 0} negocios correctamente`
      });
      
      onRefresh();
    } catch (error) {
      console.error('[BusinessStatusCard] Error in recalculation:', error);
      toast({
        title: "Error",
        description: "No se pudieron recalcular los estados",
        variant: "destructive"
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleFixSpecificBusiness = async () => {
    setFixingBusiness(true);
    try {
      console.log(`[BusinessStatusCard] Fixing specific business ${negocio.id}...`);
      
      // Calcular el estado correcto
      const { data: calculatedState, error: calcError } = await supabase
        .rpc('calcular_estado_negocio', { negocio_id_param: negocio.id });

      if (calcError) {
        console.error('[BusinessStatusCard] Error calculating state:', calcError);
        throw calcError;
      }

      // Actualizar el estado si es diferente
      if (negocio.estado !== calculatedState) {
        const { error: updateError } = await supabase
          .from('negocios')
          .update({ 
            estado: calculatedState,
            updated_at: new Date().toISOString()
          })
          .eq('id', negocio.id);

        if (updateError) {
          console.error('[BusinessStatusCard] Error updating business state:', updateError);
          throw updateError;
        }

        console.log(`[BusinessStatusCard] Successfully corrected business state from ${negocio.estado} to ${calculatedState}`);
        
        toast({
          title: "Estado corregido",
          description: `El estado se ha corregido de "${negocio.estado}" a "${calculatedState}"`,
        });
        
        onRefresh();
      } else {
        toast({
          title: "Sin cambios necesarios",
          description: "El estado del negocio ya es correcto",
        });
      }

    } catch (error) {
      console.error('[BusinessStatusCard] Error fixing business:', error);
      toast({
        title: "Error",
        description: "No se pudo corregir el estado del negocio",
        variant: "destructive"
      });
    } finally {
      setFixingBusiness(false);
    }
  };

  const handleDiagnoseBusiness = async () => {
    setDiagnosing(true);
    try {
      console.log(`[BusinessStatusCard] Starting diagnosis for business ${negocio.id}...`);
      
      // Get current business data
      const { data: currentData, error: fetchError } = await supabase
        .from('negocios')
        .select(`
          *,
          presupuestos (
            id,
            estado,
            facturado,
            total,
            created_at,
            fecha_envio,
            fecha_aprobacion,
            fecha_rechazo,
            fecha_vencimiento
          )
        `)
        .eq('id', negocio.id)
        .single();

      if (fetchError) {
        console.error('[BusinessStatusCard] Error fetching business data:', fetchError);
        throw fetchError;
      }

      // Calculate what the state should be
      const { data: calculatedState, error: calcError } = await supabase
        .rpc('calcular_estado_negocio', { negocio_id_param: negocio.id });

      if (calcError) {
        console.error('[BusinessStatusCard] Error calculating state:', calcError);
        throw calcError;
      }

      // Get budget statistics using the properly formatted negocio
      const budgetInfo = obtenerInfoPresupuestos(negocio);
      const totalValue = calcularValorNegocio(negocio);

      const diagnostics = {
        businessId: negocio.id,
        businessNumber: negocio.numero,
        currentState: currentData.estado,
        calculatedState: calculatedState,
        stateMatches: currentData.estado === calculatedState,
        totalBudgets: budgetInfo.totalPresupuestos,
        approvedBudgets: budgetInfo.presupuestosAprobados,
        sentBudgets: budgetInfo.presupuestosEnviados,
        rejectedBudgets: budgetInfo.presupuestosRechazados,
        expiredBudgets: budgetInfo.presupuestosVencidos,
        invoicedBudgets: budgetInfo.presupuestosFacturados,
        draftBudgets: budgetInfo.presupuestosBorrador,
        totalValue: totalValue,
        budgets: currentData.presupuestos?.map(p => ({
          id: p.id,
          estado: p.estado,
          facturado: p.facturado,
          total: p.total,
          created_at: p.created_at
        })) || [],
        lastUpdated: currentData.updated_at
      };

      console.log('[BusinessStatusCard] Diagnostic results:', diagnostics);
      setDiagnosticInfo(diagnostics);

      // If states don't match, try to fix it
      if (!diagnostics.stateMatches) {
        console.log(`[BusinessStatusCard] State mismatch detected! Current: ${currentData.estado}, Should be: ${calculatedState}`);
        
        const { error: updateError } = await supabase
          .from('negocios')
          .update({ 
            estado: calculatedState,
            updated_at: new Date().toISOString()
          })
          .eq('id', negocio.id);

        if (updateError) {
          console.error('[BusinessStatusCard] Error updating business state:', updateError);
          toast({
            title: "Estado corregido con advertencia",
            description: `Estado detectado: ${calculatedState}, pero hubo un error al actualizarlo`,
            variant: "destructive"
          });
        } else {
          console.log('[BusinessStatusCard] Successfully corrected business state');
          toast({
            title: "Estado corregido",
            description: `El estado se ha corregido de "${currentData.estado}" a "${calculatedState}"`,
          });
          onRefresh();
        }
      } else {
        toast({
          title: "Diagnóstico completado",
          description: "El estado del negocio es correcto",
        });
      }

    } catch (error) {
      console.error('[BusinessStatusCard] Error in diagnosis:', error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo completar el diagnóstico",
        variant: "destructive"
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const getStatusDescription = () => {
    switch (negocio.estado) {
      case 'oportunidad_creada':
        return 'Negocio creado sin presupuestos';
      case 'presupuesto_enviado':
        return 'Presupuestos enviados pendientes de respuesta';
      case 'negocio_aceptado':
        return 'Todos los presupuestos han sido aprobados';
      case 'parcialmente_aceptado':
        return 'Algunos presupuestos aprobados, otros pendientes';
      case 'negocio_perdido':
        return 'Presupuestos rechazados o vencidos';
      case 'negocio_cerrado':
        return 'Negocio facturado y cerrado';
      default:
        return 'Estado del negocio';
    }
  };

  const budgetInfo = obtenerInfoPresupuestos(negocio);
  const shouldBePartiallyAccepted = budgetInfo.presupuestosAprobados > 0 && 
                                   budgetInfo.presupuestosAprobados < budgetInfo.totalPresupuestos;
  const hasStateIssue = shouldBePartiallyAccepted && negocio.estado !== 'parcialmente_aceptado';

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              Estado del Negocio
            </CardTitle>
            {hasStateIssue && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiagnoseBusiness}
              disabled={diagnosing}
              className="h-8 px-3"
            >
              <Bug className={`w-4 h-4 mr-1 ${diagnosing ? 'animate-spin' : ''}`} />
              Diagnosticar
            </Button>
            {hasStateIssue && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleFixSpecificBusiness}
                disabled={fixingBusiness}
                className="h-8 px-3"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${fixingBusiness ? 'animate-spin' : ''}`} />
                Corregir
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateStates}
              disabled={recalculating}
              className="h-8 px-3"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${recalculating ? 'animate-spin' : ''}`} />
              Recalcular
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Estado Actual:</span>
            <BusinessStateBadge estado={negocio.estado} />
          </div>
          
          <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Descripción:</p>
            <p>{getStatusDescription()}</p>
          </div>

          {diagnosticInfo && (
            <div className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-medium mb-2 text-blue-800">📊 Información de Diagnóstico:</p>
              <div className="grid grid-cols-2 gap-2 text-blue-700">
                <div>Total Presupuestos: {diagnosticInfo.totalBudgets}</div>
                <div>Aprobados: {diagnosticInfo.approvedBudgets}</div>
                <div>Enviados: {diagnosticInfo.sentBudgets}</div>
                <div>Rechazados: {diagnosticInfo.rejectedBudgets}</div>
                <div>Estado Calculado: {diagnosticInfo.calculatedState}</div>
                <div>Estado Actual: {diagnosticInfo.currentState}</div>
              </div>
              <div className="mt-2">
                <span className={`font-medium ${diagnosticInfo.stateMatches ? 'text-green-700' : 'text-red-700'}`}>
                  {diagnosticInfo.stateMatches ? '✅ Estados coinciden' : '❌ Estados no coinciden'}
                </span>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 border-t pt-3">
            <p className="mb-1">
              <strong>Nota:</strong> Los estados se calculan automáticamente según las reglas de negocio:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Sin presupuestos → Oportunidad Creada</li>
              <li>Con presupuestos enviados → Presupuesto Enviado</li>
              <li>Todos aprobados → Negocio Aceptado</li>
              <li>Algunos aprobados → Parcialmente Aceptado</li>
              <li>Rechazados/vencidos → Negocio Perdido</li>
              <li>Aprobados y facturados → Negocio Cerrado</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessStatusCard;
