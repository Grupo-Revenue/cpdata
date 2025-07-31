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
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Capture the component as canvas
      const canvas = await html2canvas(componentRef.current, {
        scale: 4, // Maximum quality for larger text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Calculate PDF dimensions (A4 size) - optimized for much larger content
      const imgWidth = 160; // Smaller width for bigger content scaling
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`${fileName}.pdf`);

      toast({
        title: "PDF descargado",
        description: "El archivo PDF se ha descargado correctamente.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error al generar PDF",
        description: "No se pudo generar el PDF. Intenta nuevamente.",
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