import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';
import { Presupuesto, Negocio } from '@/types';
import { createPresupuestoPDFDefinition } from '@/utils/pdfMakeDefinition';

// Configure pdfMake with built-in fonts (no external dependencies)
pdfMake.fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

export const usePDFMakeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSelectablePDF = async (
    presupuesto: Presupuesto,
    negocio: Negocio,
    fileName: string = 'presupuesto'
  ) => {
    try {
      setIsGenerating(true);
      toast.info('Generando PDF con texto seleccionable...');

      console.log('Creating PDF with data:', { presupuesto, negocio });

      // Create the PDF definition
      const docDefinition = createPresupuestoPDFDefinition(presupuesto, negocio);
      console.log('PDF Definition created:', docDefinition);

      // Generate and download the PDF using blob method
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      // Use getBlob method for more reliable download
      pdfDocGenerator.getBlob((blob: Blob) => {
        console.log('PDF blob generated:', blob);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.pdf`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        toast.success('PDF descargado exitosamente');
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const printSelectablePDF = async (presupuesto: Presupuesto, negocio: Negocio) => {
    try {
      setIsGenerating(true);
      toast.info('Preparando documento para imprimir...');

      const docDefinition = createPresupuestoPDFDefinition(presupuesto, negocio);
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      pdfDocGenerator.print();
      
      toast.success('Documento enviado a impresora');
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast.error('Error al imprimir el documento');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSelectablePDF,
    printSelectablePDF,
    isGenerating,
  };
};