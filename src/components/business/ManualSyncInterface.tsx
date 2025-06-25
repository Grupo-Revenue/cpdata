
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Zap } from 'lucide-react';
import { useEnhancedBidirectionalSync } from '@/hooks/useEnhancedBidirectionalSync';
import { useHubSpotConfig } from '@/hooks/useHubSpotConfig';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';
import { Negocio } from '@/types';
import BusinessInfoPanel from './sync/BusinessInfoPanel';
import SyncActions from './sync/SyncActions';
import SyncResultAlert from './sync/SyncResultAlert';
import SyncInstructions from './sync/SyncInstructions';

interface ManualSyncInterfaceProps {
  negocio: Negocio;
}

interface SyncResult {
  success: boolean;
  direction: 'to_hubspot' | 'from_hubspot';
  timestamp: Date;
  forced?: boolean;
  error?: string;
}

const ManualSyncInterface: React.FC<ManualSyncInterfaceProps> = ({ negocio }) => {
  const { config } = useHubSpotConfig();
  const { syncToHubSpot, syncFromHubSpot, loading } = useEnhancedBidirectionalSync();
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

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

  const businessValue = calculateBusinessValue(negocio);

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span>Sincronización Manual HubSpot</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <BusinessInfoPanel negocio={negocio} businessValue={businessValue} />
        
        <SyncActions
          loading={loading}
          onSyncToHubSpot={handleSyncToHubSpot}
          onSyncFromHubSpot={handleSyncFromHubSpot}
        />

        {lastSyncResult && (
          <SyncResultAlert result={lastSyncResult} />
        )}

        <SyncInstructions />
      </CardContent>
    </Card>
  );
};

export default ManualSyncInterface;
