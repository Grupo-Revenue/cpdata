import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNegocio } from '@/context/NegocioContext';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';
import { useHubSpotCompanyValidation } from '@/hooks/useHubSpotCompanyValidation';
import { useHubSpotDealCreation } from '@/hooks/useHubSpotDealCreation';
import { toast } from '@/hooks/use-toast';
import { processContactForBusiness } from '@/services/contactService';
import { createBusinessFromWizard } from '@/services/wizardBusinessService';
import { WizardProgress } from './WizardProgress';
import { ContactInfoStep } from './ContactInfoStep';
import { CompanyInfoStep } from './CompanyInfoStep';
import { EventInfoStep } from './EventInfoStep';
import { WizardState, WizardProps } from './types';

const WizardCrearNegocio: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const { crearNegocio } = useNegocio();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const {
    searchContactInHubSpot,
    createContactInHubSpot,
    updateContactInHubSpot
  } = useHubSpotContactValidation();

  const {
    searchCompanyInHubSpot,
    createCompanyInHubSpot,
    updateCompanyInHubSpot
  } = useHubSpotCompanyValidation();

  const {
    generateUniqueCorrelative,
    createDealInHubSpot
  } = useHubSpotDealCreation();

  const [wizardState, setWizardState] = useState<WizardState>({
    paso: 1,
    contacto: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '+56',
      cargo: ''
    },
    tipoCliente: 'cliente_final',
    productora: {
      nombre: '',
      rut: '',
      sitio_web: '',
      direccion: ''
    },
    tieneClienteFinal: false,
    clienteFinal: {
      nombre: '',
      rut: '',
      sitio_web: '',
      direccion: ''
    },
    evento: {
      tipo_evento: '',
      nombre_evento: '',
      fecha_evento: '',
      fecha_evento_fin: '',
      horario_inicio: '',
      horario_fin: '',
      cantidad_asistentes: '',
      cantidad_invitados: '',
      locacion: ''
    },
    fechaCierre: ''
  });

  const handleContactNext = async () => {
    try {
      setIsProcessing(true);
      
      // Process contact synchronization
      const contactResult = await processContactForBusiness(wizardState.contacto, {
        searchContactInHubSpot,
        createContactInHubSpot,
        updateContactInHubSpot
      });
      
      if (!contactResult.success) {
        throw new Error(`Error procesando contacto: ${contactResult.error}`);
      }

      // Contact processed successfully - no toast needed here as final result will be shown

      // Proceed to next step
      setWizardState(prev => ({ ...prev, paso: 2 }));

    } catch (error) {
      console.error('Error synchronizing contact:', error);
      toast({
        title: "Error",
        description: `No se pudo sincronizar el contacto: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    try {
      setIsCreating(true);
      
      const negocioId = await createBusinessFromWizard({
        wizardState,
        hubspotOperations: {
          searchContactInHubSpot,
          createContactInHubSpot,
          updateContactInHubSpot,
          searchCompanyInHubSpot,
          createCompanyInHubSpot,
          updateCompanyInHubSpot
        },
        crearNegocio,
        hubspotDealOperations: {
          generateUniqueCorrelative,
          createDealInHubSpot
        }
      });

      onComplete(negocioId);
    } catch (error) {
      console.error('Error creating business:', error);
      toast({
        title: "Error",
        description: `No se pudo crear el negocio: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateWizardState = <K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setWizardState(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    setWizardState(prev => ({ ...prev, paso: prev.paso + 1 }));
  };

  const previousStep = () => {
    setWizardState(prev => ({ ...prev, paso: prev.paso - 1 }));
  };

  const getStepTitle = () => {
    switch (wizardState.paso) {
      case 1: return 'Información de Contacto';
      case 2: return 'Información de Empresa';
      case 3: return 'Información del Evento';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <WizardProgress currentStep={wizardState.paso} totalSteps={3} />

      <Card>
        <CardHeader>
          <CardTitle>{getStepTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {wizardState.paso === 1 && (
            <ContactInfoStep
              contacto={wizardState.contacto}
              setContacto={(contacto) => updateWizardState('contacto', contacto)}
              onNext={handleContactNext}
              isProcessing={isProcessing}
            />
          )}

          {wizardState.paso === 2 && (
            <CompanyInfoStep
              tipoCliente={wizardState.tipoCliente}
              setTipoCliente={(tipo) => updateWizardState('tipoCliente', tipo)}
              productora={wizardState.productora}
              setProductora={(productora) => updateWizardState('productora', productora)}
              tieneClienteFinal={wizardState.tieneClienteFinal}
              setTieneClienteFinal={(tiene) => updateWizardState('tieneClienteFinal', tiene)}
              clienteFinal={wizardState.clienteFinal}
              setClienteFinal={(cliente) => updateWizardState('clienteFinal', cliente)}
              onPrevious={previousStep}
              onNext={nextStep}
            />
          )}

          {wizardState.paso === 3 && (
            <EventInfoStep
              evento={wizardState.evento}
              setEvento={(evento) => updateWizardState('evento', evento)}
              fechaCierre={wizardState.fechaCierre}
              setFechaCierre={(fecha) => updateWizardState('fechaCierre', fecha)}
              isCreating={isCreating}
              onPrevious={previousStep}
              onFinish={handleFinish}
            />
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default WizardCrearNegocio;