import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DealData {
  nombre_correlativo: string;
  tipo_evento: string;
  nombre_evento: string;
  valor_negocio: number;
  fecha_evento: string;
  fecha_evento_fin?: string;
  horario_inicio?: string;
  horario_fin?: string;
  fecha_cierre?: string;
  locacion: string;
  cantidad_invitados: number;
  cantidad_asistentes: number;
  contactId: string;
  productoraId?: string;
  clienteFinalId?: string;
}

interface HubSpotDeal {
  hubspotId: string;
  dealname: string;
}

interface DealResult {
  success: boolean;
  negocioId?: string;
  hubspotId?: string;
  wasCreated?: boolean;
  wasUpdated?: boolean;
  error?: string;
}

export const processDealForBusiness = async (
  dealData: DealData,
  hubspotDealOperations: any,
  negocioId?: string
): Promise<DealResult> => {
  try {
    console.log('[NegocioCreationService] Starting deal processing for:', dealData.nombre_correlativo);
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    let hubspotDeal: HubSpotDeal | null = null;
    let wasCreated = false;
    let wasUpdated = false;

    // Step 1: Create deal in HubSpot if operations are available
    if (hubspotDealOperations?.createDealInHubSpot) {
      try {
        console.log('[NegocioCreationService] Creating deal in HubSpot...');
        
        const createResult = await hubspotDealOperations.createDealInHubSpot(dealData);
        
        if (createResult?.success && createResult.deal) {
          hubspotDeal = createResult.deal;
          console.log('[NegocioCreationService] Deal created in HubSpot:', hubspotDeal.hubspotId);
          wasCreated = true;
        }
      } catch (error) {
        console.warn('[NegocioCreationService] HubSpot deal creation failed:', error);
        // Continue without HubSpot
      }
    }

    // Step 2: If we have a negocioId, update it with HubSpot ID
    if (negocioId && hubspotDeal?.hubspotId) {
      try {
        console.log('[NegocioCreationService] Updating existing negocio with HubSpot ID:', hubspotDeal.hubspotId);
        
        // First check if another negocio already has this hubspot_id
        const { data: existingWithHubspotId, error: searchError } = await supabase
          .from('negocios')
          .select('id, numero')
          .eq('hubspot_id', hubspotDeal.hubspotId)
          .eq('user_id', userId)
          .neq('id', negocioId)
          .maybeSingle();

        if (searchError) {
          console.error('[NegocioCreationService] Error checking for existing hubspot_id:', searchError);
        } else if (existingWithHubspotId) {
          console.warn('[NegocioCreationService] Found existing negocio with same hubspot_id, clearing it first:', {
            existingId: existingWithHubspotId.id,
            existingNumber: existingWithHubspotId.numero,
            hubspotId: hubspotDeal.hubspotId
          });
          
          // Clear the hubspot_id from the existing negocio to avoid conflicts
          const { error: clearError } = await supabase
            .from('negocios')
            .update({ 
              hubspot_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingWithHubspotId.id);

          if (clearError) {
            console.error('[NegocioCreationService] Error clearing duplicate hubspot_id:', clearError);
          } else {
            console.log('[NegocioCreationService] Cleared duplicate hubspot_id from existing negocio');
          }
        }

        // Now try to update the current negocio
        const { error: updateError } = await supabase
          .from('negocios')
          .update({ 
            hubspot_id: hubspotDeal.hubspotId,
            updated_at: new Date().toISOString()
          })
          .eq('id', negocioId);

        if (updateError) {
          console.error('[NegocioCreationService] Error updating negocio with HubSpot ID:', updateError);
        } else {
          console.log('[NegocioCreationService] Successfully updated negocio with HubSpot ID');
          wasUpdated = true;
        }
      } catch (error) {
        console.warn('[NegocioCreationService] Failed to update negocio with HubSpot ID:', error);
      }
    }


    // Step 4: Sync business value to HubSpot if we have the IDs
    if (negocioId && hubspotDeal?.hubspotId) {
      try {
        console.log('[NegocioCreationService] Syncing business value to HubSpot...');
        
        const { data, error } = await supabase.functions.invoke('hubspot-deal-amount-update', {
          body: {
            negocio_id: negocioId,
            amount: dealData.valor_negocio || 0
          }
        });
        
        if (error) {
          console.warn('[NegocioCreationService] Failed to sync business value to HubSpot:', error);
        } else {
          console.log('[NegocioCreationService] Business value synced to HubSpot successfully:', data);
        }
      } catch (syncError) {
        console.warn('[NegocioCreationService] Error syncing business value to HubSpot:', syncError);
        // Don't fail the whole process for sync errors
      }
    }

    console.log('[NegocioCreationService] Deal processing completed successfully:', {
      negocioId,
      hubspotId: hubspotDeal?.hubspotId,
      wasCreated,
      wasUpdated
    });

    return {
      success: true,
      negocioId,
      hubspotId: hubspotDeal?.hubspotId,
      wasCreated,
      wasUpdated
    };

  } catch (error) {
    console.error('[NegocioCreationService] Error processing deal:', error);
    return {
      success: false,
      error: error.message || 'Error procesando negocio en HubSpot'
    };
  }
};

export const handleNegocioHubSpotSync = async (
  negocioId: string,
  hubspotOperations: any
): Promise<DealResult> => {
  try {
    console.log('[NegocioCreationService] Starting HubSpot sync for negocio:', negocioId);
    
    // Get negocio data from database
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select(`
        *,
        contacto: contactos (hubspot_id),
        productora: empresas!productora_id (hubspot_id),
        clienteFinal: empresas!cliente_final_id (hubspot_id)
      `)
      .eq('id', negocioId)
      .single();

    if (negocioError || !negocio) {
      throw new Error(`Error fetching negocio: ${negocioError?.message}`);
    }

    // Skip if already has HubSpot ID
    if (negocio.hubspot_id) {
      console.log('[NegocioCreationService] Negocio already has HubSpot ID:', negocio.hubspot_id);
      return {
        success: true,
        negocioId,
        hubspotId: negocio.hubspot_id,
        wasCreated: false,
        wasUpdated: false
      };
    }

    // Prepare deal data for HubSpot
    const dealData: DealData = {
      nombre_correlativo: `#${negocio.numero}`,
      tipo_evento: negocio.tipo_evento,
      nombre_evento: negocio.nombre_evento,
      valor_negocio: 0, // Will be calculated from presupuestos
      fecha_evento: negocio.fecha_evento,
      fecha_cierre: negocio.fecha_cierre,
      locacion: negocio.locacion,
      cantidad_invitados: negocio.cantidad_invitados || 0,
      cantidad_asistentes: negocio.cantidad_asistentes || 0,
      contactId: negocio.contacto?.hubspot_id,
      productoraId: negocio.productora?.hubspot_id,
      clienteFinalId: negocio.clienteFinal?.hubspot_id
    };

    // Process the deal with HubSpot
    return await processDealForBusiness(dealData, hubspotOperations, negocioId);

  } catch (error) {
    console.error('[NegocioCreationService] Error in HubSpot sync:', error);
    return {
      success: false,
      error: error.message || 'Error sincronizando negocio con HubSpot'
    };
  }
};