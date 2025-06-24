
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
  FileText, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { Negocio } from '@/types';
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
  const presupuestosAprobados = negocio.presupuestos.filter(p => p.estado === 'aprobado').length;
  const presupuestosEnviados = negocio.presupuestos.filter(p => p.estado === 'enviado').length;

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
