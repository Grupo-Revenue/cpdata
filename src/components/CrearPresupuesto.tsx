
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNegocio } from '@/context/NegocioContext';
import { ProductoPresupuesto } from '@/types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatearPrecio } from '@/utils/formatters';
import { useProductosBiblioteca, ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import ProductsSelectionTable from './presupuesto/ProductsSelectionTable';
import QuoteEditView from './presupuesto/QuoteEditView';
import CustomProductForm from './presupuesto/CustomProductForm';

interface CrearPresupuestoProps {
  negocioId: string;
  presupuestoId?: string | null;
  onCerrar: () => void;
}

type Step = 'selection' | 'editing';

const CrearPresupuesto: React.FC<CrearPresupuestoProps> = ({ negocioId, presupuestoId, onCerrar }) => {
  const { obtenerNegocio, crearPresupuesto, actualizarPresupuesto } = useNegocio();
  const { productos: productosBiblioteca, loading: loadingProductos } = useProductosBiblioteca();
  const [step, setStep] = useState<Step>('selection');
  const [productos, setProductos] = useState<ProductoPresupuesto[]>([]);

  const negocio = obtenerNegocio(negocioId);
  const presupuestoExistente = presupuestoId ? 
    negocio?.presupuestos.find(p => p.id === presupuestoId) : null;

  useEffect(() => {
    if (presupuestoExistente) {
      setProductos(presupuestoExistente.productos);
      setStep('editing');
    }
  }, [presupuestoExistente]);

  if (!negocio) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Negocio no encontrado</p>
          <Button onClick={onCerrar} variant="outline">Volver</Button>
        </div>
      </div>
    );
  }

  const agregarProductoBiblioteca = (productoBiblioteca: ProductoBiblioteca) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}-${productoBiblioteca.id}`,
      nombre: productoBiblioteca.nombre,
      descripcion: productoBiblioteca.descripcion || '',
      cantidad: 1,
      precioUnitario: productoBiblioteca.precio_base,
      total: productoBiblioteca.precio_base
    };

    setProductos(prev => [...prev, nuevoProducto]);
  };

  const eliminarProducto = (id: string) => {
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const agregarProductoPersonalizado = (productoData: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => {
    const nuevoProducto: ProductoPresupuesto = {
      id: `producto-${Date.now()}`,
      ...productoData,
      total: productoData.cantidad * productoData.precioUnitario
    };

    setProductos(prev => [...prev, nuevoProducto]);
  };

  const actualizarProducto = (id: string, campo: keyof ProductoPresupuesto, valor: any) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const productoActualizado = { ...producto, [campo]: valor };
        if (campo === 'cantidad' || campo === 'precioUnitario') {
          productoActualizado.total = productoActualizado.cantidad * productoActualizado.precioUnitario;
        }
        return productoActualizado;
      }
      return producto;
    }));
  };

  const calcularTotal = () => {
    return productos.reduce((total, producto) => total + producto.total, 0);
  };

  const proceedToEdit = () => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe seleccionar al menos un producto para continuar",
        variant: "destructive"
      });
      return;
    }
    setStep('editing');
  };

  const guardarPresupuesto = () => {
    if (productos.length === 0) {
      toast({
        title: "Sin productos",
        description: "Debe agregar al menos un producto al presupuesto",
        variant: "destructive"
      });
      return;
    }

    if (presupuestoId) {
      actualizarPresupuesto(negocioId, presupuestoId, productos);
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado exitosamente",
      });
    } else {
      crearPresupuesto(negocioId, productos);
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado exitosamente",
      });
    }

    onCerrar();
  };

  if (loadingProductos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCerrar}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {presupuestoId ? 'Editar' : 'Crear'} Presupuesto
            </h1>
            <p className="text-gray-600">Negocio #{negocio.numero} - {negocio.evento.nombreEvento}</p>
          </div>
        </div>
        {step === 'selection' && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Productos seleccionados: {productos.length}</p>
              <p className="text-xl font-bold text-green-600">{formatearPrecio(calcularTotal())}</p>
            </div>
            <Button 
              onClick={proceedToEdit}
              disabled={productos.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continuar con Edición
            </Button>
          </div>
        )}
      </div>

      {step === 'selection' ? (
        <Tabs defaultValue="biblioteca" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="biblioteca">Biblioteca de Productos</TabsTrigger>
            <TabsTrigger value="personalizado">Producto Personalizado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="biblioteca" className="space-y-4">
            <ProductsSelectionTable
              productos={productosBiblioteca}
              productosSeleccionados={productos}
              onProductoSeleccionado={agregarProductoBiblioteca}
              onProductoDeseleccionado={eliminarProducto}
              loading={loadingProductos}
            />
          </TabsContent>

          <TabsContent value="personalizado">
            <CustomProductForm onAgregarProducto={agregarProductoPersonalizado} />
          </TabsContent>
        </Tabs>
      ) : (
        <QuoteEditView
          productos={productos}
          onActualizarProducto={actualizarProducto}
          onEliminarProducto={eliminarProducto}
          onVolver={() => setStep('selection')}
          onConfirmar={guardarPresupuesto}
          total={calcularTotal()}
        />
      )}
    </div>
  );
};

export default CrearPresupuesto;
