import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Share, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PublicLinkManagerProps {
  presupuestoId: string;
  negocioId: string;
}

const PublicLinkManager: React.FC<PublicLinkManagerProps> = ({ presupuestoId, negocioId }) => {
  const [publicUrl, setPublicUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    generatePublicUrl();
  }, [presupuestoId, negocioId]);

  const generatePublicUrl = async () => {
    try {
      const { data: presupuesto, error } = await supabase
        .from('presupuestos')
        .select('nombre')
        .eq('id', presupuestoId)
        .single();

      if (error || !presupuesto) {
        throw new Error('No se pudo obtener la información del presupuesto');
      }

      const presupuestoName = presupuesto.nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const url = `${window.location.origin}/public/presupuesto/${presupuestoName}/${negocioId}/${presupuestoId}/view`;
      setPublicUrl(url);
    } catch (error) {
      console.error('Error generating public URL:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    
    try {
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link copiado",
        description: "El link público ha sido copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el link",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Link Público</h3>
        <p className="text-muted-foreground mt-1">
          Comparte este presupuesto sin necesidad de autenticación
        </p>
      </div>

      {publicUrl ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* URL Display */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-muted-foreground break-all">
                    {publicUrl}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLink}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Share className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-2">Generando link público...</h4>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicLinkManager;