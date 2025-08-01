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
        console.log('Creating PDF with pdfMake...');
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        // Use promise-based approach for better error handling
        return new Promise((resolve, reject) => {
          try {
            console.log('Getting PDF blob...');
            pdfDocGenerator.getBlob((blob: Blob) => {
              console.log('Blob received:', blob ? `${blob.size} bytes` : 'null');
              
              if (!blob || blob.size === 0) {
                console.error('PDF blob is empty or null');
                reject(new Error('No se pudo generar el PDF. El archivo está vacío.'));
                return;
              }
              
              console.log('PDF blob generated successfully, size:', blob.size);
              
              try {
                // Try multiple download methods for better compatibility
                const downloadMethods = [
                  () => {
                    // Method 1: Standard blob download
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${fileName}.pdf`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  },
                  () => {
                    // Method 2: Window.open fallback
                    const url = URL.createObjectURL(blob);
                    const newWindow = window.open(url, '_blank');
                    if (!newWindow) {
                      throw new Error('Popup blocked - please allow popups for download');
                    }
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                  }
                ];

                // Try first method, if it fails, try second
                try {
                  downloadMethods[0]();
                  toast.success('PDF descargado exitosamente');
                  resolve(true);
                } catch (downloadError) {
                  console.warn('Primary download method failed, trying fallback:', downloadError);
                  try {
                    downloadMethods[1]();
                    toast.success('PDF abierto en nueva ventana');
                    resolve(true);
                  } catch (fallbackError) {
                    console.error('All download methods failed:', fallbackError);
                    reject(new Error('No se pudo descargar el PDF. Por favor intenta con otro navegador.'));
                  }
                }
              } catch (downloadError) {
                console.error('Error during download setup:', downloadError);
                reject(new Error(`Error al preparar descarga: ${downloadError.message}`));
              }
            });
          } catch (blobError) {
            console.error('Error in getBlob call:', blobError);
            reject(new Error(`Error al solicitar PDF: ${blobError.message}`));
          }
        });
      } catch (pdfError) {
        console.error('Error creating PDF:', pdfError);
        throw new Error(`Error inicializando PDF: ${pdfError.message}`);
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