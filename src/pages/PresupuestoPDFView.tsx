
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useNegocio } from '@/context/NegocioContext';
import PresupuestoPDFTemplate from '@/components/pdf/PresupuestoPDFTemplate';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';

const PresupuestoPDFView: React.FC = () => {
  const { negocioId, presupuestoId } = useParams<{ negocioId: string; presupuestoId: string }>();
  const navigate = useNavigate();
  const { obtenerNegocio } = useNegocio();
  const { componentRef, generatePDF } = usePDFGeneration();

  if (!negocioId || !presupuestoId) {
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

  if (!negocio || !presupuesto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <Button onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(`/negocio/${negocioId}`);
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
              <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
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
        <PresupuestoPDFTemplate
          ref={componentRef}
          presupuesto={presupuesto}
          negocio={negocio}
        />
      </div>
    </div>
  );
};

export default PresupuestoPDFView;
