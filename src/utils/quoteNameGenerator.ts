
import { Negocio } from '@/types';

/**
 * Generates a quote name using business number + sequential letter format
 * @param negocio - The business object containing the business number
 * @param existingQuotes - Array of existing quotes for this business
 * @returns Generated quote name (e.g., "17664A", "17664B")
 */
export const generateQuoteName = (negocio: Negocio, existingQuotes: any[] = []): string => {
  const businessNumber = negocio.numero;
  
  // Get all existing quote names for this business that follow the pattern
  const existingNames = existingQuotes
    .map(quote => quote.nombre)
    .filter(name => name && name.startsWith(businessNumber.toString()))
    .map(name => name.replace(businessNumber.toString(), '')) // Extract just the letter part
    .filter(suffix => /^[A-Z]$/.test(suffix)) // Only single letters
    .sort((a, b) => a.localeCompare(b)); // Ensure proper alphabetical sorting
  
  // Find the next available letter
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let nextLetter = 'A';
  
  for (let i = 0; i < alphabet.length; i++) {
    const letter = alphabet[i];
    if (!existingNames.includes(letter)) {
      nextLetter = letter;
      break;
    }
  }
  
  return `${businessNumber}${nextLetter}`;
};
