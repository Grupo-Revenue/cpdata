
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductForm from './ProductForm';
import { LineaProducto, ProductFormData, Producto } from '../types/producto.types';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  lineasProducto: LineaProducto[];
  editingProduct: Producto | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ProductDialog: React.FC<ProductDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  lineasProducto,
  editingProduct,
  onSubmit,
  onCancel
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          lineasProducto={lineasProducto}
          editingProduct={editingProduct}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
