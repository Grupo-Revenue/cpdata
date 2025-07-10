
import { supabase } from '@/integrations/supabase/client';

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
  hubspotId?: string;
  error?: string;
  wasCreated?: boolean;
  wasUpdated?: boolean;
}

interface HubSpotOperations {
  searchContactInHubSpot: (email: string) => Promise<any>;
  createContactInHubSpot: (contactData: ContactData) => Promise<any>;
  updateContactInHubSpot: (contactData: ContactData & { hubspotId: string }) => Promise<any>;
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
export const processContactForBusiness = async (
  contactData: ContactData, 
  hubspotOps: HubSpotOperations
): Promise<ProcessContactResult> => {
  try {
    console.log('Starting contact processing for:', contactData.email);
    
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Step 1: Search for contact in HubSpot (email normalized to lowercase)
    const normalizedEmail = contactData.email.toLowerCase().trim();
    console.log('Searching in HubSpot for:', normalizedEmail);
    
    const hubspotSearchResult = await hubspotOps.searchContactInHubSpot(normalizedEmail);
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
      const createResult = await hubspotOps.createContactInHubSpot(contactData);
      
      if (!createResult.success) {
        throw new Error(`Error creating contact in HubSpot: ${createResult.error}`);
      }
      
      hubspotContact = createResult.contact!;
      console.log('Contact created in HubSpot:', hubspotContact.hubspotId);
    }

    // Step 3: Search for contact in local database (email normalized and by hubspot_id if available)
    console.log('Searching in local database for:', normalizedEmail);
    
    let existingLocalContact = null;
    
    // First try to find by email
    const { data: contactByEmail, error: searchEmailError } = await supabase
      .from('contactos')
      .select('*')
      .eq('user_id', userId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (searchEmailError) {
      throw new Error(`Error searching local contact by email: ${searchEmailError.message}`);
    }

    // If contact found by email, use it
    if (contactByEmail) {
      existingLocalContact = contactByEmail;
      console.log('Contact found by email in local database:', contactByEmail.id);
    } 
    // If not found by email but we have a hubspot contact, try to find by hubspot_id
    else if (hubspotContact?.hubspotId) {
      console.log('Searching by hubspot_id:', hubspotContact.hubspotId);
      
      const { data: contactByHubspotId, error: searchHubspotError } = await supabase
        .from('contactos')
        .select('*')
        .eq('user_id', userId)
        .eq('hubspot_id', hubspotContact.hubspotId)
        .maybeSingle();

      if (searchHubspotError) {
        throw new Error(`Error searching local contact by hubspot_id: ${searchHubspotError.message}`);
      }

      if (contactByHubspotId) {
        existingLocalContact = contactByHubspotId;
        console.log('Contact found by hubspot_id in local database:', contactByHubspotId.id);
        
        // Update the email if it's different
        if (contactByHubspotId.email !== normalizedEmail) {
          console.log('Updating email from', contactByHubspotId.email, 'to', normalizedEmail);
          const { error: updateEmailError } = await supabase
            .from('contactos')
            .update({ email: normalizedEmail, updated_at: new Date().toISOString() })
            .eq('id', contactByHubspotId.id);
            
          if (updateEmailError) {
            console.error('Error updating contact email:', updateEmailError);
          }
        }
      }
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
        cargo: contactData.cargo || null,
        hubspot_id: hubspotContact?.hubspotId || null
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

      // Check if we need to update local data with HubSpot data or save HubSpot ID
      if (hubspotContact) {
        const updateData: any = {};
        let shouldUpdate = false;

        // Check if we need to save the HubSpot ID
        if (!existingLocalContact.hubspot_id && hubspotContact.hubspotId) {
          updateData.hubspot_id = hubspotContact.hubspotId;
          shouldUpdate = true;
          console.log('Adding HubSpot ID to existing contact:', hubspotContact.hubspotId);
        }

        // Check if we need to update contact data
        if (hasContactChanges(existingLocalContact, hubspotContact)) {
          updateData.nombre = hubspotContact.firstname || existingLocalContact.nombre;
          updateData.apellido = hubspotContact.lastname || existingLocalContact.apellido;
          updateData.telefono = hubspotContact.phone || existingLocalContact.telefono;
          shouldUpdate = true;
          console.log('Updating local contact with HubSpot data...');
        }

        if (shouldUpdate) {
          updateData.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from('contactos')
            .update(updateData)
            .eq('id', contactId);

          if (updateError) {
            console.error('Error updating local contact:', updateError);
            // Don't fail the entire process for update errors
          } else {
            wasUpdated = true;
            console.log('Local contact updated successfully');
          }
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
        
        const updateResult = await hubspotOps.updateContactInHubSpot({
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
      hubspotId: hubspotContact?.hubspotId,
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
