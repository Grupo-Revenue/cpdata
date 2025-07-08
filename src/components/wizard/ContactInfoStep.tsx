import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useChileanPhoneValidator } from '@/hooks/useChileanPhoneValidator';
import { useEmailValidator } from '@/hooks/useEmailValidator';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';
import { ContactoData } from './types';

interface ContactInfoStepProps {
  contacto: ContactoData;
  setContacto: (contacto: ContactoData) => void;
  onNext: () => Promise<void>;
  isProcessing: boolean;
}

export const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  contacto,
  setContacto,
  onNext,
  isProcessing
}) => {
  const phoneValidator = useChileanPhoneValidator('+56');
  const emailValidator = useEmailValidator();
  
  const {
    searchContactInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isContactFound
  } = useHubSpotContactValidation();

  const validarPaso = () => {
    return contacto.nombre && contacto.apellido && emailValidator.isValid && phoneValidator.isValid;
  };

  const handleManualEmailValidation = async () => {
    if (!contacto.email || !emailValidator.isValid) {
      toast({
        title: "Email inválido",
        description: "Por favor ingrese un email válido antes de validar.",
        variant: "destructive"
      });
      return;
    }

    const result = await searchContactInHubSpot(contacto.email);
    
    if (result && result.found && result.contact) {
      const updatedContacto = {
        ...contacto,
        nombre: result.contact!.firstname || contacto.nombre,
        apellido: result.contact!.lastname || contacto.apellido,
        telefono: result.contact!.phone ? (result.contact!.phone.startsWith('+56') ? result.contact!.phone : `+56${result.contact!.phone.replace(/[^\d]/g, '')}`) : contacto.telefono
      };
      setContacto(updatedContacto);
      
      if (result.contact!.phone) {
        const formattedPhone = result.contact!.phone.startsWith('+56') ? result.contact!.phone : `+56${result.contact!.phone.replace(/[^\d]/g, '')}`;
        phoneValidator.handleChange(formattedPhone);
      }
    }
  };

  useEffect(() => {
    if (contacto.email && emailValidator.isValid) {
      const timeoutId = setTimeout(() => {
        searchContactInHubSpot(contacto.email).then(result => {
          if (result && result.found && result.contact) {
            const updatedContacto = {
              ...contacto,
              nombre: result.contact!.firstname || contacto.nombre,
              apellido: result.contact!.lastname || contacto.apellido,
              telefono: result.contact!.phone ? (result.contact!.phone.startsWith('+56') ? result.contact!.phone : `+56${result.contact!.phone.replace(/[^\d]/g, '')}`) : contacto.telefono
            };
            setContacto(updatedContacto);
            
            if (result.contact!.phone) {
              const formattedPhone = result.contact!.phone.startsWith('+56') ? result.contact!.phone : `+56${result.contact!.phone.replace(/[^\d]/g, '')}`;
              phoneValidator.handleChange(formattedPhone);
            }
          }
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      clearValidation();
    }
  }, [contacto.email, emailValidator.isValid]);

  const handleNext = async () => {
    if (!validarPaso()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    
    await onNext();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor="email">Email *</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="email"
              type="email"
              value={emailValidator.value}
              onChange={(e) => {
                // Clear other fields when searching by email
                const email = e.target.value;
                emailValidator.handleChange(email);
                setContacto({
                  email: email,
                  nombre: '',
                  apellido: '',
                  telefono: '',
                  cargo: ''
                });
                
                // Clear phone validator
                phoneValidator.reset();
              }}
              placeholder="contacto@empresa.com"
              className={emailValidator.error ? 'border-destructive' : ''}
            />
            {isValidating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleManualEmailValidation}
            disabled={isValidating || !emailValidator.isValid}
            className="px-3"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
        {emailValidator.error && (
          <p className="text-sm text-destructive mt-1">{emailValidator.error}</p>
        )}
        {validationMessage && (
          <div className={`flex items-start space-x-2 p-3 rounded-md mt-2 ${
            isContactFound 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            {isContactFound ? (
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <p className={`text-sm ${
              isContactFound ? 'text-green-700' : 'text-blue-700'
            }`}>
              {validationMessage}
            </p>
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={contacto.nombre}
          onChange={(e) => setContacto({...contacto, nombre: e.target.value})}
          placeholder="Ingrese el nombre"
        />
      </div>
      
      <div>
        <Label htmlFor="apellido">Apellido *</Label>
        <Input
          id="apellido"
          value={contacto.apellido}
          onChange={(e) => setContacto({...contacto, apellido: e.target.value})}
          placeholder="Ingrese el apellido"
        />
      </div>
      
      <div>
        <Label htmlFor="telefono">Teléfono *</Label>
        <Input
          id="telefono"
          value={phoneValidator.value}
          onChange={(e) => {
            const result = phoneValidator.handleChange(e.target.value);
            setContacto({...contacto, telefono: result.formattedValue});
          }}
          placeholder="+56 9 1234 5678"
          className={phoneValidator.error ? 'border-destructive' : ''}
        />
        {phoneValidator.error && (
          <p className="text-sm text-destructive mt-1">{phoneValidator.error}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="cargo">Cargo (opcional)</Label>
        <Input
          id="cargo"
          value={contacto.cargo}
          onChange={(e) => setContacto({...contacto, cargo: e.target.value})}
          placeholder="Ej: Gerente de Marketing"
        />
      </div>

      <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
        <Button
          type="button"
          onClick={handleNext}
          disabled={isProcessing || !validarPaso()}
          className="w-32"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Siguiente
        </Button>
      </div>
    </div>
  );
};