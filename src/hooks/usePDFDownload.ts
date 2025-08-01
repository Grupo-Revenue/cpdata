import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { preloadImagesAsBase64 } from '@/utils/imageUtils';

export const usePDFDownload = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async (fileName: string = 'presupuesto') => {
    if (!componentRef.current) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el PDF. Intenta nuevamente.',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Pre-cargar todas las imágenes como base64
      const images = componentRef.current.querySelectorAll('img');
      const imageUrls = Array.from(images)
        .map(img => img.src)
        .filter(src => src && src.startsWith('http'));
      
      if (imageUrls.length > 0) {
        const base64Images = await preloadImagesAsBase64(imageUrls);
        
        // Reemplazar las URLs de las imágenes con sus versiones base64
        images.forEach(img => {
          if (base64Images[img.src]) {
            img.src = base64Images[img.src];
          }
        });
        
        // Esperar un momento para que las imágenes se actualicen en el DOM
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const canvas = await html2canvas(componentRef.current, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Configuración para mayor zoom visual
      const imgWidth = 140; // mm - reducido para mayor zoom
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centrar horizontalmente
      const marginLeft = (pageWidth - imgWidth) / 2;
      
      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${fileName}.pdf`);

      toast({
        title: 'PDF descargado',
        description: 'El archivo PDF se ha descargado correctamente.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: 'destructive',
        title: 'Error al generar PDF',
        description: 'No se pudo generar el PDF. Intenta nuevamente.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    componentRef,
    downloadPDF,
    isGenerating,
  };
};