export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

export const preloadImagesAsBase64 = async (imageUrls: string[]): Promise<Record<string, string>> => {
  const base64Images: Record<string, string> = {};
  
  await Promise.allSettled(
    imageUrls.map(async (url) => {
      try {
        const base64 = await convertImageToBase64(url);
        base64Images[url] = base64;
      } catch (error) {
        console.warn(`Failed to convert image ${url} to base64:`, error);
      }
    })
  );
  
  return base64Images;
};