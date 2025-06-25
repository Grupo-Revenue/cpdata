
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Check } from 'lucide-react';
import { useHubSpotSync } from '@/hooks/useHubSpotSync';
import { useSync } from '@/context/SyncContext';
import { Negocio } from '@/types';

interface HubSpotSyncButtonProps {
  negocio: Negocio;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
}

const HubSpotSyncButton: React.FC<HubSpotSyncButtonProps> = ({ 
  negocio, 
  variant = 'outline', 
  size = 'sm',
  showText = true 
}) => {
  const { isSyncing, isBusinessSynced } = useHubSpotSync();
  const { triggerSync } = useSync();

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await triggerSync(negocio.id, 'manual_sync', 1);
    } catch (error) {
      console.error('Error triggering sync:', error);
    }
  };

  const syncing = isSyncing(negocio.id);
  const synced = isBusinessSynced(negocio);

  if (synced) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className="text-green-600 border-green-300 bg-green-50 hover:bg-green-50"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        {showText && <span className="ml-2">Sincronizado</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSync}
      disabled={syncing}
      className="hover:bg-blue-50 hover:border-blue-300"
    >
      {syncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Upload className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {syncing ? 'Sincronizando...' : 'Sync HubSpot'}
        </span>
      )}
    </Button>
  );
};

export default HubSpotSyncButton;
