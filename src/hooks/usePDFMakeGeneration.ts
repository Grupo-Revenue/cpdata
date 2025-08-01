import { useState } from 'react';
import pdfMake from 'pdfmake/build/pdfmake';
import { toast } from 'sonner';
import { Presupuesto, Negocio } from '@/types';
import { createPresupuestoPDFDefinition } from '@/utils/pdfMakeDefinition';

// Use default fonts - no external dependencies needed
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

      console.log('Creating PDF with data:', { presupuesto, negocio });

      // Create the PDF definition
      let docDefinition;
      try {
        docDefinition = createPresupuestoPDFDefinition(presupuesto, negocio);
        console.log('PDF Definition created successfully');
      } catch (defError) {
        console.error('Error creating PDF definition:', defError);
        throw new Error(`Error en la definición del PDF: ${defError.message}`);
      }

      // Generate PDF with enhanced error handling
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        // Use promise-based approach for better error handling
        return new Promise((resolve, reject) => {
          try {
            pdfDocGenerator.getBlob((blob: Blob) => {
              if (!blob || blob.size === 0) {
                reject(new Error('PDF blob is empty or invalid'));
                return;
              }
              
              console.log('PDF blob generated successfully, size:', blob.size);
              
              try {
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
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                toast.success('PDF descargado exitosamente');
                resolve(true);
              } catch (downloadError) {
                console.error('Error during download:', downloadError);
                reject(new Error(`Error al descargar: ${downloadError.message}`));
              }
            });
          } catch (blobError) {
            console.error('Error generating blob:', blobError);
            reject(new Error(`Error generando blob: ${blobError.message}`));
          }
        });
      } catch (pdfError) {
        console.error('Error creating PDF:', pdfError);
        throw new Error(`Error creando PDF: ${pdfError.message}`);
      }
      
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