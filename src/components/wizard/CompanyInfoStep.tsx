import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { ProductoraData, ClienteFinalData } from './types';

interface CompanyInfoStepProps {
  tipoCliente: 'productora' | 'cliente_final';
  setTipoCliente: (tipo: 'productora' | 'cliente_final') => void;
  productora: ProductoraData;
  setProductora: (productora: ProductoraData) => void;
  tieneClienteFinal: boolean;
  setTieneClienteFinal: (tiene: boolean) => void;
  clienteFinal: ClienteFinalData;
  setClienteFinal: (cliente: ClienteFinalData) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  tipoCliente,
  setTipoCliente,
  productora,
  setProductora,
  tieneClienteFinal,
  setTieneClienteFinal,
  clienteFinal,
  setClienteFinal,
  onPrevious,
  onNext
}) => {
  const rutValidator = useChileanRutValidator();
  const rutProductoraValidator = useChileanRutValidator();

  const validarPaso = () => {
    if (tipoCliente === 'productora') {
      const productoraValida = productora.nombre;
      if (tieneClienteFinal) {
        return productoraValida && clienteFinal.nombre;
      }
      return productoraValida;
    } else {
      return clienteFinal.nombre;
    }
  };

  const handleNext = () => {
    if (!validarPaso()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="tipoCliente">Tipo de Cliente *</Label>
        <Select value={tipoCliente} onValueChange={(value: 'productora' | 'cliente_final') => setTipoCliente(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione el tipo de cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente_final">Cliente Final</SelectItem>
            <SelectItem value="productora">Productora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tipoCliente === 'productora' && (
        <div className="space-y-4 border rounded-lg p-4 bg-secondary/30">
          <h3 className="text-lg font-medium">Información de la Productora</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productoraNombre">Nombre de la Productora *</Label>
              <Input
                id="productoraNombre"
                value={productora.nombre}
                onChange={(e) => setProductora({...productora, nombre: e.target.value})}
                placeholder="Nombre de la productora"
              />
            </div>
            <div>
              <Label htmlFor="productoraRut">RUT de la Productora</Label>
              <Input
                id="productoraRut"
                value={rutProductoraValidator.value}
                onChange={(e) => {
                  const result = rutProductoraValidator.handleChange(e.target.value);
                  setProductora({...productora, rut: result.formattedValue});
                }}
                placeholder="12.345.678-9"
                className={rutProductoraValidator.error ? 'border-destructive' : ''}
              />
              {rutProductoraValidator.error && (
                <p className="text-sm text-destructive mt-1">{rutProductoraValidator.error}</p>
              )}
            </div>
            <div>
              <Label htmlFor="productoraSitioWeb">Sitio Web</Label>
              <Input
                id="productoraSitioWeb"
                value={productora.sitio_web}
                onChange={(e) => setProductora({...productora, sitio_web: e.target.value})}
                placeholder="https://www.productora.com"
              />
            </div>
            <div>
              <Label htmlFor="productoraDireccion">Dirección</Label>
              <Input
                id="productoraDireccion"
                value={productora.direccion}
                onChange={(e) => setProductora({...productora, direccion: e.target.value})}
                placeholder="Dirección de la productora"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tieneClienteFinal"
              checked={tieneClienteFinal}
              onCheckedChange={(checked) => setTieneClienteFinal(checked as boolean)}
            />
            <Label htmlFor="tieneClienteFinal">¿Hay un cliente final diferente?</Label>
          </div>
        </div>
      )}

      {(tipoCliente === 'cliente_final' || tieneClienteFinal) && (
        <div className="space-y-4 border rounded-lg p-4 bg-accent/20">
          <h3 className="text-lg font-medium">Información del Cliente Final</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clienteNombre">Nombre del Cliente Final *</Label>
              <Input
                id="clienteNombre"
                value={clienteFinal.nombre}
                onChange={(e) => setClienteFinal({...clienteFinal, nombre: e.target.value})}
                placeholder="Nombre del cliente final"
              />
            </div>
            <div>
              <Label htmlFor="clienteRut">RUT del Cliente Final</Label>
              <Input
                id="clienteRut"
                value={rutValidator.value}
                onChange={(e) => {
                  const result = rutValidator.handleChange(e.target.value);
                  setClienteFinal({...clienteFinal, rut: result.formattedValue});
                }}
                placeholder="12.345.678-9"
                className={rutValidator.error ? 'border-destructive' : ''}
              />
              {rutValidator.error && (
                <p className="text-sm text-destructive mt-1">{rutValidator.error}</p>
              )}
            </div>
            <div>
              <Label htmlFor="clienteSitioWeb">Sitio Web</Label>
              <Input
                id="clienteSitioWeb"
                value={clienteFinal.sitio_web}
                onChange={(e) => setClienteFinal({...clienteFinal, sitio_web: e.target.value})}
                placeholder="https://www.cliente.com"
              />
            </div>
            <div>
              <Label htmlFor="clienteDireccion">Dirección</Label>
              <Input
                id="clienteDireccion"
                value={clienteFinal.direccion}
                onChange={(e) => setClienteFinal({...clienteFinal, direccion: e.target.value})}
                placeholder="Dirección del cliente final"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between space-x-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="w-32"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!validarPaso()}
          className="w-32"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};