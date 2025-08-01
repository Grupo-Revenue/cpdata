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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        width: 1000,
        height: componentRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Use same margins as print view (0.5in = 12.7mm)
      const horizontalMargin = 12.7;
      const verticalMargin = 12.7;
      const imgWidth = pageWidth - (horizontalMargin * 2);
      const usableHeight = pageHeight - (verticalMargin * 2);

      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginLeft = horizontalMargin;

      let position = 0;
      let heightLeft = imgHeight;

      pdf.addImage(imgData, 'PNG', marginLeft, verticalMargin, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + verticalMargin * 2;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', marginLeft, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
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
