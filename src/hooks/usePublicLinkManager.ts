import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublicLink {
  id: string;
  presupuesto_id: string;
  negocio_id: string;
  link_url: string;
  hubspot_property: string | null;
  is_active: boolean;
  access_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  expires_at: string | null;
}

interface UsePublicLinkManagerProps {
  presupuestoId: string;
  negocioId: string;
}

export const usePublicLinkManager = ({ presupuestoId, negocioId }: UsePublicLinkManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLink, setCurrentLink] = useState<PublicLink | null>(null);
  const { toast } = useToast();

  const getExistingLink = async (): Promise<PublicLink | null> => {
    try {
      const { data, error } = await supabase
        .from('public_budget_links')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching existing link:', error);
        return null;
      }

      setCurrentLink(data as PublicLink);
      return data as PublicLink;
    } catch (error) {
      console.error('Error getting existing link:', error);
      return null;
    }
  };

  const createPublicLink = async (): Promise<PublicLink | null> => {
    setIsLoading(true);
    try {
      console.log('🔗 Creating public link for presupuesto:', presupuestoId);

      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: {
          presupuesto_id: presupuestoId,
          negocio_id: negocioId,
          regenerate: false
        }
      });

      if (error) {
        throw new Error(error.message || 'Error creating public link');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create public link');
      }

      const newLink = data.link;
      setCurrentLink(newLink);

      // Show success message, with warning if HubSpot failed
      if (data.hubspot_updated) {
        toast({
          title: "Link público creado",
          description: `Link creado y sincronizado con HubSpot en ${data.hubspot_property}`,
        });
      } else {
        toast({
          title: "Link público creado",
          description: "Link creado localmente. Sincronización con HubSpot falló.",
          variant: "destructive",
        });
      }

      console.log('✅ Public link created successfully:', newLink);
      return newLink;

    } catch (error) {
      console.error('❌ Error creating public link:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el link público",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateLink = async (): Promise<PublicLink | null> => {
    if (!currentLink) {
      return await createPublicLink();
    }

    setIsLoading(true);
    try {
      console.log('🔄 Regenerating public link for presupuesto:', presupuestoId);

      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: {
          presupuesto_id: presupuestoId,
          negocio_id: negocioId,
          regenerate: true,
          existing_property: currentLink.hubspot_property
        }
      });

      if (error) {
        throw new Error(error.message || 'Error regenerating link');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to regenerate link');
      }

      const newLink = data.link;
      setCurrentLink(newLink);

      // Show success message, with warning if HubSpot failed
      if (data.hubspot_updated) {
        toast({
          title: "Link regenerado",
          description: `Nuevo link creado y actualizado en HubSpot`,
        });
      } else {
        toast({
          title: "Link regenerado",
          description: "Nuevo link creado localmente. Sincronización con HubSpot falló.",
          variant: "destructive",
        });
      }

      console.log('✅ Link regenerated successfully:', newLink);
      return newLink;

    } catch (error) {
      console.error('❌ Error regenerating link:', error);
      toast({
        title: "Error",
        description: "No se pudo regenerar el link",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncLinkFromHubSpot = async (): Promise<PublicLink | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: { 
          presupuesto_id: presupuestoId, 
          negocio_id: negocioId,
          sync_from_hubspot: true
        }
      });

      if (error) {
        console.error('Error syncing link from HubSpot:', error);
        return null;
      }

      const syncedLink = data?.link as PublicLink;
      if (syncedLink) {
        setCurrentLink(syncedLink);
        toast({
          title: "Enlace sincronizado",
          description: "El enlace ha sido recuperado desde HubSpot",
        });
      }
      
      return syncedLink;
    } catch (error) {
      console.error('Error syncing link from HubSpot:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentLink,
    isLoading,
    getExistingLink,
    createPublicLink,
    regenerateLink,
    syncLinkFromHubSpot
  };
};