
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useHubSpotSync } from '@/hooks/useHubSpotSync';
import { Negocio } from '@/types';

interface SimpleHubSpotSyncProps {
  negocio: Negocio;
}

const SimpleHubSpotSync: React.FC<SimpleHubSpotSyncProps> = ({ negocio }) => {
  const { manualSyncNegocio, isSyncing } = useHubSpotSync();

  const handleSync = () => {
    manualSyncNegocio(negocio.id);
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing(negocio.id)}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing(negocio.id) ? 'animate-spin' : ''}`} />
      {isSyncing(negocio.id) ? 'Sincronizando...' : 'Sincronizar HubSpot'}
    </Button>
  );
};

export default SimpleHubSpotSync;
