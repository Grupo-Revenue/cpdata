
import React, { useEffect, useState } from 'react';
import { useNegocio } from '@/context/NegocioContext';
import { useBusinessStateMonitor } from '@/hooks/useBusinessStateMonitor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RefreshCw, Activity, Clock, Bug } from 'lucide-react';

const RealTimeStateValidator: React.FC = () => {
  const { negocios, loading } = useNegocio();
  const { 
    inconsistencyCount, 
    lastCheck, 
    isMonitoring, 
    autoFixEnabled,
    lastAuditResults,
    validateCurrentStates,
    runComprehensiveAudit,
    fixSpecificBusiness,
    toggleAutoFix
  } = useBusinessStateMonitor();
  
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    try {
      await runComprehensiveAudit();
      setShowDetailedResults(true);
    } catch (error) {
      console.error('Error running audit:', error);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleQuickFix = async () => {
    if (lastAuditResults?.inconsistencies?.length > 0) {
      // Fix the first few high-confidence inconsistencies
      const highConfidenceIssues = lastAuditResults.inconsistencies
        .filter(issue => issue.confidence === 'high' && issue.autoFixable)
        .slice(0, 3);
      
      for (const issue of highConfidenceIssues) {
        await fixSpecificBusiness(issue.negocioId);
      }
      
      // Re-run validation
      setTimeout(() => validateCurrentStates(), 1000);
    }
  };

  // Si no hay inconsistencias, mostrar estado OK de forma más sutil
  if (!loading && inconsistencyCount === 0) {
    return (
      <div className="mb-2">
        <div className="flex items-center space-x-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Estados de negocio validados</span>
          {lastCheck && (
            <span className="text-xs text-gray-500">
              ({lastCheck.toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>
    );
  }

  // Si hay inconsistencias, mostrar panel completo
  return (
    <div className="mb-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <strong>Inconsistencias detectadas:</strong> {inconsistencyCount} negocios con estados incorrectos.
                {lastCheck && (
                  <div className="text-xs text-gray-500 mt-1">
                    Última validación: {lastCheck.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={validateCurrentStates}
                  disabled={isMonitoring}
                  className="h-8"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isMonitoring ? 'animate-spin' : ''}`} />
                  Re-validar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRunAudit}
                  disabled={isRunningAudit}
                  className="h-8"
                >
                  <Activity className={`w-3 h-3 mr-1 ${isRunningAudit ? 'animate-spin' : ''}`} />
                  Auditoría Completa
                </Button>
              </div>
            </div>

            {/* Auto-fix toggle */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={autoFixEnabled ? "default" : "outline"}
                onClick={() => toggleAutoFix(!autoFixEnabled)}
                className="h-7 text-xs"
              >
                <Bug className="w-3 h-3 mr-1" />
                Auto-corrección: {autoFixEnabled ? 'ON' : 'OFF'}
              </Button>
              
              {lastAuditResults?.inconsistencies?.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleQuickFix}
                  className="h-7 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Corrección Rápida
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Detailed audit results */}
      {showDetailedResults && lastAuditResults && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Resultados de Auditoría</span>
              <Badge variant="outline">
                {new Date(lastAuditResults.summary.auditTimestamp).toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {lastAuditResults.summary.totalBusinesses}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {lastAuditResults.summary.inconsistentBusinesses}
                </div>
                <div className="text-xs text-gray-500">Inconsistencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {lastAuditResults.summary.fixedInThisRun}
                </div>
                <div className="text-xs text-gray-500">Corregidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {lastAuditResults.summary.highConfidenceInconsistencies}
                </div>
                <div className="text-xs text-gray-500">Alta Confianza</div>
              </div>
            </div>

            {lastAuditResults.inconsistencies?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Inconsistencias Restantes:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {lastAuditResults.inconsistencies.slice(0, 10).map((issue, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-red-50 p-2 rounded">
                      <div>
                        <span className="font-medium">#{issue.numero}</span>
                        <span className="mx-2">|</span>
                        <span>{issue.currentState} → {issue.expectedState}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge 
                          variant={issue.confidence === 'high' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {issue.confidence}
                        </Badge>
                        {issue.autoFixable && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => fixSpecificBusiness(issue.negocioId)}
                            className="h-6 px-2 text-xs"
                          >
                            Corregir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {lastAuditResults.inconsistencies.length > 10 && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      ... y {lastAuditResults.inconsistencies.length - 10} más
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetailedResults(false)}
              className="mt-3 w-full h-7 text-xs"
            >
              Ocultar Detalles
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeStateValidator;
