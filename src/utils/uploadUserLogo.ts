import { supabase } from '@/integrations/supabase/client';

export const uploadUserLogoToStorage = async () => {
  try {
    // Fetch the user's uploaded logo from lovable uploads
    const response = await fetch('/lovable-uploads/b16ff8b5-8054-444b-8e42-a0917b8c3978.png');
    if (!response.ok) {
      throw new Error(`Failed to fetch user logo: ${response.status}`);
    }
    
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

    console.log('User logo uploaded successfully:', data);
    return { success: true, path: data.path };
  } catch (error) {
    console.error('Failed to upload user logo:', error);
    throw error;
  }
};