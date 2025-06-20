
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Loader2 } from 'lucide-react';
import { Presupuesto } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresupuestosCardProps {
  presupuestos: Presupuesto[];
  onCrearPresupuesto: () => void;
  onEditarPresupuesto: (presupuestoId: string) => void;
  onEliminarPresupuesto: (presupuestoId: string) => Promise<void>;
  onVerPDF: (presupuestoId: string) => void;
}

const PresupuestosCard: React.FC<PresupuestosCardProps> = ({
  presupuestos,
  onCrearPresupuesto,
  onEditarPresupuesto,
  onEliminarPresupuesto,
  onVerPDF
}) => {
  const [eliminandoPresupuesto, setEliminandoPresupuesto] = useState<string | null>(null);

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return fecha;
    }
  };

  const obtenerBadgeEstadoPresupuesto = (estado: string) => {
    const colores = {
      borrador: 'bg-gray-100 text-gray-800',
      enviado: 'bg-blue-100 text-blue-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const handleEliminarPresupuesto = async (presupuestoId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      setEliminandoPresupuesto(presupuestoId);
      try {
        await onEliminarPresupuesto(presupuestoId);
      } catch (error) {
        console.error('Error eliminando presupuesto:', error);
      } finally {
        setEliminandoPresupuesto(null);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Presupuestos ({presupuestos.length})</CardTitle>
          <Button onClick={onCrearPresupuesto} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Crear Presupuesto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {presupuestos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No hay presupuestos para este negocio</p>
            <Button onClick={onCrearPresupuesto} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Presupuesto
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {presupuestos.map((presupuesto) => (
              <div key={presupuesto.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-lg">{presupuesto.nombre}</h3>
                      <Badge className={obtenerBadgeEstadoPresupuesto(presupuesto.estado)}>
                        {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {presupuesto.productos.length} producto{presupuesto.productos.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatearPrecio(presupuesto.total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Creado: {formatearFecha(presupuesto.fechaCreacion)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onVerPDF(presupuesto.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditarPresupuesto(presupuesto.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEliminarPresupuesto(presupuesto.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={eliminandoPresupuesto === presupuesto.id}
                    >
                      {eliminandoPresupuesto === presupuesto.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Lista de productos */}
                <div className="mt-3 pt-3 border-t">
                  <div className="space-y-1">
                    {presupuesto.productos.map((producto) => (
                      <div key={producto.id} className="flex justify-between text-sm">
                        <span>{producto.nombre} (x{producto.cantidad})</span>
                        <span className="font-medium">{formatearPrecio(producto.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PresupuestosCard;
