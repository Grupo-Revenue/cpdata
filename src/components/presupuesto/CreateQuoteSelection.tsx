
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductoBiblioteca } from '@/hooks/useProductosBiblioteca';
import { ExtendedProductoPresupuesto } from '@/types';
import ProductsSelectionTable from './ProductsSelectionTable';
import CustomProductForm from './CustomProductForm';
import ProductSelectionSidebar from './ProductSelectionSidebar';
import StickyBottomBar from './StickyBottomBar';

interface CreateQuoteSelectionProps {
  productosBiblioteca: ProductoBiblioteca[];
  productosSeleccionados: ExtendedProductoPresupuesto[];
  onProductoSeleccionado: (producto: ProductoBiblioteca) => void;
  onProductoDeseleccionado: (id: string) => void;
  onAgregarProductoPersonalizado: (producto: {
    nombre: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }) => void;
  onProceedToEdit: () => void;
  loading: boolean;
}

const CreateQuoteSelection: React.FC<CreateQuoteSelectionProps> = ({
  productosBiblioteca,
  productosSeleccionados,
  onProductoSeleccionado,
  onProductoDeseleccionado,
  onAgregarProductoPersonalizado,
  onProceedToEdit,
  loading
}) => {
  return (
    <>
      {/* Main Content with Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 pb-24 xl:pb-6">
        {/* Left Column - Products Table (70% on desktop) */}
        <div className="xl:col-span-3">
          <Tabs defaultValue="biblioteca" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="biblioteca" className="text-sm font-medium">
                Biblioteca de Productos
              </TabsTrigger>
              <TabsTrigger value="personalizado" className="text-sm font-medium">
                Producto Personalizado
              </TabsTrigger>
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
        </div>

        {/* Right Column - Selection Sidebar (30% on desktop, hidden on mobile) */}
        <div className="hidden xl:block">
          <ProductSelectionSidebar
            productosSeleccionados={productosSeleccionados}
            onEliminarProducto={onProductoDeseleccionado}
            onProceedToEdit={onProceedToEdit}
            disabled={loading}
          />
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="xl:hidden">
        <StickyBottomBar
          productosSeleccionados={productosSeleccionados}
          onProceedToEdit={onProceedToEdit}
          disabled={loading}
        />
      </div>
    </>
  );
};

export default CreateQuoteSelection;
