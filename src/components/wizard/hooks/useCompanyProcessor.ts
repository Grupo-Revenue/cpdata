import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHubSpotCompanyValidation } from '@/hooks/useHubSpotCompanyValidation';
import { ProductoraData, ClienteFinalData } from '../types';

export const useCompanyProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    searchCompanyInHubSpot,
    createCompanyInHubSpot,
    updateCompanyInHubSpot,
  } = useHubSpotCompanyValidation();
  
  const {
    searchCompanyInHubSpot: searchClienteInHubSpot,
    createCompanyInHubSpot: createClienteInHubSpot,
    updateCompanyInHubSpot: updateClienteInHubSpot,
  } = useHubSpotCompanyValidation();

  const processCompany = async (
    tipoCliente: 'productora' | 'cliente_final',
    productora: ProductoraData,
    clienteFinal: ClienteFinalData,
    tieneClienteFinal: boolean
  ) => {
    setIsProcessing(true);
    let hasErrors = false;

    try {
      console.log('[useCompanyProcessor] Starting company processing...');

      // Process Productora if selected
      if (tipoCliente === 'productora' && productora.nombre) {
        console.log('[useCompanyProcessor] Processing productora:', productora.nombre);
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) throw new Error('Usuario no autenticado');

          let hubspotId = null;
          
          // First sync with HubSpot
          const result = await searchCompanyInHubSpot(productora.nombre);
          console.log('[useCompanyProcessor] Productora search result:', result);
          
          if (result?.found && result.company) {
            console.log('[useCompanyProcessor] Updating existing productora in HubSpot');
            const updateResult = await updateCompanyInHubSpot({
              nombre: productora.nombre,
              rut: productora.rut,
              direccion: productora.direccion,
              sitio_web: productora.sitio_web,
              tipoCliente: 'productora',
              hubspotId: result.company.hubspotId
            });
            console.log('[useCompanyProcessor] Productora update result:', updateResult);
            hubspotId = result.company.hubspotId;
          } else {
            console.log('[useCompanyProcessor] Creating new productora in HubSpot');
            const createResult = await createCompanyInHubSpot({
              nombre: productora.nombre,
              rut: productora.rut,
              direccion: productora.direccion,
              sitio_web: productora.sitio_web,
              tipoCliente: 'productora'
            });
            console.log('[useCompanyProcessor] Productora create result:', createResult);
            hubspotId = createResult.hubspotId;
          }

          // Now save/update in local database
          console.log('[useCompanyProcessor] Saving productora to local database...');
          
          // First check if a company with this hubspot_id already exists (any user)
          let existingProductora = null;
          if (hubspotId) {
            const { data: hubspotExisting, error: hubspotSearchError } = await supabase
              .from('empresas')
              .select('id, user_id')
              .eq('hubspot_id', hubspotId)
              .maybeSingle();

            if (hubspotSearchError) throw hubspotSearchError;
            
            if (hubspotExisting) {
              existingProductora = hubspotExisting;
              console.log('[useCompanyProcessor] Found existing company with hubspot_id:', hubspotId);
            }
          }

          // If no company found by hubspot_id, check by name, type and user
          if (!existingProductora) {
            const { data: nameExisting, error: nameSearchError } = await supabase
              .from('empresas')
              .select('id, user_id')
              .eq('user_id', userId)
              .eq('nombre', productora.nombre)
              .eq('tipo', 'productora')
              .maybeSingle();

            if (nameSearchError) throw nameSearchError;
            existingProductora = nameExisting;
          }

          if (existingProductora) {
            // Update existing productora
            const { error: updateError } = await supabase
              .from('empresas')
              .update({
                nombre: productora.nombre,
                rut: productora.rut,
                direccion: productora.direccion,
                sitio_web: productora.sitio_web,
                user_id: userId, // Ensure user_id is updated if needed
                hubspot_id: hubspotId
              })
              .eq('id', existingProductora.id);

            if (updateError) throw updateError;
            console.log('[useCompanyProcessor] Productora updated in local database');
          } else {
            // Create new productora
            const { error: createError } = await supabase
              .from('empresas')
              .insert([{
                nombre: productora.nombre,
                rut: productora.rut,
                direccion: productora.direccion,
                sitio_web: productora.sitio_web,
                tipo: 'productora',
                user_id: userId,
                hubspot_id: hubspotId
              }]);

            if (createError) throw createError;
            console.log('[useCompanyProcessor] Productora created in local database');
          }
        } catch (error) {
          console.error('[useCompanyProcessor] Error processing Productora:', error);
          hasErrors = true;
          toast({
            title: "Error",
            description: `Error al guardar productora: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      // Process Cliente Final if applicable
      if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre) {
        console.log('[useCompanyProcessor] Processing cliente final:', clienteFinal.nombre);
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) throw new Error('Usuario no autenticado');

          let hubspotId = null;
          
          // First sync with HubSpot
          const result = await searchClienteInHubSpot(clienteFinal.nombre);
          console.log('[useCompanyProcessor] Cliente final search result:', result);
          
          if (result?.found && result.company) {
            console.log('[useCompanyProcessor] Updating existing cliente final in HubSpot');
            const updateResult = await updateClienteInHubSpot({
              nombre: clienteFinal.nombre,
              rut: clienteFinal.rut,
              direccion: clienteFinal.direccion,
              sitio_web: clienteFinal.sitio_web,
              tipoCliente: 'cliente_final',
              hubspotId: result.company.hubspotId
            });
            console.log('[useCompanyProcessor] Cliente final update result:', updateResult);
            hubspotId = result.company.hubspotId;
          } else {
            console.log('[useCompanyProcessor] Creating new cliente final in HubSpot');
            const createResult = await createClienteInHubSpot({
              nombre: clienteFinal.nombre,
              rut: clienteFinal.rut,
              direccion: clienteFinal.direccion,
              sitio_web: clienteFinal.sitio_web,
              tipoCliente: 'cliente_final'
            });
            console.log('[useCompanyProcessor] Cliente final create result:', createResult);
            hubspotId = createResult.hubspotId;
          }

          // Now save/update in local database
          console.log('[useCompanyProcessor] Saving cliente final to local database...');
          
          // First check if a company with this hubspot_id already exists (any user)
          let existingCliente = null;
          if (hubspotId) {
            const { data: hubspotExisting, error: hubspotSearchError } = await supabase
              .from('empresas')
              .select('id, user_id')
              .eq('hubspot_id', hubspotId)
              .maybeSingle();

            if (hubspotSearchError) throw hubspotSearchError;
            
            if (hubspotExisting) {
              existingCliente = hubspotExisting;
              console.log('[useCompanyProcessor] Found existing company with hubspot_id:', hubspotId);
            }
          }

          // If no company found by hubspot_id, check by name, type and user
          if (!existingCliente) {
            const { data: nameExisting, error: nameSearchError } = await supabase
              .from('empresas')
              .select('id, user_id')
              .eq('user_id', userId)
              .eq('nombre', clienteFinal.nombre)
              .eq('tipo', 'cliente_final')
              .maybeSingle();

            if (nameSearchError) throw nameSearchError;
            existingCliente = nameExisting;
          }

          if (existingCliente) {
            // Update existing cliente final
            const { error: updateError } = await supabase
              .from('empresas')
              .update({
                nombre: clienteFinal.nombre,
                rut: clienteFinal.rut,
                direccion: clienteFinal.direccion,
                sitio_web: clienteFinal.sitio_web,
                user_id: userId, // Ensure user_id is updated if needed
                hubspot_id: hubspotId
              })
              .eq('id', existingCliente.id);

            if (updateError) throw updateError;
            console.log('[useCompanyProcessor] Cliente final updated in local database');
          } else {
            // Create new cliente final
            const { error: createError } = await supabase
              .from('empresas')
              .insert([{
                nombre: clienteFinal.nombre,
                rut: clienteFinal.rut,
                direccion: clienteFinal.direccion,
                sitio_web: clienteFinal.sitio_web,
                tipo: 'cliente_final',
                user_id: userId,
                hubspot_id: hubspotId
              }]);

            if (createError) throw createError;
            console.log('[useCompanyProcessor] Cliente final created in local database');
          }
        } catch (error) {
          console.error('[useCompanyProcessor] Error processing Cliente Final:', error);
          hasErrors = true;
          toast({
            title: "Error",
            description: `Error al guardar cliente final: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      console.log('[useCompanyProcessor] Company processing completed. HasErrors:', hasErrors);

      if (hasErrors) {
        toast({
          title: "Error en el procesamiento",
          description: "Algunas operaciones tuvieron problemas. Por favor, corrige los errores antes de continuar.",
          variant: "destructive"
        });
        return false;
      } else {
        console.log('[useCompanyProcessor] All companies processed successfully');
        toast({
          title: "Empresas procesadas",
          description: "Todas las empresas han sido sincronizadas correctamente.",
        });
        return true;
      }
    } catch (error) {
      console.error('[useCompanyProcessor] Error general en el procesamiento:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar las empresas.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCompany,
    isProcessing
  };
};