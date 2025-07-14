import React from 'react';
import { useParams } from 'react-router-dom';

const PublicPresupuestoPrintView: React.FC = () => {
  const { presupuestoName, negocioId, presupuestoId } = useParams<{ 
    presupuestoName: string; 
    negocioId: string; 
    presupuestoId: string 
  }>();

  // Debug: Simple test first
  console.log('[PublicPresupuestoPrintView] Route working! Params:', { 
    presupuestoName, 
    negocioId, 
    presupuestoId 
  });

  // Temporary simple version for testing
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Vista Pública de Presupuesto - Funcionando!</h1>
        <div className="space-y-2">
          <p><strong>Nombre del Presupuesto:</strong> {presupuestoName}</p>
          <p><strong>ID del Negocio:</strong> {negocioId}</p>
          <p><strong>ID del Presupuesto:</strong> {presupuestoId}</p>
        </div>
        <div className="mt-6">
          <p className="text-green-600">✅ La ruta pública está funcionando correctamente</p>
          <p className="text-sm text-gray-600 mt-2">Este es un componente simplificado para confirmar que la ruta funciona</p>
        </div>
      </div>
    </div>
  );
};

export default PublicPresupuestoPrintView;