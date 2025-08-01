import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';
import { Presupuesto, Negocio } from '@/types';
import { createPresupuestoPDFDefinition } from '@/utils/pdfMakeDefinition';

// Use PDFMake default fonts (Roboto) - no configuration needed
// PDFMake comes with Roboto fonts by default

export const usePDFMakeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSelectablePDF = async (
    presupuesto: Presupuesto,
    negocio: Negocio,
    fileName: string = 'presupuesto'
  ) => {
    try {
      setIsGenerating(true);
      toast.info('Generando PDF...');

      console.log('=== PDF GENERATION START ===');
      console.log('Data received:', { presupuesto: !!presupuesto, negocio: !!negocio });

      // Simplify content - remove complex HTML
      const simplifiedPresupuesto = {
        ...presupuesto,
        productos: presupuesto.productos?.map(producto => ({
          ...producto,
          descripcion: producto.descripcion ? producto.descripcion.replace(/<[^>]*>/g, '').substring(0, 100) : ''
        })) || []
      };

      console.log('Simplified data created');

      // Create minimal PDF definition first
      const docDefinition = createPresupuestoPDFDefinition(simplifiedPresupuesto, negocio);
      console.log('PDF definition created successfully');

      // Try direct download method first
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        console.log('PDF generator created');
        
        // Method 1: Direct download
        pdfDocGenerator.download(`${fileName}.pdf`);
        console.log('Direct download initiated');
        toast.success('PDF descargado exitosamente');
        return true;
        
      } catch (directError) {
        console.warn('Direct download failed, trying open method:', directError);
        
        // Method 2: Open in new window
        try {
          const pdfDocGenerator = pdfMake.createPdf(docDefinition);
          pdfDocGenerator.open();
          console.log('PDF opened in new window');
          toast.success('PDF abierto en nueva ventana');
          return true;
        } catch (openError) {
          console.error('Open method also failed:', openError);
          throw new Error('No se pudo generar el PDF con los métodos disponibles');
        }
      }
      
    } catch (error) {
      console.error('=== PDF GENERATION ERROR ===', error);
      toast.error(`Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw error;
    } finally {
      setIsGenerating(false);
      console.log('=== PDF GENERATION END ===');
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