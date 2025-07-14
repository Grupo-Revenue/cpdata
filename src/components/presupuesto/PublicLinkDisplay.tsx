import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublicLinkManager } from '@/hooks/usePublicLinkManager';

interface PublicLinkDisplayProps {
  presupuestoId: string;
  negocioId: string;
  estadoPresupuesto: string;
}

const PublicLinkDisplay: React.FC<PublicLinkDisplayProps> = ({ presupuestoId, negocioId, estadoPresupuesto }) => {
  const { toast } = useToast();
  const { 
    currentLink, 
    isLoading, 
    getExistingLink,
    createPublicLink
  } = usePublicLinkManager({ presupuestoId, negocioId });

  useEffect(() => {
    const loadOrCreateLink = async () => {
      const existingLink = await getExistingLink();
      
      // Si el presupuesto está publicado pero no tiene link, crear uno automáticamente
      if (!existingLink && estadoPresupuesto === 'publicado') {
        await createPublicLink();
      }
    };
    
    loadOrCreateLink();
  }, [presupuestoId, negocioId, estadoPresupuesto]);

  const handleCopyLink = async () => {
    if (!currentLink?.link_url) return;
    
    try {
      await navigator.clipboard.writeText(currentLink.link_url);
      toast({
        title: "Link copiado",
        description: "El enlace se ha copiado al portapapeles.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  const handleOpenLink = () => {
    if (currentLink?.link_url) {
      window.open(currentLink.link_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Cargando enlace público...</p>
      </div>
    );
  }

  if (!currentLink) {
    return (
      <div className="text-center py-8">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Enlace no disponible</h3>
        <p className="text-muted-foreground">
          Este presupuesto no tiene un enlace público o aún no ha sido enviado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <ExternalLink className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Enlace Público del Presupuesto</h3>
        <p className="text-muted-foreground">
          Comparte este enlace para que puedan ver el presupuesto sin necesidad de acceso.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            URL del enlace:
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentLink.link_url || ''}
              readOnly
              className="flex-1 px-3 py-2 bg-background border rounded-md text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Veces accedido: {currentLink.access_count}</span>
          {currentLink.expires_at && (
            <span>
              Expira: {new Date(currentLink.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleCopyLink} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Enlace
          </Button>
          <Button variant="outline" onClick={handleOpenLink} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Enlace
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicLinkDisplay;