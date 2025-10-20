import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { Empresa, TipoEmpresa } from '@/types';
import { useChileanRutValidator } from '@/hooks/useChileanRutValidator';
import { useHubSpotCompanyValidation } from '@/hooks/useHubSpotCompanyValidation';
import { toast } from '@/hooks/use-toast';

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productora?: Empresa;
  clienteFinal?: Empresa;
  onSave: (productoraData?: Partial<Empresa> & { tipo: TipoEmpresa }, clienteFinalData?: Partial<Empresa> & { tipo: TipoEmpresa }) => Promise<void>;
}

export const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({
  open,
  onOpenChange,
  productora,
  clienteFinal,
  onSave
}) => {
  const [productoraData, setProductoraData] = useState({
    nombre: productora?.nombre || '',
    rut: productora?.rut || '',
    sitio_web: productora?.sitio_web || '',
    direccion: productora?.direccion || '',
    tipo: 'productora' as TipoEmpresa
  });

  const [clienteFinalData, setClienteFinalData] = useState({
    nombre: clienteFinal?.nombre || '',
    rut: clienteFinal?.rut || '',
    sitio_web: clienteFinal?.sitio_web || '',
    direccion: clienteFinal?.direccion || '',
    tipo: 'cliente_final' as TipoEmpresa
  });

  const [isSaving, setIsSaving] = useState(false);

  const productoraRutValidator = useChileanRutValidator();
  const clienteFinalRutValidator = useChileanRutValidator();
  
  const {
    searchCompanyInHubSpot,
    clearValidation,
    isValidating,
    validationMessage,
    isCompanyFound
  } = useHubSpotCompanyValidation();

  // Initialize data when dialog opens
  useEffect(() => {
    if (open) {
      setProductoraData({
        nombre: productora?.nombre || '',
        rut: productora?.rut || '',
        sitio_web: productora?.sitio_web || '',
        direccion: productora?.direccion || '',
        tipo: 'productora'
      });
      setClienteFinalData({
        nombre: clienteFinal?.nombre || '',
        rut: clienteFinal?.rut || '',
        sitio_web: clienteFinal?.sitio_web || '',
        direccion: clienteFinal?.direccion || '',
        tipo: 'cliente_final'
      });
      if (productora?.rut) productoraRutValidator.handleChange(productora.rut);
      if (clienteFinal?.rut) clienteFinalRutValidator.handleChange(clienteFinal.rut);
    }
  }, [open, productora, clienteFinal]);

  const isValid = () => {
    const productoraValid = productora ? (
      productoraData.nombre &&
      (!productoraData.rut || productoraRutValidator.isValid)
    ) : true;

    const clienteFinalValid = clienteFinal ? (
      clienteFinalData.nombre &&
      (!clienteFinalData.rut || clienteFinalRutValidator.isValid)
    ) : true;

    return productoraValid && clienteFinalValid;
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
      await onSave(
        productora ? productoraData : undefined,
        clienteFinal ? clienteFinalData : undefined
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving companies:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductoraSearch = async () => {
    if (!productoraData.nombre) {
      toast({
        title: "Nombre requerido",
        description: "Ingrese el nombre de la empresa para buscar",
        variant: "destructive"
      });
      return;
    }

    const result = await searchCompanyInHubSpot(productoraData.nombre);
    if (result && result.found && result.company) {
      setProductoraData(prev => ({
        ...prev,
        nombre: result.company!.name || prev.nombre,
        sitio_web: result.company!.website || prev.sitio_web,
        direccion: result.company!.address || prev.direccion
      }));
    }
  };

  const handleClienteFinalSearch = async () => {
    if (!clienteFinalData.nombre) {
      toast({
        title: "Nombre requerido",
        description: "Ingrese el nombre de la empresa para buscar",
        variant: "destructive"
      });
      return;
    }

    const result = await searchCompanyInHubSpot(clienteFinalData.nombre);
    if (result && result.found && result.company) {
      setClienteFinalData(prev => ({
        ...prev,
        nombre: result.company!.name || prev.nombre,
        sitio_web: result.company!.website || prev.sitio_web,
        direccion: result.company!.address || prev.direccion
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {productora && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Productora</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="productora-nombre">Nombre de la Empresa *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="productora-nombre"
                      value={productoraData.nombre}
                      onChange={(e) => setProductoraData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre de la productora"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleProductoraSearch}
                      disabled={isValidating}
                      className="px-3"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="productora-rut">RUT (opcional)</Label>
                  <Input
                    id="productora-rut"
                    value={productoraRutValidator.value}
                    onChange={(e) => {
                      const result = productoraRutValidator.handleChange(e.target.value);
                      setProductoraData(prev => ({ ...prev, rut: result.formattedValue }));
                    }}
                    placeholder="12.345.678-9"
                    className={productoraRutValidator.error ? 'border-destructive' : ''}
                  />
                  {productoraRutValidator.error && (
                    <p className="text-sm text-destructive mt-1">{productoraRutValidator.error}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="productora-sitio">Sitio Web (opcional)</Label>
                  <Input
                    id="productora-sitio"
                    value={productoraData.sitio_web}
                    onChange={(e) => setProductoraData(prev => ({ ...prev, sitio_web: e.target.value }))}
                    placeholder="www.empresa.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="productora-direccion">Dirección (opcional)</Label>
                  <Input
                    id="productora-direccion"
                    value={productoraData.direccion}
                    onChange={(e) => setProductoraData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección de la empresa"
                  />
                </div>
              </div>
            </div>
          )}

          {clienteFinal && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Cliente Final</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="cliente-nombre">Nombre de la Empresa *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cliente-nombre"
                      value={clienteFinalData.nombre}
                      onChange={(e) => setClienteFinalData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre del cliente final"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClienteFinalSearch}
                      disabled={isValidating}
                      className="px-3"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cliente-rut">RUT (opcional)</Label>
                  <Input
                    id="cliente-rut"
                    value={clienteFinalRutValidator.value}
                    onChange={(e) => {
                      const result = clienteFinalRutValidator.handleChange(e.target.value);
                      setClienteFinalData(prev => ({ ...prev, rut: result.formattedValue }));
                    }}
                    placeholder="12.345.678-9"
                    className={clienteFinalRutValidator.error ? 'border-destructive' : ''}
                  />
                  {clienteFinalRutValidator.error && (
                    <p className="text-sm text-destructive mt-1">{clienteFinalRutValidator.error}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cliente-sitio">Sitio Web (opcional)</Label>
                  <Input
                    id="cliente-sitio"
                    value={clienteFinalData.sitio_web}
                    onChange={(e) => setClienteFinalData(prev => ({ ...prev, sitio_web: e.target.value }))}
                    placeholder="www.empresa.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="cliente-direccion">Dirección (opcional)</Label>
                  <Input
                    id="cliente-direccion"
                    value={clienteFinalData.direccion}
                    onChange={(e) => setClienteFinalData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección de la empresa"
                  />
                </div>
              </div>
            </div>
          )}
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
