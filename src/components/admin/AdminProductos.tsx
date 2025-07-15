
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Loader2 } from 'lucide-react';
import ProductDialog from './components/ProductDialog';
import ProductTable from './components/ProductTable';
import { useProductos } from './hooks/useProductos';
import { ProductFormData, Producto } from './types/producto.types';

const AdminProductos: React.FC = () => {
  const {
    productos,
    lineasProducto,
    loading,
    cargarLineasProducto,
    cargarProductos,
    guardarProducto,
    toggleActivoProducto,
    eliminarProducto
  } = useProductos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    nombre: '',
    descripcion: '',
    precio_base: '',
    linea_producto_id: 'none'
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio_base: '',
      linea_producto_id: 'none'
    });
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await guardarProducto(formData, editingProduct);
    if (success) {
      setDialogOpen(false);
      resetForm();
    }
  };

  const editarProducto = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio_base: producto.precio_base.toString(),
      linea_producto_id: producto.linea_producto_id || 'none'
    });
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    resetForm();
  };

  useEffect(() => {
    cargarLineasProducto();
    cargarProductos();
  }, []);

  if (loading) {
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Biblioteca de Productos
            </CardTitle>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductTable
            productos={productos}
            onEditProduct={editarProducto}
            onToggleActive={toggleActivoProducto}
            onDeleteProduct={eliminarProducto}
          />
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        lineasProducto={lineasProducto}
        editingProduct={editingProduct}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default AdminProductos;
