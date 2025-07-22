import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { processContactForBusiness } from '@/services/contactService';
import { processCompanyForBusiness } from '@/services/empresaService';
import { processDealForBusiness } from '@/services/negocioCreationService';
import { useNegocio } from '@/context/NegocioContext';
import { WizardState } from '@/components/wizard/types';
import { useHubSpotDealCreation } from '@/hooks/useHubSpotDealCreation';
import { useHubSpotAmountSync } from '@/hooks/hubspot/useHubSpotAmountSync';

// Helper function removed - now using the robust service
// The processCompanyForBusiness function is now in empresaService.ts

interface BusinessCreationParams {
  wizardState: WizardState;
  hubspotOperations: {
    searchContactInHubSpot: (email: string) => Promise<any>;
    createContactInHubSpot: (contactData: any) => Promise<any>;
    updateContactInHubSpot: (contactData: any) => Promise<any>;
    searchCompanyInHubSpot: (companyName: string) => Promise<any>;
    createCompanyInHubSpot: (companyData: any) => Promise<any>;
    updateCompanyInHubSpot: (companyData: any) => Promise<any>;
  };
  crearNegocio: ReturnType<typeof useNegocio>['crearNegocio'];
  hubspotDealOperations: {
    generateUniqueCorrelative: () => Promise<any>;
    createDealInHubSpot: (dealData: any) => Promise<any>;
  };
}

