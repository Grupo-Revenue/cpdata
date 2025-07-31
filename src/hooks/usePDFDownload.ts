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
      // Capture the component as canvas with maximum quality
      const canvas = await html2canvas(componentRef.current, {
        scale: 4, // Maximum quality for crisp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Calculate PDF dimensions (A4 size) - force larger content scaling
      const imgWidth = 180; // Smaller width forces content to scale larger
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF with optimized margins for centering
      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4Width = 210; // A4 width in mm
      const marginLeft = (a4Width - imgWidth) / 2; // Center horizontally
      let position = 15; // Optimized top margin

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