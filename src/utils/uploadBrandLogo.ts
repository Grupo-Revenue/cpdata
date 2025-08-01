import { supabase } from '@/integrations/supabase/client';

export const uploadCPDataLogo = async () => {
  try {
    // Fetch the generated logo from the assets folder
    const response = await fetch('/src/assets/cpdata-logo.png');
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload('logo.png', blob, { 
        upsert: true,
        contentType: 'image/png'
      });

    if (error) {
      console.error('Error uploading logo to storage:', error);
      throw error;
    }

    // Update the database
    const { error: dbError } = await supabase
      .from('configuracion_marca')
      .update({ 
        logo_url: 'logo.png',
        updated_at: new Date().toISOString() 
      })
      .eq('id', (await supabase.from('configuracion_marca').select('id').limit(1).single()).data?.id);

    if (dbError) {
      console.error('Error updating database:', dbError);
      throw dbError;
    }

    console.log('Logo uploaded successfully:', data);
    return { success: true, path: data.path };
  } catch (error) {
    console.error('Failed to upload CP Data logo:', error);
    throw error;
  }
};