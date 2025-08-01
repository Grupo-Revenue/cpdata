import { supabase } from '@/integrations/supabase/client';

export const initializeBrandLogo = async () => {
  try {
    // Check if logo already exists
    const { data: config } = await supabase
      .from('configuracion_marca')
      .select('id, logo_url')
      .single();

    if (config?.logo_url && config.logo_url.includes('logo.png')) {
      console.log('Brand logo already initialized');
      return { success: true, message: 'Logo already exists' };
    }

    // For now, just update the database to point to logo.png
    // The actual file upload will be done manually or through the UI
    const { error } = await supabase
      .from('configuracion_marca')
      .update({ 
        logo_url: 'logo.png',
        updated_at: new Date().toISOString() 
      })
      .eq('id', config?.id || (await supabase.from('configuracion_marca').select('id').single()).data?.id);

    if (error) {
      console.error('Error updating logo path:', error);
      throw error;
    }

    console.log('Brand logo path updated to local storage');
    return { success: true, message: 'Logo path updated' };
  } catch (error) {
    console.error('Failed to initialize brand logo:', error);
    throw error;
  }
};