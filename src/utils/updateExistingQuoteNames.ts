
import { supabase } from '@/integrations/supabase/client';
import { Negocio } from '@/types';

/**
 * Updates all existing quotes for a business to use the new naming convention
 * @param negocio - The business object containing quotes to update
 * @returns Promise<boolean> - Success status
 */
export const updateExistingQuoteNames = async (negocio: Negocio): Promise<boolean> => {
  try {
    console.log(`[updateExistingQuoteNames] Starting update for business ${negocio.numero} (ID: ${negocio.id})`);
    
    if (!negocio.presupuestos || negocio.presupuestos.length === 0) {
      console.log(`[updateExistingQuoteNames] No quotes to update for business ${negocio.numero}`);
      return true;
    }

    console.log(`[updateExistingQuoteNames] Found ${negocio.presupuestos.length} quotes for business ${negocio.numero}`);

    // Sort quotes by creation date to maintain chronological order
    const sortedQuotes = [...negocio.presupuestos].sort((a, b) => 
      new Date(a.fechaCreacion || a.created_at).getTime() - 
      new Date(b.fechaCreacion || b.created_at).getTime()
    );

    console.log(`[updateExistingQuoteNames] Sorted quotes for business ${negocio.numero}:`, 
      sortedQuotes.map(q => ({ id: q.id, name: q.nombre, date: q.fechaCreacion || q.created_at }))
    );

    // Generate new names for each quote in order
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const updates = sortedQuotes.map((quote, index) => {
      const newName = `${negocio.numero}${alphabet[index]}`;
      return {
        id: quote.id,
        currentName: quote.nombre,
        newName,
        needsUpdate: quote.nombre !== newName
      };
    });

    console.log(`[updateExistingQuoteNames] Planned updates for business ${negocio.numero}:`, updates);

    // Update each quote that needs updating
    let updatedCount = 0;
    for (const update of updates) {
      if (update.needsUpdate) {
        console.log(`[updateExistingQuoteNames] Updating quote ${update.id}: "${update.currentName}" -> "${update.newName}"`);
        
        const { error } = await supabase
          .from('presupuestos')
          .update({ 
            nombre: update.newName,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (error) {
          console.error(`[updateExistingQuoteNames] Error updating quote ${update.id}:`, error);
          throw error;
        }

        console.log(`[updateExistingQuoteNames] Successfully updated quote ${update.id}`);
        updatedCount++;
      } else {
        console.log(`[updateExistingQuoteNames] Quote ${update.id} already has correct name: "${update.currentName}"`);
      }
    }

    console.log(`[updateExistingQuoteNames] Successfully updated ${updatedCount}/${updates.length} quotes for business ${negocio.numero}`);
    return true;
  } catch (error) {
    console.error(`[updateExistingQuoteNames] Error updating quotes for business ${negocio.numero}:`, error);
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

  console.log(`[updateAllExistingQuoteNames] Starting bulk update for ${negocios.length} businesses`);

  // Filter businesses that actually have quotes
  const businessesWithQuotes = negocios.filter(negocio => 
    negocio.presupuestos && negocio.presupuestos.length > 0
  );

  console.log(`[updateAllExistingQuoteNames] Found ${businessesWithQuotes.length} businesses with quotes`);

  for (const negocio of businessesWithQuotes) {
    try {
      console.log(`[updateAllExistingQuoteNames] Processing business ${negocio.numero}...`);
      const result = await updateExistingQuoteNames(negocio);
      if (result) {
        success++;
        console.log(`[updateAllExistingQuoteNames] ✓ Successfully processed business ${negocio.numero}`);
      } else {
        failed++;
        console.log(`[updateAllExistingQuoteNames] ✗ Failed to process business ${negocio.numero}`);
      }
    } catch (error) {
      console.error(`[updateAllExistingQuoteNames] Exception processing business ${negocio.numero}:`, error);
      failed++;
    }
  }

  console.log(`[updateAllExistingQuoteNames] Bulk update complete: ${success} successful, ${failed} failed`);
  return { success, failed };
};
