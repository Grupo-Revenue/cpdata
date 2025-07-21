
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, RefreshCw, ExternalLink, Share, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublicLinkManager } from '@/hooks/usePublicLinkManager';

interface PublicLinkManagerProps {
  presupuestoId: string;
  negocioId: string;
  estadoPresupuesto?: string;
  facturado?: boolean;
}

const PublicLinkManager: React.FC<PublicLinkManagerProps> = ({ 
  presupuestoId, 
  negocioId, 
  estadoPresupuesto,
  facturado = false
}) => {
  const { toast } = useToast();
  const { 
    currentLink, 
    isLoading, 
    getExistingLink, 
    createPublicLink,
    regenerateLink 
  } = usePublicLinkManager({ presupuestoId, negocioId });

  // Determine if the presupuesto is eligible for public links
  const isEligibleForLink = estadoPresupuesto === 'publicado' || 
                           estadoPresupuesto === 'aprobado' || 
                           facturado;

  useEffect(() => {
    const fetchAndCreateLink = async () => {
      console.log('🔗 [PublicLinkManager] Checking for existing link:', { presupuestoId, estadoPresupuesto, facturado });
      
      const existingLink = await getExistingLink();
      
      // Si no hay link pero el presupuesto es elegible, crear automáticamente
      if (!existingLink && isEligibleForLink) {
        console.log('🔗 [PublicLinkManager] Creating link automatically for eligible presupuesto');
        await createPublicLink();
      }
    };
    
    fetchAndCreateLink();
  }, [presupuestoId, negocioId, estadoPresupuesto, facturado, isEligibleForLink]);

  const handleCopyLink = async () => {
    if (!currentLink?.link_url) return;
    
    try {
      navigator.clipboard.writeText(currentLink.link_url);
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
    if (!currentLink?.link_url) return;
    window.open(currentLink.link_url, '_blank');
  };

  const handleRegenerateLink = async () => {
    await regenerateLink();
  };

  const handleCreateLink = async () => {
    await createPublicLink();
  };

  // Show eligibility message if presupuesto is not eligible
  if (!isEligibleForLink) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Link Público</h3>
          <p className="text-muted-foreground mt-1">
            Comparte este presupuesto sin necesidad de autenticación
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Share className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-2">
              Link no disponible
            </h4>
            <p className="text-sm text-muted-foreground">
              Los enlaces públicos están disponibles solo para presupuestos publicados, aprobados o facturados.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Estado actual: <span className="font-medium">{estadoPresupuesto}</span>
              {facturado && <span className="text-green-600 ml-2">• Facturado</span>}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground">Link Público</h3>
        <p className="text-muted-foreground mt-1">
          Comparte este presupuesto sin necesidad de autenticación
        </p>
      </div>

      {currentLink ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* URL Display */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-muted-foreground break-all">
                    {currentLink.link_url}
                  </code>
                </div>
              </div>

              {/* HubSpot Property Info */}
              {currentLink.hubspot_property && (
                <div className="text-xs text-muted-foreground">
                  Sincronizado con HubSpot en: <span className="font-mono">{currentLink.hubspot_property}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenLink}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateLink}
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Regenerar Link
                </Button>
              </div>

              {/* Access Count */}
              <div className="text-xs text-muted-foreground">
                Accesos: {currentLink.access_count || 0}
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
            <h4 className="font-medium text-foreground mb-2">
              {isLoading ? 'Cargando...' : 'Sin link público'}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoading 
                ? 'Verificando link existente...' 
                : 'Este presupuesto es elegible para un enlace público'
              }
            </p>
            
            {!isLoading && (
              <Button onClick={handleCreateLink} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Link
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PublicLinkManager;
