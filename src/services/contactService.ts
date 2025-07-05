
import { supabase } from '@/integrations/supabase/client';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';

interface ContactData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo?: string;
}

interface HubSpotContact {
  hubspotId: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

interface ProcessContactResult {
  success: boolean;
  contactId: string;
  error?: string;
  wasCreated?: boolean;
  wasUpdated?: boolean;
}

// Helper function to compare contact data and detect changes
const hasContactChanges = (localContact: any, hubspotContact: HubSpotContact): boolean => {
  if (!localContact || !hubspotContact) return false;
  
  const localName = (localContact.nombre || '').trim().toLowerCase();
  const localLastName = (localContact.apellido || '').trim().toLowerCase();
  const localPhone = (localContact.telefono || '').replace(/\s+/g, '');
  
  const hubspotName = (hubspotContact.firstname || '').trim().toLowerCase();
  const hubspotLastName = (hubspotContact.lastname || '').trim().toLowerCase();
  const hubspotPhone = (hubspotContact.phone || '').replace(/\s+/g, '');
  
  return (
    localName !== hubspotName ||
    localLastName !== hubspotLastName ||
    localPhone !== hubspotPhone
  );
};

// Main function to process contact with robust logic
export const processContactForBusiness = async (contactData: ContactData): Promise<ProcessContactResult> => {
  try {
    console.log('Starting contact processing for:', contactData.email);
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Create HubSpot validation instance
    const hubspotValidation = useHubSpotContactValidation();
    
    // Step 1: Search for contact in HubSpot (email normalized to lowercase)
    const normalizedEmail = contactData.email.toLowerCase().trim();
    console.log('Searching in HubSpot for:', normalizedEmail);
    
    const hubspotSearchResult = await hubspotValidation.searchContactInHubSpot(normalizedEmail);
    let hubspotContact: HubSpotContact | null = null;
    let hubspotContactExists = false;

    if (hubspotSearchResult?.found && hubspotSearchResult.contact) {
      hubspotContact = hubspotSearchResult.contact;
      hubspotContactExists = true;
      console.log('Contact found in HubSpot:', hubspotContact.hubspotId);
    } else {
      console.log('Contact not found in HubSpot, will create new one');
    }

    // Step 2: If contact doesn't exist in HubSpot, create it
    if (!hubspotContactExists) {
      console.log('Creating new contact in HubSpot...');
      const createResult = await hubspotValidation.createContactInHubSpot(contactData);
      
      if (!createResult.success) {
        throw new Error(`Error creating contact in HubSpot: ${createResult.error}`);
      }
      
      hubspotContact = createResult.contact!;
      console.log('Contact created in HubSpot:', hubspotContact.hubspotId);
    }

    // Step 3: Search for contact in local database (email normalized)
    console.log('Searching in local database for:', normalizedEmail);
    const { data: existingLocalContact, error: searchError } = await supabase
      .from('contactos')
      .select('*')
      .eq('user_id', userId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (searchError) {
      throw new Error(`Error searching local contact: ${searchError.message}`);
    }

    let contactId: string;
    let wasCreated = false;
    let wasUpdated = false;

    if (!existingLocalContact) {
      // Step 4a: Contact doesn't exist locally, create it
      console.log('Creating contact in local database...');
      
      const contactDataToInsert = {
        user_id: userId,
        nombre: hubspotContact?.firstname || contactData.nombre,
        apellido: hubspotContact?.lastname || contactData.apellido,
        email: normalizedEmail,
        telefono: hubspotContact?.phone || contactData.telefono,
        cargo: contactData.cargo || null
      };

      const { data: newContact, error: createError } = await supabase
        .from('contactos')
        .insert([contactDataToInsert])
        .select('id')
        .single();

      if (createError) {
        throw new Error(`Error creating local contact: ${createError.message}`);
      }

      contactId = newContact.id;
      wasCreated = true;
      console.log('Contact created in local database:', contactId);

    } else {
      // Step 4b: Contact exists locally
      contactId = existingLocalContact.id;
      console.log('Contact found in local database:', contactId);

      // Check if we need to update local data with HubSpot data
      if (hubspotContact && hasContactChanges(existingLocalContact, hubspotContact)) {
        console.log('Updating local contact with HubSpot data...');
        
        const updatedContactData = {
          nombre: hubspotContact.firstname || existingLocalContact.nombre,
          apellido: hubspotContact.lastname || existingLocalContact.apellido,
          telefono: hubspotContact.phone || existingLocalContact.telefono,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('contactos')
          .update(updatedContactData)
          .eq('id', contactId);

        if (updateError) {
          console.error('Error updating local contact:', updateError);
          // Don't fail the entire process for update errors
        } else {
          wasUpdated = true;
          console.log('Local contact updated successfully');
        }
      }

      // Check if we need to update HubSpot with local changes
      if (hubspotContact && hasContactChanges(hubspotContact, {
        hubspotId: hubspotContact.hubspotId,
        firstname: contactData.nombre,
        lastname: contactData.apellido,
        email: normalizedEmail,
        phone: contactData.telefono
      })) {
        console.log('Updating HubSpot contact with local data...');
        
        const updateResult = await hubspotValidation.updateContactInHubSpot({
          ...contactData,
          email: normalizedEmail,
          hubspotId: hubspotContact.hubspotId
        });

        if (!updateResult.success) {
          console.error('Error updating HubSpot contact:', updateResult.error);
          // Don't fail the entire process for HubSpot update errors
        } else {
          console.log('HubSpot contact updated successfully');
        }
      }
    }

    console.log('Contact processing completed successfully:', {
      contactId,
      wasCreated,
      wasUpdated,
      hubspotExists: hubspotContactExists
    });

    return {
      success: true,
      contactId,
      wasCreated,
      wasUpdated
    };

  } catch (error) {
    console.error('Error processing contact:', error);
    return {
      success: false,
      contactId: '',
      error: error.message || 'Error desconocido al procesar el contacto'
    };
  }
};
