import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';

export const usePDFDownload = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadPDF = async (
    fileName: string = 'presupuesto',
    options?: { scale?: number; jpegQuality?: number }
  ) => {
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
      const scale = options?.scale ?? 2; // lower scale to reduce size
      const jpegQuality = options?.jpegQuality ?? 0.72; // JPEG quality for good balance

      const canvas = await html2canvas(componentRef.current, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
        onclone: (doc) => {
          // Ocultar elementos no imprimibles si existen
          doc.querySelectorAll('.no-print').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        },
      });

      const pdf = new jsPDF('p', 'mm', 'a4', true);

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const horizontalPadding = 0;
      const verticalPadding = 0; // margen inferior reducido
      const imgWidth = pageWidth - horizontalPadding * 2;
      const usableHeight = pageHeight - verticalPadding * 2;

      // Conversión de px a mm para ajustar slices a páginas
      const pxToMm = imgWidth / canvas.width; // mm por px
      const pageHeightPx = Math.floor(usableHeight / pxToMm); // alto por página en px

      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - currentY);

        // Crear canvas para el slice de la página
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const sliceCtx = sliceCanvas.getContext('2d');
        if (!sliceCtx) throw new Error('No se pudo crear el contexto del canvas');

        sliceCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        // Convertir a JPEG con calidad controlada
        const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', jpegQuality);

        if (pageIndex > 0) pdf.addPage();

        const sliceHeightMm = sliceHeightPx * pxToMm;
        const marginLeft = (pageWidth - imgWidth) / 2;

        pdf.addImage(
          sliceDataUrl,
          'JPEG',
          marginLeft,
          verticalPadding,
          imgWidth,
          sliceHeightMm,
          undefined,
          'FAST'
        );

        currentY += sliceHeightPx;
        pageIndex += 1;
      }

      pdf.save(`${fileName}.pdf`);

      toast({
        title: 'PDF descargado',
        description: 'El archivo PDF se ha descargado correctamente y optimizado.',
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
