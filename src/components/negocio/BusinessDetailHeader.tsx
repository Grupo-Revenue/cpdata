
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Calendar, 
  MapPin, 
  Users, 
  Phone,
  Mail,
  Pencil,
  Clock
} from 'lucide-react';
import { Negocio } from '@/types';
import { formatearFechaSinZonaHoraria } from '@/utils/formatters';
import { calculateBusinessValue } from '@/utils/businessValueCalculator';
import { formatBusinessStateForDisplay, getBusinessStateColors } from '@/utils/businessCalculations';
import BusinessValueSection from './sections/BusinessValueSection';
import { EditContactDialog } from './dialogs/EditContactDialog';
import { EditCompanyDialog } from './dialogs/EditCompanyDialog';
import { EditEventDialog } from './dialogs/EditEventDialog';
import { useBusinessUpdate } from '@/hooks/useBusinessUpdate';
import { useNegocio } from '@/context/NegocioContext';

interface BusinessDetailHeaderProps {
  negocio: Negocio;
  onVolver: () => void;
  onCrearPresupuesto: () => void;
}

const BusinessDetailHeader: React.FC<BusinessDetailHeaderProps> = ({
  negocio,
  onVolver,
  onCrearPresupuesto
}) => {
  const navigate = useNavigate();
  const { refreshNegocios } = useNegocio();
  const { updateContact, updateCompanies, updateEvent } = useBusinessUpdate();
  
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const valorTotal = calculateBusinessValue(negocio);

  const handleSaveContact = async (contactData: any) => {
    await updateContact(negocio.id, contactData);
    await refreshNegocios();
  };

  const handleSaveCompanies = async (productoraData?: any, clienteFinalData?: any) => {
    await updateCompanies(negocio.id, productoraData, clienteFinalData);
    await refreshNegocios();
  };

  const handleSaveEvent = async (eventData: any) => {
    await updateEvent(negocio.id, eventData);
    await refreshNegocios();
  };
  
  // Get company name for the title
  const empresaDisplay = negocio.productora?.nombre || negocio.clienteFinal?.nombre || 'Sin empresa';

  return (
    <div className="space-y-6 mb-6">
      {/* Back Button Above Title */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onVolver();
            navigate("/");
          }}
          className="h-8 px-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Title Section */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {empresaDisplay} - Negocio #{negocio.numero}
            </h1>
            <Badge 
              variant="outline"
              className={getBusinessStateColors(negocio.estado)}
            >
              {formatBusinessStateForDisplay(negocio.estado)}
            </Badge>
          </div>
          <p className="text-lg text-slate-600">{negocio.evento.nombreEvento}</p>
        </div>

        {/* Business Value Section */}
        <div className="lg:w-80">
          <BusinessValueSection 
            valorNegocio={valorTotal}
            presupuestos={negocio.presupuestos}
          />
        </div>
      </div>

      {/* Key Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contact Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditContactOpen(true)}
              className="absolute top-2 right-2 h-7 w-7 hover:bg-slate-100"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Contacto</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{negocio.contacto.nombre} {negocio.contacto.apellido}</p>
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">{negocio.contacto.telefono}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{negocio.contacto.email}</span>
              </div>
              {negocio.contacto.cargo && (
                <p className="text-xs text-slate-500">{negocio.contacto.cargo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditCompanyOpen(true)}
              className="absolute top-2 right-2 h-7 w-7 hover:bg-slate-100"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Empresa</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{empresaDisplay}</p>
              {negocio.productora && negocio.clienteFinal && (
                <>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium">Productora:</span> {negocio.productora.nombre}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium">Cliente Final:</span> {negocio.clienteFinal.nombre}
                  </div>
                </>
              )}
              {negocio.productora && !negocio.clienteFinal && (
                <div className="text-xs text-slate-500">Productora</div>
              )}
              {!negocio.productora && negocio.clienteFinal && (
                <div className="text-xs text-slate-500">Cliente Directo</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Info */}
        <Card className="border-slate-200">
          <CardContent className="p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditEventOpen(true)}
              className="absolute top-2 right-2 h-7 w-7 hover:bg-slate-100"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
            </Button>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Evento</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-slate-800 font-medium">{negocio.evento.tipoEvento}</p>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">
                  <span className="font-medium">Fecha Evento:</span>{' '}
                  {negocio.evento.fechaEvento 
                    ? formatearFechaSinZonaHoraria(negocio.evento.fechaEvento)
                    : 'Por definir'}
                </span>
              </div>
              {negocio.evento.horasAcreditacion && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-600">{negocio.evento.horasAcreditacion}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600 truncate">{negocio.evento.locacion}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-600">{negocio.evento.cantidadAsistentes.toLocaleString()} asistentes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialogs */}
      <EditContactDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        contacto={negocio.contacto}
        onSave={handleSaveContact}
      />

      <EditCompanyDialog
        open={editCompanyOpen}
        onOpenChange={setEditCompanyOpen}
        productora={negocio.productora || undefined}
        clienteFinal={negocio.clienteFinal || undefined}
        onSave={handleSaveCompanies}
      />

      <EditEventDialog
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
        negocio={negocio}
        onSave={handleSaveEvent}
      />
    </div>
  );
};

export default BusinessDetailHeader;
