import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';

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
      const canvas = await html2canvas(componentRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Configuración para usar todo el ancho disponible en A4
      const imgWidth = 180; // mm - usar más espacio de la página A4
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centrar horizontalmente con márgenes de 15mm
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