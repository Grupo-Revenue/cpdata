import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';
import { Presupuesto, Negocio } from '@/types';
import { createPresupuestoPDFDefinition } from '@/utils/pdfMakeDefinition';

// Configure pdfMake fonts with default Helvetica
pdfMake.fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
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

      // Create the PDF definition
      const docDefinition = createPresupuestoPDFDefinition(presupuesto, negocio);

      // Generate and download the PDF
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      pdfDocGenerator.download(`${fileName}.pdf`);
      
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
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