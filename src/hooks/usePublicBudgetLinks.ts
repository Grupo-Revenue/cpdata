import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublicBudgetLink {
  id: string;
  presupuesto_id: string;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  access_count: number;
  created_at: string;
  updated_at: string;
}

export const usePublicBudgetLinks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePublicLink = async (presupuestoId: string, expiresInDays?: number) => {
    setIsLoading(true);
    try {
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Get presupuesto name for URL
      const { data: presupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .select('nombre')
        .eq('id', presupuestoId)
        .single();

      if (presupuestoError) throw presupuestoError;

      const { data, error } = await supabase
        .from('public_budget_links')
        .insert({
          presupuesto_id: presupuestoId,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      // Create URL with presupuesto name
      const presupuestoName = presupuesto.nombre.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const publicUrl = `${window.location.origin}/public/presupuesto/${presupuestoName}/${data.id}.pdf`;
      
      toast({
        title: "Link público generado",
        description: "El link ha sido copiado al portapapeles",
      });

      // Copy to clipboard
      navigator.clipboard.writeText(publicUrl);

      return { link: data, url: publicUrl };
    } catch (error) {
      console.error('Error generating public link:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el link público",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPublicLinks = async (presupuestoId: string): Promise<PublicBudgetLink[]> => {
    try {
      const { data, error } = await supabase
        .from('public_budget_links')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching public links:', error);
      return [];
    }
  };

  const deactivateLink = async (linkId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('public_budget_links')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: "Link desactivado",
        description: "El link público ha sido desactivado",
      });
    } catch (error) {
      console.error('Error deactivating link:', error);
      toast({
        title: "Error",
        description: "No se pudo desactivar el link",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLink = async (linkId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('public_budget_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: "Link eliminado",
        description: "El link público ha sido eliminado",
      });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el link",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePublicLink,
    getPublicLinks,
    deactivateLink,
    deleteLink,
    isLoading
  };
};