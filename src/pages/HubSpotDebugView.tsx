
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import HubSpotSyncDebugger from '@/components/debug/HubSpotSyncDebugger';
import { Bug } from 'lucide-react';

const HubSpotDebugView: React.FC = () => {
  const [negocioId, setNegocioId] = useState('fe26ed62-77b7-42b8-82a5-122b66f185a2'); // Default to #17679

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bug className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">HubSpot Debug Console</h1>
          <p className="text-muted-foreground">
            Herramientas de diagnóstico para sincronización con HubSpot
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={negocioId}
              onChange={(e) => setNegocioId(e.target.value)}
              placeholder="ID del negocio (UUID)"
              className="flex-1"
            />
            <Button 
              onClick={() => setNegocioId('fe26ed62-77b7-42b8-82a5-122b66f185a2')}
              variant="outline"
            >
              Negocio #17679
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            ID actual: {negocioId}
          </p>
        </CardContent>
      </Card>

      {negocioId && (
        <HubSpotSyncDebugger negocioId={negocioId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>1. Ejecutar Diagnóstico:</strong> Obtiene información detallada del negocio y cálculos de valor</p>
            <p><strong>2. Forzar Sincronización:</strong> Ejecuta manualmente la sincronización con HubSpot</p>
            <p><strong>3. Revisar Logs:</strong> Verifica los logs de sincronización recientes</p>
            <p><strong>4. Verificar Cálculos:</strong> Confirma que los valores se calculen correctamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotDebugView;
