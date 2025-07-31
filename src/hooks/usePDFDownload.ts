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
        scale: 3, // Higher quality for larger text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Calculate PDF dimensions (A4 size) - optimized for larger content
      const imgWidth = 200; // Use more of the A4 width for larger content
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF with optimized margins
      const pdf = new jsPDF('p', 'mm', 'a4');
      const marginLeft = 5; // Small left margin to center content
      let position = 10; // Small top margin

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginLeft, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginLeft, position, imgWidth, imgHeight);
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