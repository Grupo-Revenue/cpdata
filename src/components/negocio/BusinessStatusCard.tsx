
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Bug, AlertTriangle, CheckCircle } from 'lucide-react';
import { Negocio } from '@/types';
import BusinessStateBadge from '@/components/business/BusinessStateBadge';
import { useToast } from '@/hooks/use-toast';
import { useBusinessStateMonitor } from '@/hooks/useBusinessStateMonitor';
import { calcularValorNegocio, obtenerInfoPresupuestos, analyzeBusinessState } from '@/utils/businessCalculations';

interface BusinessStatusCardProps {
  negocio: Negocio;
  onRefresh: () => void;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio, onRefresh }) => {
  const { toast } = useToast();
  const { 
    runComprehensiveAudit, 
    fixSpecificBusiness 
  } = useBusinessStateMonitor();
  
  const [diagnosing, setDiagnosing] = React.useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = React.useState<any>(null);
  const [isFixing, setIsFixing] = React.useState(false);

  // Analyze current business state
  const stateAnalysis = analyzeBusinessState(negocio);
  const budgetInfo = obtenerInfoPresupuestos(negocio);
  const totalValue = calcularValorNegocio(negocio);

  const handleRunComprehensiveAudit = async () => {
    try {
      await runComprehensiveAudit();
      onRefresh();
    } catch (error) {
      console.error('Error running comprehensive audit:', error);
    }
  };

  const handleFixThisBusiness = async () => {
    setIsFixing(true);
    try {
      const result = await fixSpecificBusiness(negocio.id);
      
      if (result.success) {
        toast({
          title: "Estado corregido",
          description: `El estado se ha corregido a "${result.newState}"`,
        });
        onRefresh();
      } else {
        toast({
          title: "Error",
          description: "No se pudo corregir el estado del negocio",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing business:', error);
      toast({
        title: "Error",
        description: "No se pudo corregir el estado del negocio",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  const handleDiagnoseBusiness = async () => {
    setDiagnosing(true);
    try {
      const diagnostics = {
        businessId: negocio.id,
        businessNumber: negocio.numero,
        currentState: negocio.estado,
        expectedState: stateAnalysis.expectedState,
        stateMatches: stateAnalysis.stateMatches,
        hasInconsistency: stateAnalysis.hasInconsistency,
        reason: stateAnalysis.analysis.reason,
        totalBudgets: budgetInfo.totalPresupuestos,
        approvedBudgets: budgetInfo.presupuestosAprobados,
        sentBudgets: budgetInfo.presupuestosEnviados,
        rejectedBudgets: budgetInfo.presupuestosRechazados,
        expiredBudgets: budgetInfo.presupuestosVencidos,
        invoicedBudgets: budgetInfo.presupuestosFacturados,
        draftBudgets: budgetInfo.presupuestosBorrador,
        totalValue: totalValue,
        confidence: stateAnalysis.hasInconsistency ? 'high' : 'none'
      };

      console.log('[BusinessStatusCard] Diagnostic results:', diagnostics);
      setDiagnosticInfo(diagnostics);

      if (diagnostics.hasInconsistency) {
        toast({
          title: "Inconsistencia detectada",
          description: `Estado actual: ${diagnostics.currentState}, esperado: ${diagnostics.expectedState}`,
          variant: "destructive"
        });
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

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-slate-800">
              Estado del Negocio
            </CardTitle>
            {stateAnalysis.hasInconsistency && (
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
            {stateAnalysis.hasInconsistency && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleFixThisBusiness}
                disabled={isFixing}
                className="h-8 px-3"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isFixing ? 'animate-spin' : ''}`} />
                Corregir
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunComprehensiveAudit}
              className="h-8 px-3"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Auditoría
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

          {/* State analysis info */}
          {stateAnalysis.hasInconsistency && (
            <div className="text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-medium mb-2 text-amber-800">⚠️ Inconsistencia Detectada:</p>
              <div className="space-y-1 text-amber-700">
                <div>Estado Actual: <strong>{stateAnalysis.currentState}</strong></div>
                <div>Estado Esperado: <strong>{stateAnalysis.expectedState}</strong></div>
                <div>Razón: {stateAnalysis.analysis.reason}</div>
              </div>
            </div>
          )}

          {diagnosticInfo && (
            <div className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-medium mb-2 text-blue-800">📊 Información de Diagnóstico:</p>
              <div className="grid grid-cols-2 gap-2 text-blue-700">
                <div>Total Presupuestos: {diagnosticInfo.totalBudgets}</div>
                <div>Aprobados: {diagnosticInfo.approvedBudgets}</div>
                <div>Enviados: {diagnosticInfo.sentBudgets}</div>
                <div>Rechazados: {diagnosticInfo.rejectedBudgets}</div>
                <div>Valor Total: ${diagnosticInfo.totalValue?.toLocaleString('es-CL')}</div>
                <div>Facturados: {diagnosticInfo.invoicedBudgets}</div>
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
