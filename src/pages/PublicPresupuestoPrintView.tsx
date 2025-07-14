const PublicPresupuestoPrintView = () => {
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
          🎯 RUTA PÚBLICA FUNCIONANDO
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
          <p style={{ color: '#374151', fontWeight: '500' }}>
            URL de prueba funcionando: /public/presupuesto/17704a/19fd6e99-2e0e-4484-904e-4dc98769fd66/8ffa4887-cad9-4645-b25a-ea040adbf677/view
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicPresupuestoPrintView;