import React from 'react';
import { useParams } from 'react-router-dom';

const PublicPresupuestoPrintView: React.FC = () => {
  const { presupuestoName, negocioId, presupuestoId } = useParams<{ 
    presupuestoName: string; 
    negocioId: string; 
    presupuestoId: string 
  }>();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      padding: '32px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '16px',
          color: '#111827'
        }}>
          ✅ COMPONENTE PÚBLICO ACTUALIZADO Y FUNCIONANDO
        </h1>
        
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#059669', fontWeight: '600', fontSize: '18px' }}>
            ✅ El componente público se está renderizando correctamente
          </p>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Esto confirma que la ruta pública NO está siendo interceptada por las rutas protegidas
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#f9fafb', 
          padding: '16px', 
          borderRadius: '6px',
          marginTop: '16px'
        }}>
          <h3 style={{ color: '#374151', fontWeight: 'bold', marginBottom: '12px' }}>
            Parámetros de la URL:
          </h3>
          <div style={{ color: '#374151' }}>
            <p><strong>Nombre del Presupuesto:</strong> {presupuestoName}</p>
            <p><strong>ID del Negocio:</strong> {negocioId}</p>
            <p><strong>ID del Presupuesto:</strong> {presupuestoId}</p>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#ecfdf5', 
          padding: '16px', 
          borderRadius: '6px',
          marginTop: '16px',
          border: '1px solid #d1fae5'
        }}>
          <p style={{ color: '#065f46', fontWeight: '500' }}>
            URL actual funcionando correctamente ✅
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPresupuestoPrintView;