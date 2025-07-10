import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search } from 'lucide-react';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { ClienteFinalData } from '../types';
import { CompanyValidationNotification } from './CompanyValidationNotification';

interface ClienteFinalFormProps {
  clienteFinal: ClienteFinalData;
  setClienteFinal: (cliente: ClienteFinalData) => void;
  onNameChange: (name: string) => Promise<void>;
  isValidating: boolean;
  validationMessage: string;
  isCompanyFound: boolean | null;
}

export const ClienteFinalForm: React.FC<ClienteFinalFormProps> = ({
  clienteFinal,
  setClienteFinal,
  onNameChange,
  isValidating,
  validationMessage,
  isCompanyFound
}) => {
  const rutValidator = useChileanRutValidator();

  React.useEffect(() => {
    if (clienteFinal.rut) {
      rutValidator.handleChange(clienteFinal.rut);
    }
  }, [clienteFinal.rut]);

  return (
    <div className="space-y-4 rounded-lg p-6 bg-green-50/70 border border-green-100">
      <h3 className="text-lg font-medium text-gray-800">Información del Cliente Final</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="clienteNombre" className="text-sm font-normal text-gray-700">
            Nombre del Cliente Final *
          </Label>
          <div className="relative flex gap-2 mt-1">
            <div className="relative flex-1">
              <Input 
                id="clienteNombre" 
                value={clienteFinal.nombre} 
                onChange={e => onNameChange(e.target.value)}
                placeholder="Nombre del cliente final" 
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
              onClick={() => onNameChange(clienteFinal.nombre)}
              disabled={!clienteFinal.nombre.trim() || isValidating}
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
            <Label htmlFor="clienteRut" className="text-sm font-normal text-gray-700">
              RUT (opcional)
            </Label>
            <Input 
              id="clienteRut" 
              value={rutValidator.value} 
              onChange={e => {
                const result = rutValidator.handleChange(e.target.value);
                setClienteFinal({
                  ...clienteFinal,
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
            <Label htmlFor="clienteSitioWeb" className="text-sm font-normal text-gray-700">
              Sitio Web (opcional)
            </Label>
            <Input 
              id="clienteSitioWeb" 
              value={clienteFinal.sitio_web} 
              onChange={e => setClienteFinal({
                ...clienteFinal,
                sitio_web: e.target.value
              })} 
              placeholder="www.cliente.com" 
              className="bg-white mt-1" 
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="clienteDireccion" className="text-sm font-normal text-gray-700">
            Dirección (opcional)
          </Label>
          <Input 
            id="clienteDireccion" 
            value={clienteFinal.direccion} 
            onChange={e => setClienteFinal({
              ...clienteFinal,
              direccion: e.target.value
            })} 
            placeholder="Dirección del cliente" 
            className="bg-white mt-1" 
          />
        </div>
      </div>
    </div>
  );
};