
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

interface EmptyProductsStateProps {
  onVolver: () => void;
}

const EmptyProductsState: React.FC<EmptyProductsStateProps> = ({ onVolver }) => {
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos seleccionados</h3>
          <p className="text-gray-600 mb-4">Vuelve a la selección para agregar productos</p>
          <Button onClick={onVolver} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Selección
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyProductsState;
