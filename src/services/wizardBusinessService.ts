import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { processContactForBusiness } from '@/services/contactService';
import { useNegocio } from '@/context/NegocioContext';
import { WizardState } from '@/components/wizard/types';
import { useHubSpotDealCreation } from '@/hooks/useHubSpotDealCreation';

// Helper function to process companies with HubSpot
const processCompanyForBusiness = async (
  companyData: { nombre: string; rut: string; direccion: string; sitio_web: string },
  tipoCliente: 'productora' | 'cliente_final',
  hubspotOperations: any
) => {
  console.log('Processing company:', companyData.nombre, 'Type:', tipoCliente);
  
  try {
    // Search for existing company in HubSpot
    const searchResult = await hubspotOperations.searchCompanyInHubSpot(companyData.nombre);
    
    if (searchResult?.found && searchResult.company) {
      console.log('Company found in HubSpot:', searchResult.company.hubspotId);
      
      // Update existing company if needed
      const updateResult = await hubspotOperations.updateCompanyInHubSpot({
        ...companyData,
        tipoCliente,
        hubspotId: searchResult.company.hubspotId
      });
      
      return {
        success: true,
        hubspotId: searchResult.company.hubspotId,
        wasUpdated: updateResult.success,
        wasCreated: false
      };
    } else {
      console.log('Company not found in HubSpot, creating new one');
      
      // Create new company in HubSpot
      const createResult = await hubspotOperations.createCompanyInHubSpot({
        ...companyData,
        tipoCliente
      });
      
      if (createResult.success) {
        return {
          success: true,
          hubspotId: createResult.company?.hubspotId,
          wasCreated: true,
          wasUpdated: false
        };
      } else {
        throw new Error(createResult.error || 'Failed to create company in HubSpot');
      }
    }
  } catch (error) {
    console.error('Error processing company:', error);
    return {
      success: false,
      error: error.message || 'Error processing company'
    };
  }
};

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
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Process company in HubSpot first
    const hubspotResult = await processCompanyForBusiness(
      productora,
      'productora',
      hubspotOperations
    );

    if (!hubspotResult.success) {
      console.warn('Failed to sync productora with HubSpot:', hubspotResult.error);
      // Continue without HubSpot sync
    }

    // Try to find existing productora in local database
    const { data: existingProductora, error: searchError } = await supabase
      .from('empresas')
      .select('id, hubspot_id')
      .eq('user_id', userId)
      .eq('nombre', productora.nombre)
      .eq('tipo', 'productora')
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingProductora) {
      productoraId = existingProductora.id;
      
      // Update HubSpot ID if not present and we have one from HubSpot
      if (!existingProductora.hubspot_id && hubspotResult.success && hubspotResult.hubspotId) {
        try {
          await supabase
            .from('empresas')
            .update({ hubspot_id: hubspotResult.hubspotId })
            .eq('id', productoraId);
          console.log('Updated existing productora with HubSpot ID:', hubspotResult.hubspotId);
        } catch (error) {
          console.warn('Failed to update productora with HubSpot ID:', error);
        }
      }
    } else {
      // Create new productora in local database
      const { data: newProductora, error: createError } = await supabase
        .from('empresas')
        .insert([{
          ...productora,
          tipo: 'productora',
          user_id: userId,
          hubspot_id: hubspotResult.success ? hubspotResult.hubspotId : null
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      productoraId = newProductora.id;
    }

    // Productora processed successfully - consolidated notification will be shown at the end
  }

  // Step 3: Handle cliente final - find or create with HubSpot sync
  let clienteFinalId = null;
  if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Process company in HubSpot first
    const hubspotResult = await processCompanyForBusiness(
      clienteFinal,
      'cliente_final',
      hubspotOperations
    );

    if (!hubspotResult.success) {
      console.warn('Failed to sync cliente final with HubSpot:', hubspotResult.error);
      // Continue without HubSpot sync
    }

    // Try to find existing cliente final in local database
    const { data: existingCliente, error: searchError } = await supabase
      .from('empresas')
      .select('id, hubspot_id')
      .eq('user_id', userId)
      .eq('nombre', clienteFinal.nombre)
      .eq('tipo', 'cliente_final')
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingCliente) {
      clienteFinalId = existingCliente.id;
      
      // Update HubSpot ID if not present and we have one from HubSpot
      if (!existingCliente.hubspot_id && hubspotResult.success && hubspotResult.hubspotId) {
        try {
          await supabase
            .from('empresas')
            .update({ hubspot_id: hubspotResult.hubspotId })
            .eq('id', clienteFinalId);
          console.log('Updated existing cliente final with HubSpot ID:', hubspotResult.hubspotId);
        } catch (error) {
          console.warn('Failed to update cliente final with HubSpot ID:', error);
        }
      }
    } else {
      // Create new cliente final in local database
      const { data: newCliente, error: createError } = await supabase
        .from('empresas')
        .insert([{
          ...clienteFinal,
          tipo: 'cliente_final',
          user_id: userId,
          hubspot_id: hubspotResult.success ? hubspotResult.hubspotId : null
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      clienteFinalId = newCliente.id;
    }

    // Cliente final processed successfully - consolidated notification will be shown at the end
  }

  // Step 4: Generate unique correlative for the business
  console.log('Generating unique correlative number...');
  const correlativeResult = await hubspotDealOperations.generateUniqueCorrelative();
  
  if (!correlativeResult.success) {
    throw new Error(`Error generando número correlativo: ${correlativeResult.error}`);
  }

  const numeroCorrelativo = correlativeResult.correlative; // Now comes as "#17662"
  const numeroSinFormato = parseInt(numeroCorrelativo.replace('#', '')); // Extract number for database
  console.log('Generated correlative:', numeroCorrelativo);

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
    fecha_cierre: fechaCierre || undefined,
    numero: numeroSinFormato // Add the correlative number
  };

  console.log('Creating business with data:', negocioData);
  
  const negocioCreado = await crearNegocio(negocioData);
  
  if (!negocioCreado) {
    throw new Error('No se pudo crear el negocio');
  }

  // Step 6: Create deal in HubSpot with all associations
  console.log('Creating deal in HubSpot...');
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
        console.log('Found productora HubSpot ID from database:', productoraHubSpotId);
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
        console.log('Found cliente final HubSpot ID from database:', clienteFinalHubSpotId);
      }
    }

    // Prepare deal data for HubSpot
    const hubspotDealData = {
      nombre_correlativo: numeroCorrelativo,
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

    const dealResult = await hubspotDealOperations.createDealInHubSpot(hubspotDealData);
    
    if (dealResult.success) {
      console.log('Deal created in HubSpot:', dealResult.deal?.hubspotId);
      
      // Save HubSpot deal ID to local database
      if (dealResult.deal?.hubspotId) {
        try {
          await supabase
            .from('negocios')
            .update({ hubspot_id: dealResult.deal.hubspotId })
            .eq('id', negocioCreado.id);
          console.log('Updated business with HubSpot deal ID:', dealResult.deal.hubspotId);
        } catch (error) {
          console.warn('Failed to save HubSpot deal ID to database:', error);
          // Silently log this warning - user will see final success message
        }
      }
      
      // Log success/failure but don't show additional toast
      if (dealResult.success) {
        console.log('Deal created and synced with HubSpot successfully');
      } else {
        console.error('Failed to create deal in HubSpot:', dealResult.error);
      }
    }
  } catch (error) {
    console.error('Error creating deal in HubSpot:', error);
    // Business was already created successfully, just log the HubSpot sync issue
  }

    // Show single success message at the end
    toast({
      title: "Negocio creado exitosamente",
      description: `El negocio ${numeroCorrelativo} ha sido creado correctamente.`,
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