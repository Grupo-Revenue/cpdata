import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { processContactForBusiness } from '@/services/contactService';
import { useNegocio } from '@/context/NegocioContext';
import { WizardState } from '@/components/wizard/types';

interface BusinessCreationParams {
  wizardState: WizardState;
  hubspotOperations: {
    searchContactInHubSpot: (email: string) => Promise<any>;
    createContactInHubSpot: (contactData: any) => Promise<any>;
    updateContactInHubSpot: (contactData: any) => Promise<any>;
  };
  crearNegocio: ReturnType<typeof useNegocio>['crearNegocio'];
}

export const createBusinessFromWizard = async ({
  wizardState,
  hubspotOperations,
  crearNegocio
}: BusinessCreationParams): Promise<string> => {
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

  // Show appropriate feedback to user
  if (contactResult.wasCreated) {
    toast({
      title: "Contacto creado",
      description: "El contacto ha sido creado y sincronizado con HubSpot.",
    });
  } else if (contactResult.wasUpdated) {
    toast({
      title: "Contacto actualizado",
      description: "La información del contacto ha sido actualizada.",
    });
  }

  // Step 2: Handle productora - find or create
  let productoraId = null;
  if (tipoCliente === 'productora' && productora.nombre) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Try to find existing productora
    const { data: existingProductora, error: searchError } = await supabase
      .from('empresas')
      .select('id')
      .eq('user_id', userId)
      .eq('nombre', productora.nombre)
      .eq('tipo', 'productora')
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingProductora) {
      productoraId = existingProductora.id;
    } else {
      // Create new productora
      const { data: newProductora, error: createError } = await supabase
        .from('empresas')
        .insert([{
          ...productora,
          tipo: 'productora',
          user_id: userId
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      productoraId = newProductora.id;
    }
  }

  // Step 3: Handle cliente final - find or create
  let clienteFinalId = null;
  if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    // Try to find existing cliente final
    const { data: existingCliente, error: searchError } = await supabase
      .from('empresas')
      .select('id')
      .eq('user_id', userId)
      .eq('nombre', clienteFinal.nombre)
      .eq('tipo', 'cliente_final')
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingCliente) {
      clienteFinalId = existingCliente.id;
    } else {
      // Create new cliente final
      const { data: newCliente, error: createError } = await supabase
        .from('empresas')
        .insert([{
          ...clienteFinal,
          tipo: 'cliente_final',
          user_id: userId
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      clienteFinalId = newCliente.id;
    }
  }

  // Step 4: Create the business using the processed contact ID
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
  };

  console.log('Creating business with data:', negocioData);
  
  const negocioCreado = await crearNegocio(negocioData);
  
  if (!negocioCreado) {
    throw new Error('No se pudo crear el negocio');
  }

  toast({
    title: "Negocio creado exitosamente",
    description: "El negocio ha sido creado y el contacto sincronizado correctamente.",
  });

  return negocioCreado.id;
};