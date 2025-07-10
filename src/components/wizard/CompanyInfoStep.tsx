import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { useHubSpotCompanyValidation } from '@/hooks/useHubSpotCompanyValidation';
import { supabase } from '@/integrations/supabase/client';
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
  
  // HubSpot validation hooks
  const {
    searchCompanyInHubSpot,
    createCompanyInHubSpot,
    updateCompanyInHubSpot,
    isValidating: isValidatingProductora,
    validationMessage: validationMessageProductora,
    isCompanyFound: isProductoraFound,
    clearValidation: clearProductoraValidation
  } = useHubSpotCompanyValidation();
  
  const {
    searchCompanyInHubSpot: searchClienteFinalInHubSpot,
    createCompanyInHubSpot: createClienteFinalInHubSpot,
    updateCompanyInHubSpot: updateClienteFinalInHubSpot,
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
    
    // Clear RUT validator
    rutProductoraValidator.reset();

    if (name.trim().length > 2) {
      const result = await searchCompanyInHubSpot(name);
      if (result?.found && result.company) {
        // Auto-fill productora data from HubSpot
        const company = result.company;
        
        // Map HubSpot company type to local format
        const mappedTipoCliente = company.tipoCliente === 'Productora' ? 'productora' : 'cliente_final';
        
        // Only auto-fill if the company type matches what we're looking for
        if (mappedTipoCliente === 'productora') {
          // Update RUT validator with the found RUT first
           if (company.rut) {
             const result = rutProductoraValidator.handleChange(company.rut);
             setProductora({
               nombre: company.name,
               rut: result.formattedValue,
               direccion: company.address,
               sitio_web: company.website || ''
             });
           } else {
             setProductora({
               nombre: company.name,
               rut: company.rut,
               direccion: company.address,
               sitio_web: company.website || ''
             });
           }
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
    
    // Clear RUT validator
    rutValidator.reset();

    if (name.trim().length > 2) {
      const result = await searchClienteFinalInHubSpot(name);
      if (result?.found && result.company) {
        // Auto-fill cliente final data from HubSpot
        const company = result.company;
        
        // Map HubSpot company type to local format
        const mappedTipoCliente = company.tipoCliente === 'Cliente Final' ? 'cliente_final' : 'productora';
        
        // Only auto-fill if the company type matches what we're looking for
        if (mappedTipoCliente === 'cliente_final') {
          // Update RUT validator with the found RUT first
           if (company.rut) {
             const result = rutValidator.handleChange(company.rut);
             setClienteFinal({
               nombre: company.name,
               rut: result.formattedValue,
               direccion: company.address,
               sitio_web: company.website || ''
             });
           } else {
             setClienteFinal({
               nombre: company.name,
               rut: company.rut,
               direccion: company.address,
               sitio_web: company.website || ''
             });
           }
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
    // Reset RUT validators
    rutValidator.reset();
    rutProductoraValidator.reset();
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
      rutValidator.reset();
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

    try {
      let hasErrors = false;
      console.log('[CompanyInfoStep] Starting company processing...');

      // Process Productora if selected
      if (tipoCliente === 'productora' && productora.nombre) {
        console.log('[CompanyInfoStep] Processing productora:', productora.nombre);
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) throw new Error('Usuario no autenticado');

          let hubspotId = null;
          
          // First sync with HubSpot
          const result = await searchCompanyInHubSpot(productora.nombre);
          console.log('[CompanyInfoStep] Productora search result:', result);
          
          if (result?.found && result.company) {
            console.log('[CompanyInfoStep] Updating existing productora in HubSpot');
            const updateResult = await updateCompanyInHubSpot({
              nombre: productora.nombre,
              rut: productora.rut,
              direccion: productora.direccion,
              sitio_web: productora.sitio_web,
              tipoCliente: 'productora',
              hubspotId: result.company.hubspotId
            });
            console.log('[CompanyInfoStep] Productora update result:', updateResult);
            hubspotId = result.company.hubspotId;
          } else {
            console.log('[CompanyInfoStep] Creating new productora in HubSpot');
            const createResult = await createCompanyInHubSpot({
              nombre: productora.nombre,
              rut: productora.rut,
              direccion: productora.direccion,
              sitio_web: productora.sitio_web,
              tipoCliente: 'productora'
            });
            console.log('[CompanyInfoStep] Productora create result:', createResult);
            hubspotId = createResult.hubspotId;
          }

          // Now save/update in local database
          console.log('[CompanyInfoStep] Saving productora to local database...');
          const { data: existingProductora, error: searchError } = await supabase
            .from('empresas')
            .select('id')
            .eq('user_id', userId)
            .eq('nombre', productora.nombre)
            .eq('tipo', 'productora')
            .maybeSingle();

          if (searchError) throw searchError;

          if (existingProductora) {
            // Update existing productora
            const { error: updateError } = await supabase
              .from('empresas')
              .update({
                rut: productora.rut,
                direccion: productora.direccion,
                sitio_web: productora.sitio_web,
                hubspot_id: hubspotId
              })
              .eq('id', existingProductora.id);

            if (updateError) throw updateError;
            console.log('[CompanyInfoStep] Productora updated in local database');
          } else {
            // Create new productora
            const { error: createError } = await supabase
              .from('empresas')
              .insert([{
                nombre: productora.nombre,
                rut: productora.rut,
                direccion: productora.direccion,
                sitio_web: productora.sitio_web,
                tipo: 'productora',
                user_id: userId,
                hubspot_id: hubspotId
              }]);

            if (createError) throw createError;
            console.log('[CompanyInfoStep] Productora created in local database');
          }
        } catch (error) {
          console.error('[CompanyInfoStep] Error processing Productora:', error);
          hasErrors = true;
          toast({
            title: "Error",
            description: `Error al guardar productora: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      // Process Cliente Final if applicable
      if ((tipoCliente === 'cliente_final' || tieneClienteFinal) && clienteFinal.nombre) {
        console.log('[CompanyInfoStep] Processing cliente final:', clienteFinal.nombre);
        try {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (!userId) throw new Error('Usuario no autenticado');

          let hubspotId = null;
          
          // First sync with HubSpot
          const result = await searchClienteFinalInHubSpot(clienteFinal.nombre);
          console.log('[CompanyInfoStep] Cliente final search result:', result);
          
          if (result?.found && result.company) {
            console.log('[CompanyInfoStep] Updating existing cliente final in HubSpot');
            const updateResult = await updateClienteFinalInHubSpot({
              nombre: clienteFinal.nombre,
              rut: clienteFinal.rut,
              direccion: clienteFinal.direccion,
              sitio_web: clienteFinal.sitio_web,
              tipoCliente: 'cliente_final',
              hubspotId: result.company.hubspotId
            });
            console.log('[CompanyInfoStep] Cliente final update result:', updateResult);
            hubspotId = result.company.hubspotId;
          } else {
            console.log('[CompanyInfoStep] Creating new cliente final in HubSpot');
            const createResult = await createClienteFinalInHubSpot({
              nombre: clienteFinal.nombre,
              rut: clienteFinal.rut,
              direccion: clienteFinal.direccion,
              sitio_web: clienteFinal.sitio_web,
              tipoCliente: 'cliente_final'
            });
            console.log('[CompanyInfoStep] Cliente final create result:', createResult);
            hubspotId = createResult.hubspotId;
          }

          // Now save/update in local database
          console.log('[CompanyInfoStep] Saving cliente final to local database...');
          const { data: existingCliente, error: searchError } = await supabase
            .from('empresas')
            .select('id')
            .eq('user_id', userId)
            .eq('nombre', clienteFinal.nombre)
            .eq('tipo', 'cliente_final')
            .maybeSingle();

          if (searchError) throw searchError;

          if (existingCliente) {
            // Update existing cliente final
            const { error: updateError } = await supabase
              .from('empresas')
              .update({
                rut: clienteFinal.rut,
                direccion: clienteFinal.direccion,
                sitio_web: clienteFinal.sitio_web,
                hubspot_id: hubspotId
              })
              .eq('id', existingCliente.id);

            if (updateError) throw updateError;
            console.log('[CompanyInfoStep] Cliente final updated in local database');
          } else {
            // Create new cliente final
            const { error: createError } = await supabase
              .from('empresas')
              .insert([{
                nombre: clienteFinal.nombre,
                rut: clienteFinal.rut,
                direccion: clienteFinal.direccion,
                sitio_web: clienteFinal.sitio_web,
                tipo: 'cliente_final',
                user_id: userId,
                hubspot_id: hubspotId
              }]);

            if (createError) throw createError;
            console.log('[CompanyInfoStep] Cliente final created in local database');
          }
        } catch (error) {
          console.error('[CompanyInfoStep] Error processing Cliente Final:', error);
          hasErrors = true;
          toast({
            title: "Error",
            description: `Error al guardar cliente final: ${error.message}`,
            variant: "destructive"
          });
        }
      }

      console.log('[CompanyInfoStep] Company processing completed. HasErrors:', hasErrors);

      if (hasErrors) {
        toast({
          title: "Error en el procesamiento",
          description: "Algunas operaciones tuvieron problemas. Por favor, corrige los errores antes de continuar.",
          variant: "destructive"
        });
        return;
      } else {
        console.log('[CompanyInfoStep] All companies processed successfully, proceeding to next step');
        toast({
          title: "Empresas procesadas",
          description: "Todas las empresas han sido sincronizadas correctamente.",
        });
        onNext();
      }
    } catch (error) {
      console.error('[CompanyInfoStep] Error general en el procesamiento:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar las empresas.",
        variant: "destructive"
      });
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

      {tipoCliente === 'productora' && <div className="space-y-4 rounded-lg p-6 bg-blue-50/70 border border-blue-100">
          <h3 className="text-lg font-medium text-gray-800">Información de la Productora</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productoraNombre" className="text-sm font-normal text-gray-700">Nombre de la Productora *</Label>
              <div className="relative flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input 
                    id="productoraNombre" 
                    value={productora.nombre} 
                    onChange={e => handleProductoraNameChange(e.target.value)}
                    placeholder="Nombre de la productora" 
                    className={`bg-white ${isProductoraFound === true ? 'border-green-500' : isProductoraFound === false ? 'border-orange-500' : ''}`}
                  />
                  {isValidatingProductora && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleProductoraNameChange(productora.nombre)}
                  disabled={!productora.nombre.trim() || isValidatingProductora}
                  className="shrink-0 bg-white"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {validationMessageProductora && (
                <div className={`flex items-start space-x-2 p-3 rounded-md mt-2 ${
                  isProductoraFound === true 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  {isProductoraFound === true ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    isProductoraFound === true ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {validationMessageProductora}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productoraRut" className="text-sm font-normal text-gray-700">RUT (opcional)</Label>
                <Input 
                  id="productoraRut" 
                  value={rutProductoraValidator.value} 
                  onChange={e => {
                    const result = rutProductoraValidator.handleChange(e.target.value);
                    setProductora({
                      ...productora,
                      rut: result.formattedValue
                    });
                  }} 
                  placeholder="12.345.678-9" 
                  className={`bg-white mt-1 ${rutProductoraValidator.error ? 'border-destructive' : ''}`} 
                />
                {rutProductoraValidator.error && <p className="text-sm text-destructive mt-1">{rutProductoraValidator.error}</p>}
              </div>
              <div>
                <Label htmlFor="productoraSitioWeb" className="text-sm font-normal text-gray-700">Sitio Web (opcional)</Label>
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
              <Label htmlFor="productoraDireccion" className="text-sm font-normal text-gray-700">Dirección (opcional)</Label>
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
              <Label htmlFor="tieneClienteFinal" className="text-sm font-normal text-gray-700">¿Conoce el cliente final?</Label>
            </div>
          </div>
        </div>}

      {(tipoCliente === 'cliente_final' || tieneClienteFinal) && <div className="space-y-4 rounded-lg p-6 bg-green-50/70 border border-green-100">
          <h3 className="text-lg font-medium text-gray-800">Información del Cliente Final</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clienteNombre" className="text-sm font-normal text-gray-700">Nombre del Cliente Final *</Label>
              <div className="relative flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Input 
                    id="clienteNombre" 
                    value={clienteFinal.nombre} 
                    onChange={e => handleClienteFinalNameChange(e.target.value)}
                    placeholder="Nombre del cliente final" 
                    className={`bg-white ${isClienteFinalFound === true ? 'border-green-500' : isClienteFinalFound === false ? 'border-orange-500' : ''}`}
                  />
                  {isValidatingClienteFinal && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleClienteFinalNameChange(clienteFinal.nombre)}
                  disabled={!clienteFinal.nombre.trim() || isValidatingClienteFinal}
                  className="shrink-0 bg-white"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {validationMessageClienteFinal && (
                <div className={`flex items-start space-x-2 p-3 rounded-md mt-2 ${
                  isClienteFinalFound === true 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  {isClienteFinalFound === true ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-sm ${
                    isClienteFinalFound === true ? 'text-green-700' : 'text-blue-700'
                  }`}>
                    {validationMessageClienteFinal}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clienteRut" className="text-sm font-normal text-gray-700">RUT (opcional)</Label>
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
                {rutValidator.error && <p className="text-sm text-destructive mt-1">{rutValidator.error}</p>}
              </div>
              <div>
                <Label htmlFor="clienteSitioWeb" className="text-sm font-normal text-gray-700">Sitio Web (opcional)</Label>
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
              <Label htmlFor="clienteDireccion" className="text-sm font-normal text-gray-700">Dirección (opcional)</Label>
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
        </div>}

      <div className="flex justify-between space-x-4 mt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="w-32">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button type="button" onClick={handleNext} disabled={!validarPaso()} className="w-32">
          Siguiente
        </Button>
      </div>
    </div>;
};