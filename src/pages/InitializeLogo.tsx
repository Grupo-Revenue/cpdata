import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadUserLogoToStorage } from '@/utils/uploadUserLogo';
import { toast } from '@/hooks/use-toast';

export const InitializeLogo: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadLogo = async () => {
    setIsUploading(true);
    try {
      await uploadUserLogoToStorage();
      toast({
        title: 'Logo subido exitosamente',
        description: 'El logo se ha subido correctamente a Supabase Storage.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error al subir logo',
        description: 'No se pudo subir el logo. Intenta nuevamente.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Inicializar Logo</h2>
        <p className="mb-4">
          Sube el logo del usuario a Supabase Storage para que aparezca en los PDFs.
        </p>
        <Button 
          onClick={handleUploadLogo} 
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Subiendo...' : 'Subir Logo a Storage'}
        </Button>
      </Card>
    </div>
  );
};