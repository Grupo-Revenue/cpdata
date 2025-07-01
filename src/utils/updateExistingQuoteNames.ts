
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';
import { generateQuoteName } from './quoteNameGenerator';

/**
 * Updates all existing quotes for a business to use the new naming convention
 * @param negocio - The business object containing quotes to update
 * @returns Promise<boolean> - Success status
 */
export const updateExistingQuoteNames = async (negocio: Negocio): Promise<boolean> => {
  try {
    console.log(`Updating quote names for business ${negocio.numero}`);
    
    if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
      console.log('No quotes to update');
      return true;
    }

    // Sort quotes by creation date to maintain chronological order
    const sortedQuotes = [...negocio.presupuestos].sort((a, b) => 
      new Date(a.fechaCreacion || a.created_at).getTime() - 
      new Date(b.fechaCreacion || b.created_at).getTime()
    );

    // Generate new names for each quote in order
    const updates = sortedQuotes.map((quote, index) => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const newName = `${negocio.numero}${alphabet[index]}`;
      
      return {
        id: quote.id,
        currentName: quote.nombre,
        newName
      };
    });

    console.log('Planned updates:', updates);

    // Update each quote in the database
    for (const update of updates) {
      if (update.currentName !== update.newName) {
        console.log(`Updating quote ${update.id}: "${update.currentName}" -> "${update.newName}"`);
        
        const { error } = await supabase
          .from('presupuestos')
          .update({ nombre: update.newName })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating quote ${update.id}:`, error);
          throw error;
        }
      }
    }

    console.log(`Successfully updated ${updates.length} quotes for business ${negocio.numero}`);
    return true;
  } catch (error) {
    console.error('Error updating existing quote names:', error);
    return false;
  }
};

/**
 * Updates all existing quotes for all businesses to use the new naming convention
 * @param negocios - Array of all business objects
 * @returns Promise<{ success: number, failed: number }> - Update statistics
 */
export const updateAllExistingQuoteNames = async (negocios: Negocio[]): Promise<{ success: number, failed: number }> => {
  let success = 0;
  let failed = 0;

  console.log(`Starting bulk update for ${negocios.length} businesses`);

  for (const negocio of negocios) {
    try {
      const result = await updateExistingQuoteNames(negocio);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to update quotes for business ${negocio.numero}:`, error);
      failed++;
    }
  }

  console.log(`Bulk update complete: ${success} successful, ${failed} failed`);
  return { success, failed };
};
