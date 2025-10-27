
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, ExternalLink } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';
import PresupuestoPDFTemplate from '@/components/pdf/PresupuestoPDFTemplate';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { usePDFDownload } from '@/hooks/usePDFDownload';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import PublicLinkDisplay from '@/components/presupuesto/PublicLinkDisplay';

const PresupuestoPDFView: React.FC = () => {
  const { negocioId, presupuestoId } = useParams<{ negocioId: string; presupuestoId: string }>();
  const navigate = useNavigate();
  const { obtenerNegocio, loading } = useNegocio();
  const { componentRef: printRef, generatePDF } = usePDFGeneration();
  const { componentRef: downloadRef, downloadPDF, isGenerating } = usePDFDownload();

  console.log('[PresupuestoPDFView] Params:', { negocioId, presupuestoId });

  if (!negocioId || !presupuestoId) {
    console.log('[PresupuestoPDFView] Missing params');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  const negocio = obtenerNegocio(negocioId);
  const presupuesto = negocio?.presupuestos.find(p => p.id === presupuestoId);

  console.log('[PresupuestoPDFView] Data:', { 
    negocio: negocio ? 'found' : 'not found', 
    presupuesto: presupuesto ? 'found' : 'not found',
    presupuestosCount: negocio?.presupuestos.length || 0,
    loading
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-gray-600">Cargando...</h1>
        </div>
      </div>
    );
  }

  if (!negocio || !presupuesto) {
    console.log('[PresupuestoPDFView] Data not found');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <p className="text-gray-600 mb-4">
            {!negocio ? 'Negocio no encontrado' : 'Presupuesto no encontrado'}
          </p>
          <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(`/negocio/${negocioId}`);
  };

  const handleDownloadPDF = () => {
    const fileName = `PPTO ${presupuesto.nombre}`;
    downloadPDF(fileName);
  };

  // Callback ref to set both refs to the same element
  const setRefs = (element: HTMLDivElement | null) => {
    if (printRef) printRef.current = element;
    if (downloadRef) downloadRef.current = element;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with actions */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Vista de Impresión - Presupuesto {presupuesto.nombre}
                </h1>
                <p className="text-gray-600">Negocio #{negocio.numero} - {negocio.evento.nombreEvento}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Link Público
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <PublicLinkDisplay 
                    presupuestoId={presupuestoId!} 
                    negocioId={negocioId!}
                    estadoPresupuesto={presupuesto.estado}
                  />
                </DialogContent>
              </Dialog>
              <Button 
                onClick={handleDownloadPDF} 
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
              </Button>
              <Button variant="outline" onClick={generatePDF}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="py-8">
        <div ref={setRefs}>
          <PresupuestoPDFTemplate
            presupuesto={presupuesto}
            negocio={negocio}
          />
        </div>
      </div>
    </div>
  );
};

export default PresupuestoPDFView;
