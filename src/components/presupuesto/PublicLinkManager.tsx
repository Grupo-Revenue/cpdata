import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Share, Trash2, Eye, EyeOff, Plus, ExternalLink, Clock } from 'lucide-react';
import { usePublicBudgetLinks, PublicBudgetLink } from '@/hooks/usePublicBudgetLinks';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PublicLinkManagerProps {
  presupuestoId: string;
}

const PublicLinkManager: React.FC<PublicLinkManagerProps> = ({ presupuestoId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('never');
  const [publicLinks, setPublicLinks] = useState<PublicBudgetLink[]>([]);
  const { generatePublicLink, getPublicLinks, deactivateLink, deleteLink, isLoading } = usePublicBudgetLinks();
  const { toast } = useToast();

  const loadPublicLinks = async () => {
    const links = await getPublicLinks(presupuestoId);
    setPublicLinks(links);
  };

  useEffect(() => {
    loadPublicLinks();
  }, [presupuestoId]);

  const handleCreateLink = async () => {
    try {
      const expDays = expirationDays === 'never' ? undefined : parseInt(expirationDays);
      await generatePublicLink(presupuestoId, expDays);
      
      setIsCreateDialogOpen(false);
      loadPublicLinks();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleCopyLink = async (linkId: string) => {
    try {
      // Get negocio ID from presupuesto
      const { data: presupuesto, error } = await supabase
        .from('presupuestos')
        .select('negocio_id')
        .eq('id', presupuestoId)
        .single();

      if (error || !presupuesto) {
        throw new Error('No se pudo obtener la información del presupuesto');
      }

      const publicUrl = `${window.location.origin}/public/presupuesto/${presupuesto.negocio_id}/${presupuestoId}/view`;
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link copiado",
        description: "El link ha sido copiado al portapapeles",
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

  const handleDeactivateLink = async (linkId: string) => {
    try {
      await deactivateLink(linkId);
      loadPublicLinks();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink(linkId);
      loadPublicLinks();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const getStatusBadge = (link: PublicBudgetLink) => {
    if (!link.is_active) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge variant="default">Activo</Badge>;
  };

  const getExpirationText = (expiresAt: string | null) => {
    if (!expiresAt) return 'Sin expiración';
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (expirationDate < now) {
      return `Expiró ${formatDistanceToNow(expirationDate, { addSuffix: true, locale: es })}`;
    }
    
    return `Expira ${formatDistanceToNow(expirationDate, { addSuffix: true, locale: es })}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Links Públicos</h3>
            <p className="text-muted-foreground mt-1">
              Comparte este presupuesto sin necesidad de autenticación
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" size="default">
                <Plus className="h-4 w-4" />
                Crear Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Crear Link Público</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Expiración (opcional)
                  </label>
                  <Select value={expirationDays} onValueChange={setExpirationDays}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar expiración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Sin expiración</SelectItem>
                      <SelectItem value="1">1 día</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLink} disabled={isLoading}>
                    {isLoading ? 'Creando...' : 'Crear Link'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {publicLinks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Share className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-foreground mb-2">No hay links públicos</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Crea un link público para compartir este presupuesto con clientes externos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {publicLinks.map((link) => {
              const fullUrl = `${window.location.origin}/public/presupuesto/${presupuestoId}/view`;
              const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
              const canInteract = link.is_active && !isExpired;
              
              return (
                <Card key={link.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Status and Stats Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(link)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{link.access_count} accesos</span>
                          </div>
                          {link.expires_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{getExpirationText(link.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* URL Display */}
                      <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-foreground break-all">
                            {fullUrl}
                          </code>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCopyLink(link.id)}
                              disabled={!canInteract}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copiar Link
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {!canInteract ? 'Link no disponible' : 'Copiar al portapapeles'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { data: presupuesto, error } = await supabase
                                    .from('presupuestos')
                                    .select('negocio_id')
                                    .eq('id', presupuestoId)
                                    .single();

                                  if (error || !presupuesto) {
                                    throw new Error('No se pudo obtener la información del presupuesto');
                                  }

                                  window.open(`/public/presupuesto/${presupuesto.negocio_id}/${presupuestoId}/view`, '_blank');
                                } catch (error) {
                                  console.error('Error opening link:', error);
                                  toast({
                                    title: "Error",
                                    description: "No se pudo abrir el link",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              disabled={!canInteract}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Abrir
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Abrir en nueva pestaña
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex-1" />

                        {link.is_active ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeactivateLink(link.id)}
                                disabled={isLoading}
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Desactivar link
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLink(link.id)}
                                disabled={isLoading}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Eliminar permanentemente
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PublicLinkManager;