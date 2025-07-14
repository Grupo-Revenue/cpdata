import React from 'react';
import { useParams } from 'react-router-dom';
import { usePublicBudgetData } from '@/hooks/usePublicBudgetData';
import PresupuestoPDFTemplate from '@/components/pdf/PresupuestoPDFTemplate';

const PublicPresupuestoPrintView: React.FC = () => {
  const { presupuestoName, negocioId, presupuestoId } = useParams<{ 
    presupuestoName?: string; 
    negocioId: string; 
    presupuestoId: string 
  }>();

  const { presupuesto, negocio, loading, error } = usePublicBudgetData(negocioId!, presupuestoId!);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center' as const
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !presupuesto || !negocio) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center' as const,
          maxWidth: '400px'
        }}>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            color: '#dc2626'
          }}>
            Presupuesto no encontrado
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            {error || 'El presupuesto no existe o no está disponible públicamente.'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Verifica que el enlace sea correcto y que el presupuesto esté publicado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6'
    }}>
      <PresupuestoPDFTemplate presupuesto={presupuesto} negocio={negocio} />
    </div>
  );
};

export default PublicPresupuestoPrintView;