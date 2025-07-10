import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search } from 'lucide-react';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { ProductoraData } from '../types';
import { CompanyValidationNotification } from './CompanyValidationNotification';

interface ProductoraFormProps {
  productora: ProductoraData;
  setProductora: (productora: ProductoraData) => void;
  tieneClienteFinal: boolean;
  setTieneClienteFinal: (tiene: boolean) => void;
  onNameChange: (name: string) => Promise<void>;
  isValidating: boolean;
  validationMessage: string;
  isCompanyFound: boolean | null;
}

export const ProductoraForm: React.FC<ProductoraFormProps> = ({
  productora,
  setProductora,
  tieneClienteFinal,
  setTieneClienteFinal,
  onNameChange,
  isValidating,
  validationMessage,
  isCompanyFound
}) => {
  const rutValidator = useChileanRutValidator();

  React.useEffect(() => {
    if (productora.rut) {
      rutValidator.handleChange(productora.rut);
    }
  }, [productora.rut]);

  return (
    <div className="space-y-4 rounded-lg p-6 bg-blue-50/70 border border-blue-100">
      <h3 className="text-lg font-medium text-gray-800">Información de la Productora</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="productoraNombre" className="text-sm font-normal text-gray-700">
            Nombre de la Productora *
          </Label>
          <div className="relative flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input 
                id="productoraNombre" 
                value={productora.nombre} 
                onChange={e => onNameChange(e.target.value)}
                placeholder="Nombre de la productora" 
                className={`bg-white ${isCompanyFound === true ? 'border-green-500' : isCompanyFound === false ? 'border-orange-500' : ''}`}
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onNameChange(productora.nombre)}
              disabled={!productora.nombre.trim() || isValidating}
              className="shrink-0 bg-white"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <CompanyValidationNotification 
            message={validationMessage}
            isFound={isCompanyFound}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productoraRut" className="text-sm font-normal text-gray-700">
              RUT (opcional)
            </Label>
            <Input 
              id="productoraRut" 
              value={rutValidator.value} 
              onChange={e => {
                const result = rutValidator.handleChange(e.target.value);
                setProductora({
                  ...productora,
                  rut: result.formattedValue
                });
              }} 
              placeholder="12.345.678-9" 
              className={`bg-white mt-1 ${rutValidator.error ? 'border-destructive' : ''}`} 
            />
            {rutValidator.error && (
              <p className="text-sm text-destructive mt-1">{rutValidator.error}</p>
            )}
          </div>
          <div>
            <Label htmlFor="productoraSitioWeb" className="text-sm font-normal text-gray-700">
              Sitio Web (opcional)
            </Label>
            <Input 
              id="productoraSitioWeb" 
              value={productora.sitio_web} 
              onChange={e => setProductora({
                ...productora,
                sitio_web: e.target.value
              })} 
              placeholder="www.productora.com" 
              className="bg-white mt-1" 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="productoraDireccion" className="text-sm font-normal text-gray-700">
            Dirección (opcional)
          </Label>
          <Input 
            id="productoraDireccion" 
            value={productora.direccion} 
            onChange={e => setProductora({
              ...productora,
              direccion: e.target.value
            })} 
            placeholder="Dirección de la productora" 
            className="bg-white mt-1" 
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="tieneClienteFinal" 
            checked={tieneClienteFinal} 
            onCheckedChange={checked => setTieneClienteFinal(checked as boolean)} 
            className="rounded border-gray-400"
          />
          <Label htmlFor="tieneClienteFinal" className="text-sm font-normal text-gray-700">
            ¿Conoce el cliente final?
          </Label>
        </div>
      </div>
    </div>
  );
};