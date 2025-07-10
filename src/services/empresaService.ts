import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EmpresaData {
  nombre: string;
  rut: string;
  direccion: string;
  sitio_web: string;
  tipo: 'productora' | 'cliente_final';
}

interface HubSpotCompany {
  hubspotId: string;
  name: string;
  tipoCliente: string;
  rut: string;
  address: string;
  website: string;
}

interface EmpresaResult {
  success: boolean;
  empresaId?: string;
  hubspotId?: string;
  wasCreated?: boolean;
  wasUpdated?: boolean;
  error?: string;
}

export const processCompanyForBusiness = async (
  empresaData: EmpresaData,
  hubspotOperations: any
): Promise<EmpresaResult> => {
  try {
    console.log('[EmpresaService] Starting company processing for:', empresaData.nombre);
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    const normalizedName = empresaData.nombre.trim();
    let hubspotCompany: HubSpotCompany | null = null;

    // Step 1: Search in HubSpot if operations are available
    if (hubspotOperations?.searchCompanyInHubSpot) {
      try {
        console.log('[EmpresaService] Searching company in HubSpot:', normalizedName);
        
        const searchResult = await hubspotOperations.searchCompanyInHubSpot(normalizedName);
        
        if (searchResult?.found && searchResult.company) {
          hubspotCompany = searchResult.company;
          console.log('[EmpresaService] Company found in HubSpot:', hubspotCompany.hubspotId);
        } else {
          console.log('[EmpresaService] Company not found in HubSpot');
        }
      } catch (error) {
        console.warn('[EmpresaService] HubSpot search failed:', error);
        // Continue without HubSpot
      }
    }

    // Step 2: Create or update in HubSpot if not found
    if (!hubspotCompany && hubspotOperations?.createCompanyInHubSpot) {
      try {
        console.log('[EmpresaService] Creating company in HubSpot...');
        
        const createResult = await hubspotOperations.createCompanyInHubSpot({
          ...empresaData,
          tipoCliente: empresaData.tipo
        });

        if (createResult?.success && createResult.company) {
          hubspotCompany = createResult.company;
          console.log('[EmpresaService] Company created in HubSpot:', hubspotCompany.hubspotId);
        }
      } catch (error) {
        console.warn('[EmpresaService] HubSpot creation failed:', error);
        // Continue without HubSpot
      }
    }

    // Step 3: Search for company in local database (name normalized and by hubspot_id if available)
    console.log('[EmpresaService] Searching in local database for:', normalizedName);
    
    let existingLocalCompany = null;
    
    // First try to find by name and type
    const { data: companyByName, error: searchNameError } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', userId)
      .eq('nombre', normalizedName)
      .eq('tipo', empresaData.tipo)
      .maybeSingle();

    if (searchNameError) {
      throw new Error(`Error searching local company by name: ${searchNameError.message}`);
    }

    // If company found by name, use it
    if (companyByName) {
      existingLocalCompany = companyByName;
      console.log('[EmpresaService] Company found by name in local database:', companyByName.id);
    } 
    // If not found by name but we have a hubspot company, try to find by hubspot_id
    else if (hubspotCompany?.hubspotId) {
      console.log('[EmpresaService] Searching by hubspot_id:', hubspotCompany.hubspotId);
      
      const { data: companyByHubspotId, error: searchHubspotError } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', userId)
        .eq('hubspot_id', hubspotCompany.hubspotId)
        .maybeSingle();

      if (searchHubspotError) {
        throw new Error(`Error searching local company by hubspot_id: ${searchHubspotError.message}`);
      }

      if (companyByHubspotId) {
        existingLocalCompany = companyByHubspotId;
        console.log('[EmpresaService] Company found by hubspot_id in local database:', companyByHubspotId.id);
        
        // Update the name if it's different
        if (companyByHubspotId.nombre !== normalizedName) {
          console.log('[EmpresaService] Updating name from', companyByHubspotId.nombre, 'to', normalizedName);
          const { data: updatedCompany, error: updateNameError } = await supabase
            .from('empresas')
            .update({ 
              nombre: normalizedName, 
              rut: empresaData.rut,
              direccion: empresaData.direccion,
              sitio_web: empresaData.sitio_web,
              updated_at: new Date().toISOString() 
            })
            .eq('id', companyByHubspotId.id)
            .select('*')
            .single();
            
          if (updateNameError) {
            console.error('[EmpresaService] Error updating company data:', updateNameError);
          } else {
            // Update existingLocalCompany with the updated data
            existingLocalCompany = updatedCompany;
          }
        }
      }
    }

    let empresaId: string;
    let wasCreated = false;
    let wasUpdated = false;

    if (!existingLocalCompany) {
      // Step 4a: Company doesn't exist locally, create it
      console.log('[EmpresaService] Creating company in local database...');
      
      const companyDataToInsert = {
        user_id: userId,
        nombre: normalizedName,
        rut: empresaData.rut,
        direccion: empresaData.direccion,
        sitio_web: empresaData.sitio_web,
        tipo: empresaData.tipo,
        hubspot_id: hubspotCompany?.hubspotId || null
      };

      try {
        const { data: newCompany, error: createError } = await supabase
          .from('empresas')
          .insert([companyDataToInsert])
          .select('id')
          .single();

        if (createError) {
          // Check if it's a hubspot_id constraint violation
          if (createError.message?.includes('unique_empresas_hubspot_id') && hubspotCompany?.hubspotId) {
            console.log('[EmpresaService] HubSpot ID constraint violation, searching for existing company with this ID...');
            
            // Try to find the company that has this hubspot_id
            const { data: existingByHubspotId, error: searchByHubspotError } = await supabase
              .from('empresas')
              .select('*')
              .eq('hubspot_id', hubspotCompany.hubspotId)
              .maybeSingle();

            if (searchByHubspotError) {
              throw new Error(`Error searching for company with hubspot_id: ${searchByHubspotError.message}`);
            }

            if (existingByHubspotId) {
              console.log('[EmpresaService] Found existing company with hubspot_id, updating it...');
              
              // Update the existing company with new data
              const { data: updatedCompany, error: updateError } = await supabase
                .from('empresas')
                .update({
                  nombre: normalizedName,
                  rut: empresaData.rut,
                  direccion: empresaData.direccion,
                  sitio_web: empresaData.sitio_web,
                  tipo: empresaData.tipo,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingByHubspotId.id)
                .select('id')
                .single();

              if (updateError) {
                throw new Error(`Error updating existing company: ${updateError.message}`);
              }

              empresaId = updatedCompany.id;
              wasUpdated = true;
              console.log('[EmpresaService] Successfully updated existing company:', empresaId);
            } else {
              throw new Error(`HubSpot ID constraint violation but no company found with that ID`);
            }
          } else {
            throw new Error(`Error creating local company: ${createError.message}`);
          }
        } else {
          empresaId = newCompany.id;
          wasCreated = true;
          console.log('[EmpresaService] Company created in local database:', empresaId);
        }
      } catch (error) {
        console.error('[EmpresaService] Error in company creation/update process:', error);
        throw error;
      }
    } else {
      // Step 4b: Company exists locally, update if needed
      empresaId = existingLocalCompany.id;
      console.log('[EmpresaService] Using existing company:', empresaId);

      // Update HubSpot ID if not present and we have one from HubSpot
      if (!existingLocalCompany.hubspot_id && hubspotCompany?.hubspotId) {
        try {
          const { error: updateHubspotIdError } = await supabase
            .from('empresas')
            .update({ hubspot_id: hubspotCompany.hubspotId, updated_at: new Date().toISOString() })
            .eq('id', empresaId);
            
          if (updateHubspotIdError) {
            console.error('[EmpresaService] Error updating HubSpot ID:', updateHubspotIdError);
          } else {
            console.log('[EmpresaService] Updated existing company with HubSpot ID:', hubspotCompany.hubspotId);
            wasUpdated = true;
          }
        } catch (error) {
          console.warn('[EmpresaService] Failed to update HubSpot ID:', error);
        }
      }

      // Update other fields if they differ
      const needsUpdate = 
        existingLocalCompany.rut !== empresaData.rut ||
        existingLocalCompany.direccion !== empresaData.direccion ||
        existingLocalCompany.sitio_web !== empresaData.sitio_web;

      if (needsUpdate) {
        try {
          const { error: updateError } = await supabase
            .from('empresas')
            .update({
              rut: empresaData.rut,
              direccion: empresaData.direccion,
              sitio_web: empresaData.sitio_web,
              updated_at: new Date().toISOString()
            })
            .eq('id', empresaId);

          if (updateError) {
            console.error('[EmpresaService] Error updating company data:', updateError);
          } else {
            console.log('[EmpresaService] Updated existing company data');
            wasUpdated = true;
          }
        } catch (error) {
          console.warn('[EmpresaService] Failed to update company data:', error);
        }
      }
    }

    console.log('[EmpresaService] Company processing completed successfully:', {
      empresaId,
      hubspotId: hubspotCompany?.hubspotId,
      wasCreated,
      wasUpdated
    });

    return {
      success: true,
      empresaId,
      hubspotId: hubspotCompany?.hubspotId,
      wasCreated,
      wasUpdated
    };

  } catch (error) {
    console.error('[EmpresaService] Error processing company:', error);
    return {
      success: false,
      error: error.message || 'Error procesando empresa'
    };
  }
};