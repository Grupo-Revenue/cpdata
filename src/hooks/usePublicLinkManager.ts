
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
      console.log('🔍 [usePublicLinkManager] Searching for existing link:', { presupuestoId });
      
      const { data, error } = await supabase
        .from('public_budget_links')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ [usePublicLinkManager] Error fetching existing link:', error);
        return null;
      }

      if (data) {
        console.log('✅ [usePublicLinkManager] Found existing link:', data.id);
        // Always use the correct URL format for the current environment
        const updatedLink = {
          ...data,
          link_url: `${window.location.origin}/presupuesto/${negocioId}/${presupuestoId}/view`
        } as PublicLink;
        setCurrentLink(updatedLink);
        return updatedLink;
      }

      console.log('ℹ️ [usePublicLinkManager] No existing link found');
      return null;
    } catch (error) {
      console.error('❌ [usePublicLinkManager] Error getting existing link:', error);
      return null;
    }
  };

  const createPublicLink = async (): Promise<PublicLink | null> => {
    setIsLoading(true);
    try {
      console.log('🔗 [usePublicLinkManager] Creating public link for presupuesto:', presupuestoId);

      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: {
          presupuesto_id: presupuestoId,
          negocio_id: negocioId,
          regenerate: false
        }
      });

      if (error) {
        console.error('❌ [usePublicLinkManager] Edge function error:', error);
        throw new Error(error.message || 'Error creating public link');
      }

      if (!data || !data.success) {
        console.error('❌ [usePublicLinkManager] Edge function returned failure:', data);
        throw new Error(data?.error || 'Failed to create public link');
      }

      const newLink = data.link;
      
      // Always set the correct URL format for the current environment
      const updatedLink = {
        ...newLink,
        link_url: `${window.location.origin}/presupuesto/${negocioId}/${presupuestoId}/view`
      } as PublicLink;
      
      setCurrentLink(updatedLink);

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

      console.log('✅ [usePublicLinkManager] Public link created successfully:', newLink);
      return updatedLink;

    } catch (error) {
      console.error('❌ [usePublicLinkManager] Error creating public link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el link público",
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
      console.log('🔄 [usePublicLinkManager] Regenerating public link for presupuesto:', presupuestoId);

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
      
      // Always set the correct URL format for the current environment
      const updatedLink = {
        ...newLink,
        link_url: `${window.location.origin}/presupuesto/${negocioId}/${presupuestoId}/view`
      } as PublicLink;
      
      setCurrentLink(updatedLink);

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

      console.log('✅ [usePublicLinkManager] Link regenerated successfully:', newLink);
      return updatedLink;

    } catch (error) {
      console.error('❌ [usePublicLinkManager] Error regenerating link:', error);
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
      console.log('🔄 [usePublicLinkManager] Syncing link from HubSpot for presupuesto:', presupuestoId);
      
      const { data, error } = await supabase.functions.invoke('hubspot-link-manager', {
        body: { 
          presupuesto_id: presupuestoId, 
          negocio_id: negocioId,
          sync_from_hubspot: true
        }
      });

      if (error) {
        console.error('❌ [usePublicLinkManager] Error syncing link from HubSpot:', error);
        return null;
      }

      if (data?.success && data?.link) {
        const syncedLink = data.link as PublicLink;
        // Always set the correct URL format for the current environment
        const updatedLink = {
          ...syncedLink,
          link_url: `${window.location.origin}/presupuesto/${negocioId}/${presupuestoId}/view`
        } as PublicLink;
        
        setCurrentLink(updatedLink);
        toast({
          title: "Enlace sincronizado",
          description: "El enlace ha sido recuperado desde HubSpot",
        });
        console.log('✅ [usePublicLinkManager] Link synced from HubSpot successfully');
        return updatedLink;
      }
      
      console.log('ℹ️ [usePublicLinkManager] No link found in HubSpot');
      return null;
    } catch (error) {
      console.error('❌ [usePublicLinkManager] Error syncing link from HubSpot:', error);
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
