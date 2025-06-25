
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  Download,
  Zap
} from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { Negocio } from '@/types';

interface ManualSyncInterfaceProps {
  negocio: Negocio;
}

const ManualSyncInterface: React.FC<ManualSyncInterfaceProps> = ({ negocio }) => {
  const { config } = useHubSpotConfig();
  const { syncToHubSpot, syncFromHubSpot, loading } = useEnhancedBidirectionalSync();
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const calculateBusinessValue = () => {
    if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
      return 0;
    }

    // Sum all approved budgets
    const approvedTotal = negocio.presupuestos
      .filter(p => p.estado === 'aprobado')
      .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);

    // If no approved budgets, use sent budgets
    if (approvedTotal === 0) {
      return negocio.presupuestos
        .filter(p => p.estado === 'enviado')
        .reduce((sum, p) => sum + parseFloat(String(p.total || '0')), 0);
    }

    return approvedTotal;
  };

  const handleSyncToHubSpot = async (forceAmount: boolean = false) => {
    console.log(`[ManualSyncInterface] Syncing business ${negocio.numero} to HubSpot, forceAmount: ${forceAmount}`);
    
    try {
      await syncToHubSpot(negocio.id, forceAmount);
      setLastSyncResult({
        success: true,
        direction: 'to_hubspot',
        timestamp: new Date(),
        forced: forceAmount
      });
    } catch (error) {
      console.error('[ManualSyncInterface] Error syncing to HubSpot:', error);
      setLastSyncResult({
        success: false,
        direction: 'to_hubspot',
        timestamp: new Date(),
        error: error.message
      });
    }
  };

  const handleSyncFromHubSpot = async () => {
    console.log(`[ManualSyncInterface] Syncing business ${negocio.numero} from HubSpot`);
    
    try {
      await syncFromHubSpot(negocio.id);
      setLastSyncResult({
        success: true,
        direction: 'from_hubspot',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[ManualSyncInterface] Error syncing from HubSpot:', error);
      setLastSyncResult({
        success: false,
        direction: 'from_hubspot',
        timestamp: new Date(),
        error: error.message
      });
    }
  };

  if (!config?.api_key_set) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Configure HubSpot en la configuración antes de usar la sincronización manual.
        </AlertDescription>
      </Alert>
    );
  }

  const businessValue = calculateBusinessValue();

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span>Sincronización Manual HubSpot</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Business Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
          <div>
            <div className="text-sm font-medium text-gray-700">Estado Actual</div>
            <Badge variant="outline" className="mt-1">
              {negocio.estado}
            </Badge>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Valor Calculado</div>
            <div className="text-lg font-bold text-green-600">
              ${businessValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">Presupuestos</div>
            <div className="text-sm text-gray-600">
              {negocio.presupuestos?.length || 0} total
            </div>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleSyncToHubSpot(false)}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Sincronizar a HubSpot</span>
            </Button>
            
            <Button
              onClick={() => handleSyncToHubSpot(true)}
              disabled={loading}
              variant="outline"
              className="flex-1 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Forzar Sincronización</span>
            </Button>
          </div>

          <Button
            onClick={handleSyncFromHubSpot}
            disabled={loading}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Sincronizar desde HubSpot</span>
          </Button>
        </div>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <Alert className={lastSyncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-center space-x-2">
              {lastSyncResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <div className="flex-1">
                <AlertDescription className={lastSyncResult.success ? 'text-green-800' : 'text-red-800'}>
                  {lastSyncResult.success ? (
                    <span>
                      Sincronización {lastSyncResult.direction === 'to_hubspot' ? 'a HubSpot' : 'desde HubSpot'} exitosa
                      {lastSyncResult.forced && ' (forzada)'}
                    </span>
                  ) : (
                    <span>Error en sincronización: {lastSyncResult.error}</span>
                  )}
                </AlertDescription>
                <div className="text-xs text-gray-500 mt-1">
                  {lastSyncResult.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Sincronizar a HubSpot:</strong> Envía los datos actuales de la app a HubSpot</p>
          <p><strong>Forzar Sincronización:</strong> Fuerza la actualización incluso si no hay cambios detectados</p>
          <p><strong>Sincronizar desde HubSpot:</strong> Obtiene los datos más recientes desde HubSpot</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualSyncInterface;
