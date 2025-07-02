
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, UsersIcon, ClockIcon, Edit3Icon, CheckIcon, XIcon } from 'lucide-react';
import { Negocio } from '@/types';
import { useNegocio } from '@/context/NegocioContext';
import { useBidirectionalSync } from '@/hooks/useBidirectionalSync';
import { toast } from '@/hooks/use-toast';

interface EventoCardProps {
  negocio: Negocio;
}

const EventoCard: React.FC<EventoCardProps> = ({ negocio }) => {
  const { actualizarNegocio } = useNegocio();
  const { syncToHubSpot } = useBidirectionalSync();
  const [editandoFechaCierre, setEditandoFechaCierre] = useState(false);
  const [fechaCierreTemp, setFechaCierreTemp] = useState(negocio.fechaCierre || '');

  const handleSaveFechaCierre = async () => {
    try {
      await actualizarNegocio(negocio.id, { fechaCierre: fechaCierreTemp });
      
      // Sync the updated close date to HubSpot
      await syncToHubSpot(negocio.id);
      
      setEditandoFechaCierre(false);
      toast({
        title: "Fecha de cierre actualizada",
        description: "La fecha de cierre se ha actualizado y sincronizado con HubSpot"
      });
    } catch (error) {
      console.error('Error updating close date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de cierre",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setFechaCierreTemp(negocio.fechaCierre || '');
    setEditandoFechaCierre(false);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Información del Evento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Badge variant="outline" className="text-xs">
                {negocio.evento.tipoEvento}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900">{negocio.evento.nombreEvento}</h3>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Fecha del Evento
            </div>
            <p className="font-medium">
              {new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-2" />
              Horario de Acreditación
            </div>
            <p className="font-medium">{negocio.evento.horasAcreditacion}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Locación
            </div>
            <p className="font-medium">{negocio.evento.locacion}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="w-4 h-4 mr-2" />
              Asistentes Esperados
            </div>
            <p className="font-medium">{negocio.evento.cantidadAsistentes.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <UsersIcon className="w-4 h-4 mr-2" />
              Invitados
            </div>
            <p className="font-medium">{negocio.evento.cantidadInvitados.toLocaleString()}</p>
          </div>
        </div>

        {/* Close Date Field */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Fecha de Cierre Esperada
            </div>
            {!editandoFechaCierre && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditandoFechaCierre(true)}
                className="h-6 w-6 p-0"
              >
                <Edit3Icon className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {editandoFechaCierre ? (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={fechaCierreTemp}
                onChange={(e) => setFechaCierreTemp(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleSaveFechaCierre}
                className="h-8 w-8 p-0"
              >
                <CheckIcon className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-8 w-8 p-0"
              >
                <XIcon className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <p className="font-medium text-gray-900">
              {negocio.fechaCierre 
                ? new Date(negocio.fechaCierre).toLocaleDateString('es-CL')
                : 'Sin fecha definida'
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventoCard;
