
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Eye, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublicLinkManager } from '@/hooks/usePublicLinkManager';

interface PublicLinkDisplayProps {
  presupuestoId: string;
  negocioId: string;
  estadoPresupuesto: string;
  facturado?: boolean;
}

const PublicLinkDisplay: React.FC<PublicLinkDisplayProps> = ({ 
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
    syncLinkFromHubSpot
  } = usePublicLinkManager({ presupuestoId, negocioId });

  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Determine if the presupuesto is eligible for public links
  const isEligibleForLink = estadoPresupuesto === 'publicado' || 
                           estadoPresupuesto === 'aprobado' || 
                           facturado;

  useEffect(() => {
    const loadOrCreateLink = async () => {
      console.log('🔗 [PublicLinkDisplay] Loading link for:', { presupuestoId, estadoPresupuesto, facturado, isEligible: isEligibleForLink });
      
      const existingLink = await getExistingLink();
      
      // Si el presupuesto es elegible pero no tiene link, intentar crear uno automáticamente
      if (!existingLink && isEligibleForLink) {
        console.log('🔗 [PublicLinkDisplay] No existing link found, attempting to create for eligible presupuesto');
        
        // Primero intentar sincronizar desde HubSpot
        const syncedLink = await syncLinkFromHubSpot();
        
        // Si no se pudo sincronizar, crear uno nuevo automáticamente
        if (!syncedLink) {
          console.log('🔗 [PublicLinkDisplay] No synced link, creating new one automatically');
          await createPublicLink();
        }
      }
    };
    
    loadOrCreateLink();
  }, [presupuestoId, negocioId, estadoPresupuesto, facturado, isEligibleForLink]);

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

  const handleCreateLink = async () => {
    setIsCreatingLink(true);
    try {
      await createPublicLink();
      toast({
        title: "Link creado",
        description: "El enlace público ha sido creado exitosamente.",
      });
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el enlace público.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleSyncFromHubSpot = async () => {
    try {
      const syncedLink = await syncLinkFromHubSpot();
      if (syncedLink) {
        toast({
          title: "Link sincronizado",
          description: "El enlace ha sido recuperado desde HubSpot.",
        });
      } else {
        toast({
          title: "No encontrado",
          description: "No se encontró un enlace en HubSpot para este presupuesto.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing from HubSpot:', error);
      toast({
        title: "Error",
        description: "No se pudo sincronizar desde HubSpot.",
        variant: "destructive",
      });
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

  // Show different content based on presupuesto status and link availability
  if (!isEligibleForLink) {
    return (
      <div className="text-center py-8">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Link no disponible</h3>
        <p className="text-muted-foreground">
          Los enlaces públicos están disponibles solo para presupuestos publicados, aprobados o facturados.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Estado actual: <span className="font-medium">{estadoPresupuesto}</span>
          {facturado && <span className="text-green-600 ml-2">• Facturado</span>}
        </p>
      </div>
    );
  }

  if (!currentLink) {
    return (
      <div className="text-center py-8">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sin enlace público</h3>
        <p className="text-muted-foreground mb-4">
          Este presupuesto es elegible para un enlace público pero no tiene uno creado.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={handleCreateLink}
            disabled={isCreatingLink}
            className="flex items-center gap-2"
          >
            {isCreatingLink ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreatingLink ? 'Creando...' : 'Crear Link'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSyncFromHubSpot}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar desde HubSpot
          </Button>
        </div>
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

        {currentLink.hubspot_property && (
          <div className="text-xs text-muted-foreground">
            Sincronizado con HubSpot: <span className="font-mono">{currentLink.hubspot_property}</span>
          </div>
        )}

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
