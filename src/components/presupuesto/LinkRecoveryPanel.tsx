
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Search, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { publicLinkRecoveryService } from '@/services/publicLinkRecoveryService';

interface LinkRecoveryPanelProps {
  presupuestoId: string;
  negocioId: string;
  onLinkCreated?: () => void;
}

const LinkRecoveryPanel: React.FC<LinkRecoveryPanelProps> = ({ 
  presupuestoId, 
  negocioId, 
  onLinkCreated 
}) => {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const result = await publicLinkRecoveryService.checkPresupuestoLinkStatus(presupuestoId);
      setStatus(result);
      
      if (result.hasLink) {
        toast({
          title: "Link encontrado",
          description: "Este presupuesto ya tiene un link público activo.",
        });
      } else if (result.isEligible) {
        toast({
          title: "Sin link público",
          description: "Este presupuesto es elegible pero no tiene link público.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No elegible",
          description: "Este presupuesto no es elegible para link público.",
        });
      }
    } catch (error) {
      console.error('Error checking status:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el estado del presupuesto.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const success = await publicLinkRecoveryService.createLinkForPresupuesto(presupuestoId, negocioId);
      
      if (success) {
        toast({
          title: "Link creado",
          description: "El link público ha sido creado exitosamente.",
        });
        
        // Actualizar estado y notificar al componente padre
        await handleCheckStatus();
        onLinkCreated?.();
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el link público. Revisa los logs para más detalles.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating link:', error);
      toast({
        title: "Error",
        description: "Error inesperado al crear el link público.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRecoverAll = async () => {
    setIsRecovering(true);
    try {
      const result = await publicLinkRecoveryService.recoverAllMissingLinks();
      
      toast({
        title: "Recuperación completada",
        description: `${result.success} links creados, ${result.failed} fallos de ${result.total} total.`,
      });
      
      // Verificar estado después de la recuperación
      await handleCheckStatus();
      onLinkCreated?.();
    } catch (error) {
      console.error('Error recovering links:', error);
      toast({
        title: "Error",
        description: "Error durante la recuperación masiva de links.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Diagnóstico y Recuperación de Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Verificar Estado
          </Button>

          {status && status.isEligible && !status.hasLink && (
            <Button
              variant="default"
              size="sm"
              onClick={handleCreateLink}
              disabled={isCreating}
              className="flex items-center gap-2"
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Crear Link
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecoverAll}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            {isRecovering ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Recuperar Todos
          </Button>
        </div>

        {/* Estado actual */}
        {status && (
          <div className="space-y-2">
            <h4 className="font-medium">Estado del Presupuesto:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status.isEligible ? "default" : "secondary"}>
                {status.isEligible ? "Elegible" : "No Elegible"}
              </Badge>
              <Badge variant={status.hasLink ? "default" : "destructive"}>
                {status.hasLink ? "Con Link" : "Sin Link"}
              </Badge>
              {status.presupuesto && (
                <>
                  <Badge variant="outline">
                    Estado: {status.presupuesto.estado}
                  </Badge>
                  {status.presupuesto.facturado && (
                    <Badge variant="outline" className="bg-green-50">
                      Facturado
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            {status.link && (
              <div className="text-sm text-muted-foreground">
                <strong>Link URL:</strong> {status.link.link_url}
              </div>
            )}
          </div>
        )}

        {/* Información de ayuda */}
        <div className="text-xs text-muted-foreground">
          <p><strong>Elegibles:</strong> Presupuestos publicados, aprobados o facturados</p>
          <p><strong>Verificar Estado:</strong> Revisa si este presupuesto tiene link público</p>
          <p><strong>Crear Link:</strong> Genera el link público manualmente</p>
          <p><strong>Recuperar Todos:</strong> Crea links para todos los presupuestos elegibles sin link</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkRecoveryPanel;
