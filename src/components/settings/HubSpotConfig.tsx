import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Key, Unplug } from 'lucide-react';

const HubSpotConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  useEffect(() => {
    loadExistingConfig();
  }, [user]);

  const loadExistingConfig = async () => {
    if (!user) return;

    try {
      // Load only the active token for the user
      const { data, error } = await supabase
        .from('hubspot_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('activo', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading HubSpot config:', error);
        return;
      }

      if (data) {
        setIsConfigured(true);
        setApiKey('••••••••••••••••'); // Masked token display
        setLastTestedAt(data.updated_at);
        setIsConnectionTested(true); // If already saved, consider it tested
      }
    } catch (error) {
      console.error('Error loading HubSpot config:', error);
    }
  };

  const disconnectFromHubSpot = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del usuario",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDisconnecting(true);

      // Deactivate all active tokens for this user
      const { error } = await supabase
        .from('hubspot_api_keys')
        .update({ activo: false })
        .eq('user_id', user.id)
        .eq('activo', true);

      if (error) {
        console.error('Error disconnecting from HubSpot:', error);
        throw new Error(error.message || 'Error al desconectar de HubSpot');
      }

      // Update local state
      setIsConfigured(false);
      setApiKey('');
      setIsConnectionTested(false);
      setLastTestedAt(null);

      toast({
        title: "Desconectado exitosamente",
        description: "Tu cuenta ha sido desconectada de HubSpot. Los tokens se han desactivado pero no eliminado."
      });

    } catch (error) {
      console.error('Error disconnecting from HubSpot:', error);
      toast({
        title: "Error",
        description: "No se pudo desconectar de HubSpot. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const testConnection = async () => {
    if (!user || !apiKey.trim() || apiKey === '••••••••••••••••') {
      toast({
        title: "Error",
        description: "Por favor ingresa un token de acceso válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTesting(true);

      const response = await fetch('/api/hubspot-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'test_connection_temp',
          apiKey: apiKey.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsConnectionTested(true);
        toast({
          title: "Conexión exitosa",
          description: "El token de HubSpot es válido. Ya puedes guardarlo.",
          duration: 5000
        });
      } else {
        setIsConnectionTested(false);
        throw new Error(result.error || 'Error en la conexión');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setIsConnectionTested(false);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con HubSpot. Verifica que el token sea válido.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveApiKey = async () => {
    if (!user || !apiKey.trim() || !isConnectionTested) {
      toast({
        title: "Error",
        description: "Debes probar la conexión antes de guardar el token",
        variant: "destructive"
      });
      return;
    }

    // Don't save if it's the masked display
    if (apiKey === '••••••••••••••••') {
      toast({
        title: "Error",
        description: "Por favor ingresa un token de acceso válido",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/hubspot-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'save_api_key',
          apiKey: apiKey.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsConfigured(true);
        setApiKey('••••••••••••••••'); // Mask the saved token
        setLastTestedAt(new Date().toISOString());
        toast({
          title: "Token guardado",
          description: "El token de acceso de HubSpot se ha guardado correctamente y está ahora activo"
        });
      } else {
        throw new Error(result.error || 'Error al guardar el token');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el token de acceso",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setIsConnectionTested(false); // Reset connection test when token changes
    if (isConfigured && value !== '••••••••••••••••') {
      setIsConfigured(false); // Mark as not configured if user changes the masked value
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Token de Acceso de Private App</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hubspot-token">Token de acceso de Private App</Label>
            <div className="relative mt-1">
              <Input
                id="hubspot-token"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="pr-10"
                disabled={isConfigured}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Copia y pega aquí el token de acceso de tu Private App de HubSpot
            </p>
          </div>

          <div className="flex space-x-3">
            {!isConfigured ? (
              <>
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTesting || !apiKey.trim() || apiKey === '••••••••••••••••'}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    'Probar Conexión'
                  )}
                </Button>

                <Button 
                  onClick={saveApiKey} 
                  disabled={isLoading || !apiKey.trim() || apiKey === '••••••••••••••••' || !isConnectionTested}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Token'
                  )}
                </Button>
              </>
            ) : (
              <Button 
                variant="destructive"
                onClick={disconnectFromHubSpot}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <Unplug className="w-4 h-4 mr-2" />
                    Desconectar de HubSpot
                  </>
                )}
              </Button>
            )}
          </div>

          {isConnectionTested && !isConfigured && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-md">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Conexión exitosa. El token está listo para guardarse.
              </span>
            </div>
          )}

          {isConfigured && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Token configurado y activo correctamente
                {lastTestedAt && (
                  <span className="block text-xs text-green-600">
                    Última verificación: {new Date(lastTestedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información sobre Private Apps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Para obtener tu token de acceso de Private App:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Ve a tu cuenta de HubSpot</li>
              <li>Navega a Settings → Integrations → Private Apps</li>
              <li>Crea una nueva Private App o selecciona una existente</li>
              <li>Copia el Access Token generado</li>
              <li>Pégalo en el campo de arriba</li>
            </ol>
            <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-md mt-4">
              <AlertCircle className="w-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Importante:</p>
                <p>Asegúrate de que tu Private App tenga los permisos necesarios para acceder a los deals y pipelines de HubSpot.</p>
                <p className="mt-1">El último token guardado será el token activo para tu cuenta.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HubSpotConfig;
