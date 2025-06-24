
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Calendar, 
  MapPin, 
  Users, 
  TrendingUp, 
  FileText, 
  RefreshCw,
  Plus,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { Negocio } from '@/types';
import { formatearPrecio } from '@/utils/formatters';
import { calcularValorNegocio } from '@/utils/businessCalculations';
import BusinessStateSelect from '@/components/business/BusinessStateSelect';
import BusinessSyncStatus from '@/components/business/BusinessSyncStatus';

interface BusinessDetailSidebarProps {
  negocio: Negocio;
  onVolver: () => void;
  onCrearPresupuesto: () => void;
  onCambiarEstado?: (negocioId: string, nuevoEstado: string) => void;
}

const BusinessDetailSidebar: React.FC<BusinessDetailSidebarProps> = ({
  negocio,
  onVolver,
  onCrearPresupuesto,
  onCambiarEstado
}) => {
  const valorTotal = calcularValorNegocio(negocio);
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = negocio.presupuestos.filter(p => p.estado === 'enviado').length;
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';

  const handleStateChange = (negocioId: string, nuevoEstado: string) => {
    if (onCambiarEstado) {
      onCambiarEstado(negocioId, nuevoEstado);
    }
  };

  return (
    <Sidebar className="border-l border-slate-200" side="right">
      <SidebarHeader className="p-4">
        {/* Header with Back Button and State Select */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onVolver}
            className="h-8 w-8 p-0 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <BusinessStateSelect
            negocio={negocio}
            onStateChange={handleStateChange}
            size="sm"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4">
        {/* Contact Information */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-700 mb-2">
            Contacto
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{negocio.contacto.nombre}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{negocio.contacto.telefono}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{negocio.contacto.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{empresaDisplay}</span>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Event Information */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-700 mb-2">
            Evento
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Card className="border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">
                    {negocio.evento.fechaEvento ? new Date(negocio.evento.fechaEvento).toLocaleDateString('es-CL') : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{negocio.evento.locacion}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{negocio.evento.cantidadAsistentes.toLocaleString()} asistentes</span>
                </div>
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Metrics */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-700 mb-2">
            Resumen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-xs font-medium text-blue-800">Presupuestos</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {negocio.presupuestos.length}
                  </Badge>
                </div>
              </div>

              {/* Quick Status */}
              {(presupuestosAprobados > 0 || presupuestosEnviados > 0) && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-slate-700 mb-2">Estado Presupuestos</div>
                  <div className="space-y-1 text-xs">
                    {presupuestosAprobados > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Aprobados</span>
                        <span className="font-medium text-green-700">{presupuestosAprobados}</span>
                      </div>
                    )}
                    {presupuestosEnviados > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Enviados</span>
                        <span className="font-medium text-blue-700">{presupuestosEnviados}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* HubSpot Sync Status */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-700 mb-2">
            Sincronización
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-xs font-medium text-blue-800">HubSpot</span>
                </div>
              </div>
              <BusinessSyncStatus negocio={negocio} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-700 mb-2">
            Acciones
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Button 
              onClick={onCrearPresupuesto}
              className="w-full justify-start text-sm h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default BusinessDetailSidebar;
