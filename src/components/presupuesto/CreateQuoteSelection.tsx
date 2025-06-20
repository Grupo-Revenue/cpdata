
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { ProductoPresupuesto } from '@/types';
import ProductsSelectionTable from './ProductsSelectionTable';
import CustomProductForm from './CustomProductForm';

interface CreateQuoteSelectionProps {
  productosBiblioteca: ProductoBiblioteca[];
  productosSeleccionados: ProductoPresupuesto[];
  onProductoSeleccionado: (producto: ProductoBiblioteca) => void;
  onProductoDeseleccionado: (id: string) => void;
  onAgregarProductoPersonalizado: (producto: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => void;
  loading: boolean;
}

const CreateQuoteSelection: React.FC<CreateQuoteSelectionProps> = ({
  productosBiblioteca,
  productosSeleccionados,
  onProductoSeleccionado,
  onProductoDeseleccionado,
  onAgregarProductoPersonalizado,
  loading
}) => {
  return (
    <Tabs defaultValue="biblioteca" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="biblioteca">Biblioteca de Productos</TabsTrigger>
        <TabsTrigger value="personalizado">Producto Personalizado</TabsTrigger>
      </TabsList>
      
      <TabsContent value="biblioteca" className="space-y-4">
        <ProductsSelectionTable
          productos={productosBiblioteca}
          productosSeleccionados={productosSeleccionados}
          onProductoSeleccionado={onProductoSeleccionado}
          onProductoDeseleccionado={onProductoDeseleccionado}
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="personalizado">
        <CustomProductForm onAgregarProducto={onAgregarProductoPersonalizado} />
      </TabsContent>
    </Tabs>
  );
};

export default CreateQuoteSelection;
