
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Plus } from 'lucide-react';
import { Negocio } from '@/types';
import SimpleHubSpotSync from '@/components/hubspot/SimpleHubSpotSync';

interface SimplifiedBusinessSidebarProps {
  negocio: Negocio;
  onVolver: () => void;
  onCrearPresupuesto: () => void;
}

const SimplifiedBusinessSidebar: React.FC<SimplifiedBusinessSidebarProps> = ({
  negocio,
  onVolver,
  onCrearPresupuesto
}) => {
  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
      {/* Header with back button */}
      <div className="p-4 border-b border-slate-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onVolver}
          className="h-8 w-8 p-0 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Centered content area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xs space-y-6">
          {/* Contact Information */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <User className="w-4 h-4 mr-2" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 font-medium">
                {negocio.contacto.nombre} {negocio.contacto.apellido}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={onCrearPresupuesto}
              className="w-full justify-start"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
            
            <SimpleHubSpotSync negocio={negocio} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedBusinessSidebar;
