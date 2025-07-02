
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PresupuestoEstadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fechaVencimiento: string;
  onFechaVencimientoChange: (fecha: string) => void;
  onConfirmar: () => void;
  procesando: boolean;
}

const PresupuestoEstadoDialog: React.FC<PresupuestoEstadoDialogProps> = ({
  open,
  onOpenChange,
  fechaVencimiento,
  onFechaVencimientoChange,
  onConfirmar,
  procesando
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Presupuesto</DialogTitle>
          <DialogDescription>
            Establezca la fecha de vencimiento para este presupuesto. Después de esta fecha, 
            el presupuesto será marcado automáticamente como vencido.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
            <Input
              id="fechaVencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => onFechaVencimientoChange(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirmar}
            disabled={!fechaVencimiento || procesando}
          >
            {procesando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Presupuesto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PresupuestoEstadoDialog;
