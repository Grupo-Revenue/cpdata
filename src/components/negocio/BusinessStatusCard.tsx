
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';
import { Negocio } from '@/types';
import BusinessStateBadge from '@/components/business/BusinessStateBadge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BusinessStatusCardProps {
  negocio: Negocio;
  onRefresh: () => void;
}

const BusinessStatusCard: React.FC<BusinessStatusCardProps> = ({ negocio, onRefresh }) => {
  const { toast } = useToast();
  const [recalculating, setRecalculating] = React.useState(false);

  const handleRecalculateStates = async () => {
    setRecalculating(true);
    try {
      const { data, error } = await supabase.rpc('recalcular_todos_estados_negocios');
      
      if (error) {
        console.error('Error recalculating business states:', error);
        throw error;
      }

      toast({
        title: "Estados recalculados",
        description: `Se actualizaron ${data || 0} negocios correctamente`
      });
      
      onRefresh();
    } catch (error) {
      console.error('Error recalculating states:', error);
      toast({
        title: "Error",
        description: "No se pudieron recalcular los estados",
        variant: "destructive"
      });
    } finally {
      setRecalculating(false);
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
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateStates}
            disabled={recalculating}
            className="h-8 px-3"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${recalculating ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
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
