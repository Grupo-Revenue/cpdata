import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { usePublicBudgetData } from '@/hooks/usePublicBudgetData';
import PresupuestoPDFTemplate from '@/components/pdf/PresupuestoPDFTemplate';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';

const PublicPresupuestoPrintView: React.FC = () => {
  const { negocioId, presupuestoId } = useParams<{ negocioId: string; presupuestoId: string }>();
  const { presupuesto, negocio, loading, error } = usePublicBudgetData(negocioId!, presupuestoId!);
  const { componentRef, generatePDF } = usePDFGeneration();

  console.log('[PublicPresupuestoPrintView] Params:', { negocioId, presupuestoId });
  console.log('[PublicPresupuestoPrintView] Data:', { 
    presupuesto: presupuesto ? 'found' : 'not found', 
    negocio: negocio ? 'found' : 'not found',
    loading,
    error
  });

  if (!negocioId || !presupuestoId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <p className="text-gray-600">Los parámetros del presupuesto son inválidos</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl text-gray-600">Cargando...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!negocio || !presupuesto) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Presupuesto no encontrado</h1>
          <p className="text-gray-600">
            {!negocio ? 'Negocio no encontrado' : 'Presupuesto no encontrado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with actions - without Back and Share buttons */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Presupuesto {presupuesto.nombre}
              </h1>
              <p className="text-gray-600">Negocio #{negocio.numero} - {negocio.evento.nombreEvento}</p>
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

export default PublicPresupuestoPrintView;