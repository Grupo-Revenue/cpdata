
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNegocio } from '@/context/NegocioContext';
import { toast } from '@/hooks/use-toast';
import { updateAllExistingQuoteNames } from '@/utils/updateExistingQuoteNames';
import { RefreshCw } from 'lucide-react';

const UpdateQuoteNamesButton: React.FC = () => {
  const { negocios, refreshNegocios } = useNegocio();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateQuoteNames = async () => {
    if (!confirm('¿Está seguro de que desea actualizar todos los nombres de presupuestos existentes? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsUpdating(true);
    
    try {
      const result = await updateAllExistingQuoteNames(negocios);
      
      if (result.success > 0) {
        toast({
          title: "Actualización completada",
          description: `Se actualizaron exitosamente ${result.success} negocios. ${result.failed > 0 ? `${result.failed} fallaron.` : ''}`,
        });
        
        // Refresh the data to show updated names
        await refreshNegocios();
      } else {
        toast({
          title: "Sin cambios",
          description: "No se encontraron presupuestos para actualizar o todos ya tenían el formato correcto.",
        });
      }
    } catch (error) {
      console.error('Error during bulk update:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los nombres de presupuestos",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      onClick={handleUpdateQuoteNames}
      disabled={isUpdating || negocios.length === 0}
      variant="outline"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
      {isUpdating ? 'Actualizando...' : 'Actualizar Nombres de Presupuestos'}
    </Button>
  );
};

export default UpdateQuoteNamesButton;
