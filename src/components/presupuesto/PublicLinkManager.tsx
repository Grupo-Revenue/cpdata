import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Share, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { usePublicBudgetLinks, PublicBudgetLink } from '@/hooks/usePublicBudgetLinks';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PublicLinkManagerProps {
  presupuestoId: string;
}

const PublicLinkManager: React.FC<PublicLinkManagerProps> = ({ presupuestoId }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expirationDays, setExpirationDays] = useState<string>('');
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
      const expiresInDays = expirationDays ? parseInt(expirationDays) : undefined;
      await generatePublicLink(presupuestoId, expiresInDays);
      setIsCreateDialogOpen(false);
      setExpirationDays('');
      loadPublicLinks();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleCopyLink = (linkId: string) => {
    const url = `${window.location.origin}/public/presupuesto/${linkId}/pdf`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "El link ha sido copiado al portapapeles",
    });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Links Públicos</h3>
          <p className="text-sm text-muted-foreground">
            Comparte este presupuesto sin necesidad de autenticación
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Link Público</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Expiración (opcional)</label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar expiración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin expiración</SelectItem>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
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
        <Card>
          <CardContent className="py-8 text-center">
            <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay links públicos creados</p>
            <p className="text-sm text-muted-foreground">
              Crea un link para compartir este presupuesto
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {publicLinks.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(link)}
                      <span className="text-sm text-muted-foreground">
                        {link.access_count} accesos
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {`${window.location.origin}/public/presupuesto/${link.id}/pdf`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getExpirationText(link.expires_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(link.id)}
                      disabled={!link.is_active}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    
                    {link.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivateLink(link.id)}
                        disabled={isLoading}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicLinkManager;