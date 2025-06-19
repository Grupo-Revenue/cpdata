
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Negocio, Presupuesto, ProductoPresupuesto } from '@/types';

interface NegocioContextType {
  negocios: Negocio[];
  contadorNegocio: number;
  crearNegocio: (negocio: Omit<Negocio, 'id' | 'numero' | 'presupuestos' | 'fechaCreacion' | 'estado'>) => string;
  obtenerNegocio: (id: string) => Negocio | undefined;
  crearPresupuesto: (negocioId: string, productos: ProductoPresupuesto[]) => string;
  actualizarPresupuesto: (negocioId: string, presupuestoId: string, productos: ProductoPresupuesto[]) => void;
  eliminarPresupuesto: (negocioId: string, presupuestoId: string) => void;
}

const NegocioContext = createContext<NegocioContextType | undefined>(undefined);

export const useNegocio = () => {
  const context = useContext(NegocioContext);
  if (!context) {
    throw new Error('useNegocio debe ser usado dentro de un NegocioProvider');
  }
  return context;
};

interface NegocioProviderProps {
  children: ReactNode;
}

export const NegocioProvider: React.FC<NegocioProviderProps> = ({ children }) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [contadorNegocio, setContadorNegocio] = useState(17658);

  const crearNegocio = (negocioData: Omit<Negocio, 'id' | 'numero' | 'presupuestos' | 'fechaCreacion' | 'estado'>): string => {
    const id = `negocio-${Date.now()}`;
    const numero = contadorNegocio;
    
    const nuevoNegocio: Negocio = {
      id,
      numero,
      ...negocioData,
      presupuestos: [],
      fechaCreacion: new Date().toISOString(),
      estado: 'activo'
    };

    setNegocios(prev => [...prev, nuevoNegocio]);
    setContadorNegocio(prev => prev + 1);
    
    return id;
  };

  const obtenerNegocio = (id: string): Negocio | undefined => {
    return negocios.find(negocio => negocio.id === id);
  };

  const generarNombrePresupuesto = (numero: number, cantidadPresupuestos: number): string => {
    const letra = String.fromCharCode(65 + cantidadPresupuestos); // A, B, C, etc.
    return `${numero}${letra}`;
  };

  const crearPresupuesto = (negocioId: string, productos: ProductoPresupuesto[]): string => {
    const presupuestoId = `presupuesto-${Date.now()}`;
    
    setNegocios(prev => prev.map(negocio => {
      if (negocio.id === negocioId) {
        const nombrePresupuesto = generarNombrePresupuesto(negocio.numero, negocio.presupuestos.length);
        const total = productos.reduce((sum, producto) => sum + producto.total, 0);
        
        const nuevoPresupuesto: Presupuesto = {
          id: presupuestoId,
          nombre: nombrePresupuesto,
          productos,
          total,
          fechaCreacion: new Date().toISOString(),
          estado: 'borrador'
        };

        return {
          ...negocio,
          presupuestos: [...negocio.presupuestos, nuevoPresupuesto]
        };
      }
      return negocio;
    }));

    return presupuestoId;
  };

  const actualizarPresupuesto = (negocioId: string, presupuestoId: string, productos: ProductoPresupuesto[]) => {
    setNegocios(prev => prev.map(negocio => {
      if (negocio.id === negocioId) {
        return {
          ...negocio,
          presupuestos: negocio.presupuestos.map(presupuesto => {
            if (presupuesto.id === presupuestoId) {
              const total = productos.reduce((sum, producto) => sum + producto.total, 0);
              return {
                ...presupuesto,
                productos,
                total
              };
            }
            return presupuesto;
          })
        };
      }
      return negocio;
    }));
  };

  const eliminarPresupuesto = (negocioId: string, presupuestoId: string) => {
    setNegocios(prev => prev.map(negocio => {
      if (negocio.id === negocioId) {
        return {
          ...negocio,
          presupuestos: negocio.presupuestos.filter(p => p.id !== presupuestoId)
        };
      }
      return negocio;
    }));
  };

  return (
    <NegocioContext.Provider value={{
      negocios,
      contadorNegocio,
      crearNegocio,
      obtenerNegocio,
      crearPresupuesto,
      actualizarPresupuesto,
      eliminarPresupuesto
    }}>
      {children}
    </NegocioContext.Provider>
  );
};
