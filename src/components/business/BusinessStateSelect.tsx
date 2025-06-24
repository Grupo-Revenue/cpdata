
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import { useHubSpotSync } from '@/hooks/useHubSpotSync';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { Negocio } from '@/types';
import BusinessStateBadge from './BusinessStateBadge';

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
          await manualSyncNegocio(negocio.id);
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
        return <Clock className="w-3 h-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-600" />;
      default:
        return null;
    }
  };

  const triggerHeight = size === 'sm' ? 'h-8' : 'h-10';
  const triggerPadding = size === 'sm' ? 'px-2' : 'px-3';

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={negocio.estado}
        onValueChange={handleStateChange}
        disabled={disabled || syncStatus === 'syncing'}
      >
        <SelectTrigger 
          className={`${triggerHeight} ${triggerPadding} min-w-fit border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all duration-200`}
        >
          <SelectValue asChild>
            <div className="flex items-center justify-between w-full">
              <BusinessStateBadge 
                estado={negocio.estado} 
                size={size}
                showIcon={true}
              />
              <ChevronDown className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
            </div>
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent 
          className="min-w-[240px] bg-white border-slate-200 shadow-lg rounded-lg p-1"
          align="start"
        >
          <div className="p-2 border-b border-slate-100 mb-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Cambiar Estado
            </p>
          </div>
          
          {MAIN_BUSINESS_STATES.map((estado) => (
            <SelectItem 
              key={estado} 
              value={estado}
              className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-md p-2 transition-colors duration-150"
            >
              <div className="flex items-center justify-between w-full">
                <BusinessStateBadge 
                  estado={estado} 
                  size="sm"
                  showIcon={true}
                />
                {estado === negocio.estado && (
                  <CheckCircle className="w-4 h-4 text-blue-500 ml-2" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Sync status indicator */}
      {syncStatus !== 'idle' && (
        <div 
          className="flex items-center p-1 rounded-full bg-slate-50 border border-slate-200"
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
