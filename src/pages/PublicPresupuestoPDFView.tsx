import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Printer, AlertCircle } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import PresupuestoPDFTemplate from '@/components/pdf/PresupuestoPDFTemplate';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetData {
  presupuesto: any;
  negocio: any;
}

const PublicPresupuestoPDFView: React.FC = () => {
  const { publicId, presupuestoName } = useParams<{ publicId: string; presupuestoName: string }>();
  const { componentRef, generatePDF } = usePDFGeneration();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!publicId) {
        setError('ID de link público no válido');
        setIsLoading(false);
        return;
      }

      try {
        // Call edge function using supabase client
        const { data, error: functionError } = await supabase.functions.invoke(
          'public-budget-pdf',
          {
            body: { publicId }
          }
        );

        if (functionError) {
          console.error('Edge function error:', functionError);
          setError(functionError.message || 'Error al cargar el presupuesto');
          return;
        }

        if (!data) {
          setError('No se encontraron datos del presupuesto');
          return;
        }

        setBudgetData(data);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar el presupuesto público');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetData();
  }, [publicId]);

  const handleDownload = () => {
    if (budgetData) {
      generatePDF();
    }
  };

  const handlePrint = () => {
    if (budgetData) {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!budgetData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              No se pudo cargar el presupuesto
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <div className="no-print sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {budgetData.presupuesto.nombre}
              </h1>
              <p className="text-sm text-muted-foreground">
                {budgetData.negocio.nombre_evento}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="container mx-auto px-4 py-8">
        <PresupuestoPDFTemplate
          ref={componentRef}
          presupuesto={budgetData.presupuesto}
          negocio={budgetData.negocio}
        />
      </div>
    </div>
  );
};

export default PublicPresupuestoPDFView;