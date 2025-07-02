
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
    console.log('[UpdateQuoteNamesButton] Starting quote name update process');
    console.log('[UpdateQuoteNamesButton] Current negocios count:', negocios.length);
    
    try {
      // Log current state before update
      console.log('[UpdateQuoteNamesButton] Current negocios with quotes:');
      negocios.forEach(negocio => {
        if (negocio.presupuestos && negocio.presupuestos.length > 0) {
          console.log(`[UpdateQuoteNamesButton] Business ${negocio.numero}:`, {
            id: negocio.id,
            quotes: negocio.presupuestos.map(p => ({ id: p.id, name: p.nombre }))
          });
        }
      });

      const result = await updateAllExistingQuoteNames(negocios);
      console.log('[UpdateQuoteNamesButton] Update result:', result);
      
      if (result.success > 0) {
        toast({
          title: "Actualización en progreso",
          description: `Actualizando ${result.success} negocios. Refrescando datos...`,
        });
        
        console.log('[UpdateQuoteNamesButton] Triggering data refresh...');
        
        // Force a complete refresh with a small delay to ensure database writes are complete
        setTimeout(async () => {
          console.log('[UpdateQuoteNamesButton] Executing refresh...');
          await refreshNegocios();
          
          // Wait for refresh to complete and log the results
          setTimeout(() => {
            console.log('[UpdateQuoteNamesButton] Refresh completed. New state:');
            console.log('[UpdateQuoteNamesButton] Total negocios after refresh:', negocios.length);
            
            toast({
              title: "Actualización completada",
              description: `Se actualizaron exitosamente ${result.success} negocios. ${result.failed > 0 ? `${result.failed} fallaron.` : ''}`,
            });
          }, 1000);
        }, 2000);
      } else {
        toast({
          title: "Sin cambios",
          description: "No se encontraron presupuestos para actualizar o todos ya tenían el formato correcto.",
        });
      }
    } catch (error) {
      console.error('[UpdateQuoteNamesButton] Error during bulk update:', error);
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