export const createBusinessFromWizard = async ({
  wizardState,
  hubspotOperations,
  crearNegocio,
  hubspotDealOperations
}: BusinessCreationParams): Promise<string> => {
  try {
    const { contacto, tipoCliente, productora, tieneClienteFinal, clienteFinal, evento, fechaCierre } = wizardState;

  console.log('Starting business creation process...');
  
  // Step 1: Process contact with robust logic
  console.log('Processing contact:', contacto.email);
  const contactResult = await processContactForBusiness(contacto, hubspotOperations);
  
  if (!contactResult.success) {
    throw new Error(`Error procesando contacto: ${contactResult.error}`);
  }

  console.log('Contact processed successfully:', {
    contactId: contactResult.contactId,
    wasCreated: contactResult.wasCreated,
    wasUpdated: contactResult.wasUpdated
  });

  // Contact processed successfully - consolidated notification will be shown at the end

  // Step 2: Handle productora - find or create with HubSpot sync
  let productoraId = null;
  if (tipoCliente === 'productora' && productora.nombre) {
    console.log('[WizardService] Processing productora:', productora.nombre);
    
    const productoraResult = await processCompanyForBusiness(
      {
        ...productora,
        tipo: 'productora'
      },
      hubspotOperations
    );

    if (!productoraResult.success) {
      console.warn('[WizardService] Failed to process productora:', productoraResult.error);
      // Continue without failing the whole process
    }

    productoraId = productoraResult.empresaId;
    console.log('[WizardService] Productora processed:', {
      empresaId: productoraId,
      hubspotId: productoraResult.hubspotId,
      wasCreated: productoraResult.wasCreated,
      wasUpdated: productoraResult.wasUpdated
    });
  }

  // Step 3: Handle cliente final - find or create with HubSpot sync
  let clienteFinalId = null;
  if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre) {
    console.log('[WizardService] Processing cliente final:', clienteFinal.nombre);
    
    const clienteFinalResult = await processCompanyForBusiness(
      {
        ...clienteFinal,
        tipo: 'cliente_final'
      },
      hubspotOperations
    );

    if (!clienteFinalResult.success) {
      console.warn('[WizardService] Failed to process cliente final:', clienteFinalResult.error);
      // Continue without failing the whole process
    }

    clienteFinalId = clienteFinalResult.empresaId;
    console.log('[WizardService] Cliente final processed:', {
      empresaId: clienteFinalId,
      hubspotId: clienteFinalResult.hubspotId,
      wasCreated: clienteFinalResult.wasCreated,
      wasUpdated: clienteFinalResult.wasUpdated
    });
  }

  // Step 4: The number will be generated atomically by the database function
  console.log('[WizardService] Number will be assigned atomically during business creation...');

  // Step 5: Create the business in local database first
  const negocioData = {
    contactoId: contactResult.contactId,
    productora: tipoCliente === 'productora' && productoraId ? {
      id: productoraId,
      ...productora,
      tipo: 'productora' as const
    } : undefined,
    clienteFinal: ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinalId) ? {
      id: clienteFinalId,
      ...clienteFinal,
      tipo: 'cliente_final' as const
    } : undefined,
    tipo_evento: evento.tipo_evento,
    nombre_evento: evento.nombre_evento,
    fecha_evento: evento.fecha_evento,
    horas_acreditacion: evento.horario_inicio && evento.horario_fin 
      ? `${evento.horario_inicio} - ${evento.horario_fin}` 
      : '00:00 - 00:00',
    cantidad_asistentes: parseInt(evento.cantidad_asistentes) || 0,
    cantidad_invitados: parseInt(evento.cantidad_invitados) || 0,
    locacion: evento.locacion,
    fecha_cierre: fechaCierre || undefined
    // Number will be assigned atomically by the database function
  };

  console.log('[WizardService] Creating business with data:', negocioData);
  
  const negocioCreado = await crearNegocio(negocioData);
  
  if (!negocioCreado) {
    throw new Error('No se pudo crear el negocio');
  }

  // Step 6: Create deal in HubSpot with all associations using robust service
  console.log('[WizardService] Creating deal in HubSpot...');
  try {
    // Get HubSpot IDs for contact and companies from local database
    const contactHubSpotId = contactResult.hubspotId;
    let productoraHubSpotId = null;
    let clienteFinalHubSpotId = null;

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Get productora HubSpot ID from local database if exists
    if (tipoCliente === 'productora' && productora.nombre && productoraId) {
      const { data: productoraData, error: productoraError } = await supabase
        .from('empresas')
        .select('hubspot_id')
        .eq('id', productoraId)
        .single();
      
      if (!productoraError && productoraData?.hubspot_id) {
        productoraHubSpotId = productoraData.hubspot_id;
        console.log('[WizardService] Found productora HubSpot ID from database:', productoraHubSpotId);
      }
    }

    // Get cliente final HubSpot ID from local database if exists
    if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre && clienteFinalId) {
      const { data: clienteFinalData, error: clienteFinalError } = await supabase
        .from('empresas')
        .select('hubspot_id')
        .eq('id', clienteFinalId)
        .single();
      
      if (!clienteFinalError && clienteFinalData?.hubspot_id) {
        clienteFinalHubSpotId = clienteFinalData.hubspot_id;
        console.log('[WizardService] Found cliente final HubSpot ID from database:', clienteFinalHubSpotId);
      }
    }

    // Prepare deal data for HubSpot
    const hubspotDealData = {
      nombre_correlativo: `#${negocioCreado.numero}`,
      tipo_evento: evento.tipo_evento,
      nombre_evento: evento.nombre_evento,
      valor_negocio: 0, // Default value, can be updated later
      fecha_evento: evento.fecha_evento,
      fecha_evento_fin: evento.fecha_evento_fin,
      horario_inicio: evento.horario_inicio,
      horario_fin: evento.horario_fin,
      fecha_cierre: fechaCierre,
      locacion: evento.locacion,
      cantidad_invitados: parseInt(evento.cantidad_invitados) || 0,
      cantidad_asistentes: parseInt(evento.cantidad_asistentes) || 0,
      contactId: contactHubSpotId,
      productoraId: productoraHubSpotId,
      clienteFinalId: clienteFinalHubSpotId
    };

    // Use the robust deal processing service
    const dealResult = await processDealForBusiness(
      hubspotDealData,
      hubspotDealOperations,
      negocioCreado.id
    );
    
    if (dealResult.success) {
      console.log('[WizardService] Deal processing completed:', {
        hubspotId: dealResult.hubspotId,
        wasCreated: dealResult.wasCreated,
        wasUpdated: dealResult.wasUpdated
      });
    } else {
      console.warn('[WizardService] Deal processing failed:', dealResult.error);
      // Continue - business was already created successfully
    }
  } catch (error) {
    console.error('[WizardService] Error in deal processing:', error);
    // Business was already created successfully, just log the HubSpot sync issue
  }

  // Step 7: Show single success message at the end
  console.log('[WizardService] Business creation process completed successfully');
  toast({
    title: "Negocio creado exitosamente",
    description: `El negocio #${negocioCreado.numero} ha sido creado correctamente.`,
  });

  return negocioCreado.id;
  } catch (error) {
    console.error('Error creating business:', error);
    toast({
      title: "Error al crear negocio",
      description: "No se pudo crear el negocio. Por favor, intenta nuevamente.",
      variant: "destructive"
    });
    throw error;
  }
};