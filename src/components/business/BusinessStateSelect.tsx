import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { obtenerEstadoNegocioInfo, formatBusinessStateForDisplay } from '@/utils/businessCalculations';
import { useHubSpotSync } from '@/hooks/useHubSpotSync';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { Negocio } from '@/types';

interface BusinessStateSelectProps {
  negocio: Negocio;
  onStateChange: (negocioId: string, nuevoEstado: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

const MAIN_BUSINESS_STATES: Negocio['estado'][] = [
  'oportunidad_creada',
  'presupuesto_enviado',
  'parcialmente_aceptado',
  'negocio_aceptado',
  'negocio_cerrado',
  'negocio_perdido'
];

const BusinessStateSelect: React.FC<BusinessStateSelectProps> = ({
  negocio,
  onStateChange,
  disabled = false,
  size = 'default'
}) => {
  const { colorEstado } = obtenerEstadoNegocioInfo(negocio);
  const { manualSyncNegocio } = useHubSpotSync();
  const { syncToHubSpot } = useBidirectionalSync();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const handleStateChange = async (nuevoEstado: string) => {
    try {
      // Update local state first
      onStateChange(negocio.id, nuevoEstado);
      
      // Then sync to HubSpot
      setSyncStatus('syncing');
      setLastSyncError(null);
      
      try {
        // Try bidirectional sync first (more comprehensive)
        const bidirectionalResult = await syncToHubSpot(negocio.id);
        
        if (bidirectionalResult) {
          setSyncStatus('success');
          console.log('Bidirectional sync successful for negocio:', negocio.id);
        } else {
          // Fallback to regular sync
          const valorTotal = negocio.presupuestos.reduce((sum, p) => sum + p.total, 0);
          const hubspotData = {
            id: negocio.id,
            numero: negocio.numero,
            contacto: negocio.contacto,
            evento: negocio.evento,
            valorTotal: valorTotal
          };
          
          const syncResult = await manualSyncNegocio(negocio.id);
          
          setSyncStatus('success');
          console.log('Regular sync successful for negocio:', negocio.id);
        }
        
        // Clear success status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
        
      } catch (syncError) {
        console.error('HubSpot sync failed:', syncError);
        setSyncStatus('error');
        setLastSyncError(syncError instanceof Error ? syncError.message : 'Sync failed');
        
        // Clear error status after 5 seconds
        setTimeout(() => {
          setSyncStatus('idle');
          setLastSyncError(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error changing business state:', error);
      setSyncStatus('error');
      setLastSyncError('Failed to update business state');
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Clock className="w-3 h-3 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={negocio.estado}
        onValueChange={handleStateChange}
        disabled={disabled || syncStatus === 'syncing'}
      >
        <SelectTrigger className={size === 'sm' ? 'h-8 text-xs' : 'h-10'}>
          <SelectValue asChild>
            <Badge className={`${colorEstado} border`}>
              {formatBusinessStateForDisplay(negocio.estado)}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MAIN_BUSINESS_STATES.map((estado) => {
            const mockNegocio: Negocio = { ...negocio, estado: estado };
            const { colorEstado: itemColor } = obtenerEstadoNegocioInfo(mockNegocio);
            return (
              <SelectItem key={estado} value={estado}>
                <Badge className={`${itemColor} border`}>
                  {formatBusinessStateForDisplay(estado)}
                </Badge>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {/* Sync status indicator */}
      {syncStatus !== 'idle' && (
        <div 
          className="flex items-center"
          title={syncStatus === 'error' ? lastSyncError || 'Sync failed' : 
                 syncStatus === 'syncing' ? 'Syncing with HubSpot...' : 
                 'Synced successfully'}
        >
          {getSyncIcon()}
        </div>
      )}
    </div>
  );
};

export default BusinessStateSelect;
