
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { updateExistingQuoteNames } from '@/utils/updateExistingQuoteNames';
import { Negocio } from '@/types';

export const useQuoteNameUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateBusinessQuoteNames = async (negocio: Negocio, onSuccess?: () => void) => {
    setIsUpdating(true);
    
    try {
      const success = await updateExistingQuoteNames(negocio);
      
      if (success) {
        toast({
          title: "Nombres actualizados",
          description: `Los nombres de presupuestos del negocio ${negocio.numero} han sido actualizados`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los nombres de presupuestos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating quote names:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los nombres",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateBusinessQuoteNames,
    isUpdating
  };
};
