
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface SyncResult {
  success: boolean;
  direction: 'to_hubspot' | 'from_hubspot';
  timestamp: Date;
  forced?: boolean;
  error?: string;
}

interface SyncResultAlertProps {
  result: SyncResult;
}

const SyncResultAlert: React.FC<SyncResultAlertProps> = ({ result }) => {
  return (
    <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
      <div className="flex items-center space-x-2">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
        <div className="flex-1">
          <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.success ? (
              <span>
                Sincronización {result.direction === 'to_hubspot' ? 'a HubSpot' : 'desde HubSpot'} exitosa
                {result.forced && ' (forzada)'}
              </span>
            ) : (
              <span>Error en sincronización: {result.error}</span>
            )}
          </AlertDescription>
          <div className="text-xs text-gray-500 mt-1">
            {result.timestamp.toLocaleString()}
          </div>
        </div>
      </div>
    </Alert>
  );
};

export default SyncResultAlert;
