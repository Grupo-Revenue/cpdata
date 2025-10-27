import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Contacto } from '@/types';
import { useChileanPhoneValidator } from '@/hooks/useChileanPhoneValidator';
import { useEmailValidator } from '@/hooks/useEmailValidator';
import { useHubSpotContactValidation } from '@/hooks/useHubSpotContactValidation';
import { toast } from '@/hooks/use-toast';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto: Contacto;
  onSave: (contactData: Partial<Contacto>) => Promise<void>;
}

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  onOpenChange,
  contacto,
  onSave
}) => {
  const [formData, setFormData] = useState({
    nombre: contacto.nombre,
    apellido: contacto.apellido,
    email: contacto.email,
    telefono: contacto.telefono,
    cargo: contacto.cargo || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const phoneValidator = useChileanPhoneValidator('+56');
  const emailValidator = useEmailValidator();
  
  const {
    searchContactInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isContactFound
  } = useHubSpotContactValidation();

  // Initialize validators with current data
  useEffect(() => {
    if (open) {
      emailValidator.handleChange(contacto.email);
      phoneValidator.handleChange(contacto.telefono);
      setFormData({
        nombre: contacto.nombre,
        apellido: contacto.apellido,
        email: contacto.email,
        telefono: contacto.telefono,
        cargo: contacto.cargo || ''
      });
    }
  }, [open, contacto]);

  // Auto-search in HubSpot when email changes
  useEffect(() => {
    if (formData.email && emailValidator.isValid && formData.email !== contacto.email) {
      const timeoutId = setTimeout(() => {
        searchContactInHubSpot(formData.email).then(result => {
          if (result && result.found && result.contact) {
            setFormData(prev => ({
              ...prev,
              nombre: result.contact!.firstname || prev.nombre,
              apellido: result.contact!.lastname || prev.apellido,
              telefono: result.contact!.phone 
                ? `+56${result.contact!.phone.replace(/^\+?56/, '').replace(/\D/g, '')}`
                : prev.telefono
            }));
          }
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData.email, emailValidator.isValid]);

  const handleManualEmailValidation = async () => {
    if (!formData.email || !emailValidator.isValid) {
      toast({
        title: "Email inválido",
        description: "Por favor ingrese un email válido antes de validar.",
        variant: "destructive"
      });
      return;
    }

    const result = await searchContactInHubSpot(formData.email);
    
    if (result && result.found && result.contact) {
      setFormData(prev => ({
        ...prev,
        nombre: result.contact!.firstname || prev.nombre,
        apellido: result.contact!.lastname || prev.apellido,
        telefono: result.contact!.phone 
          ? `+56${result.contact!.phone.replace(/^\+?56/, '').replace(/\D/g, '')}`
          : prev.telefono
      }));
      
      if (result.contact!.phone) {
        const cleanedPhone = result.contact!.phone.replace(/^\+?56/, '').replace(/\D/g, '');
        const normalizedPhone = `+56${cleanedPhone}`;
        phoneValidator.handleChange(normalizedPhone);
      }
    }
  };

  const isValid = () => {
    return formData.nombre && formData.apellido && emailValidator.isValid && phoneValidator.isValid;
  };

  const handleSave = async () => {
    if (!isValid()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios correctamente",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contacto</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="md:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="email"
                  type="email"
                  value={emailValidator.value}
                  onChange={(e) => {
                    emailValidator.handleChange(e.target.value);
                    setFormData(prev => ({ ...prev, email: e.target.value }));
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
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ingrese el nombre"
            />
          </div>
          
          <div>
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              value={formData.apellido}
              onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
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
                setFormData(prev => ({ ...prev, telefono: result.formattedValue }));
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
              value={formData.cargo}
              onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
              placeholder="Ej: Gerente de Marketing"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isValid()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
