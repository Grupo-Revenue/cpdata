import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useHubSpotCompanyValidation } from '@/hooks/useHubSpotCompanyValidation';
import { ProductoraData, ClienteFinalData } from './types';
import { ProductoraForm } from './components/ProductoraForm';
import { ClienteFinalForm } from './components/ClienteFinalForm';
import { useCompanyProcessor } from './hooks/useCompanyProcessor';
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
  const { processCompany, isProcessing } = useCompanyProcessor();
  
  // HubSpot validation hooks for productora
  const {
    searchCompanyInHubSpot,
    isValidating: isValidatingProductora,
    validationMessage: validationMessageProductora,
    isCompanyFound: isProductoraFound,
    clearValidation: clearProductoraValidation
  } = useHubSpotCompanyValidation();
  
  // HubSpot validation hooks for cliente final
  const {
    searchCompanyInHubSpot: searchClienteFinalInHubSpot,
    isValidating: isValidatingClienteFinal,
    validationMessage: validationMessageClienteFinal,
    isCompanyFound: isClienteFinalFound,
    clearValidation: clearClienteFinalValidation
  } = useHubSpotCompanyValidation();

  // Handle productora name validation
  const handleProductoraNameChange = async (name: string) => {
    // Clear other fields when searching
    setProductora({
      nombre: name,
      rut: '',
      direccion: '',
      sitio_web: ''
    });

    if (name.trim().length > 2) {
      const result = await searchCompanyInHubSpot(name);
      if (result?.found && result.company) {
        // Auto-fill productora data from HubSpot
        const company = result.company;
        
        // Map HubSpot company type to local format
        const mappedTipoCliente = company.tipoCliente === 'Productora' ? 'productora' : 'cliente_final';
        
        // Only auto-fill if the company type matches what we're looking for
        if (mappedTipoCliente === 'productora') {
          setProductora({
            nombre: company.name,
            rut: company.rut || '',
            direccion: company.address || '',
            sitio_web: company.website || ''
          });
        }
      }
    }
  };

  // Handle cliente final name validation
  const handleClienteFinalNameChange = async (name: string) => {
    // Clear other fields when searching
    setClienteFinal({
      nombre: name,
      rut: '',
      direccion: '',
      sitio_web: ''
    });

    if (name.trim().length > 2) {
      const result = await searchClienteFinalInHubSpot(name);
      if (result?.found && result.company) {
        // Auto-fill cliente final data from HubSpot
        const company = result.company;
        
        // Map HubSpot company type to local format
        const mappedTipoCliente = company.tipoCliente === 'Cliente Final' ? 'cliente_final' : 'productora';
        
        // Only auto-fill if the company type matches what we're looking for
        if (mappedTipoCliente === 'cliente_final') {
          setClienteFinal({
            nombre: company.name,
            rut: company.rut || '',
            direccion: company.address || '',
            sitio_web: company.website || ''
          });
        }
      }
    }
  };

  // Clear validations when company type changes
  useEffect(() => {
    clearProductoraValidation();
    clearClienteFinalValidation();
  }, [tipoCliente, clearProductoraValidation, clearClienteFinalValidation]);

  // Clear data when client type changes
  useEffect(() => {
    setProductora({
      nombre: '',
      rut: '',
      sitio_web: '',
      direccion: ''
    });
    setClienteFinal({
      nombre: '',
      rut: '',
      sitio_web: '',
      direccion: ''
    });
  }, [tipoCliente]);

  // Clear cliente final data when checkbox changes
  useEffect(() => {
    if (!tieneClienteFinal) {
      setClienteFinal({
        nombre: '',
        rut: '',
        sitio_web: '',
        direccion: ''
      });
    }
  }, [tieneClienteFinal]);
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
  const handleNext = async () => {
    console.log('[CompanyInfoStep] handleNext called with:', {
      tipoCliente,
      productora,
      tieneClienteFinal,
      clienteFinal,
      validationPassed: validarPaso()
    });

    if (!validarPaso()) {
      console.log('[CompanyInfoStep] Validation failed');
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const success = await processCompany(tipoCliente, productora, clienteFinal, tieneClienteFinal);
    if (success) {
      onNext();
    }
  };
  return <div className="space-y-6">
      <div>
        <Label htmlFor="tipoCliente" className="text-sm font-normal text-gray-700">¿Este negocio es para una productora o cliente final?</Label>
        <Select value={tipoCliente} onValueChange={(value: 'productora' | 'cliente_final') => setTipoCliente(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Seleccione el tipo de cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente_final">Cliente Final</SelectItem>
            <SelectItem value="productora">Productora</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tipoCliente === 'productora' && (
        <ProductoraForm
          productora={productora}
          setProductora={setProductora}
          tieneClienteFinal={tieneClienteFinal}
          setTieneClienteFinal={setTieneClienteFinal}
          onNameChange={handleProductoraNameChange}
          isValidating={isValidatingProductora}
          validationMessage={validationMessageProductora}
          isCompanyFound={isProductoraFound}
        />
      )}

      {(tipoCliente === 'cliente_final' || tieneClienteFinal) && (
        <ClienteFinalForm
          clienteFinal={clienteFinal}
          setClienteFinal={setClienteFinal}
          onNameChange={handleClienteFinalNameChange}
          isValidating={isValidatingClienteFinal}
          validationMessage={validationMessageClienteFinal}
          isCompanyFound={isClienteFinalFound}
        />
      )}

      <div className="flex justify-between space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="w-32">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="button" onClick={handleNext} disabled={!validarPaso() || isProcessing} className="w-32">
          {isProcessing ? 'Procesando...' : 'Siguiente'}
        </Button>
      </div>
    </div>;
};