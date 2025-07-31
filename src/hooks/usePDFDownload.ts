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
      // Escalar al tamaño A4 completo (2480 px de ancho)
      const targetWidth = 2480;
      const elementWidth = componentRef.current.offsetWidth;
      const scale = targetWidth / elementWidth;

      const canvas = await html2canvas(componentRef.current, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
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
