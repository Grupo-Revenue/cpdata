
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

import { useToast } from '@/hooks/use-toast';
import LoadingOverlay from '@/components/ui/LoadingOverlay';


const Auth = () => {
  // Configuration to control signup visibility
  const SIGNUP_ENABLED = false;
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);


  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    telefono: '',
    empresa: ''
  });

  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = (loginForm.email || '').trim();
    const password = loginForm.password || '';

    // Evita llamadas a /token con credenciales vacías
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Completa tus credenciales',
        description: 'Ingresa tu email y contraseña para iniciar sesión.',
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
      // Force a full page refresh after successful login
      window.location.href = '/';
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, {
      nombre: signupForm.nombre,
      apellido: signupForm.apellido
    });
    setLoading(false);
  };




  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {loading && <LoadingOverlay message="Cargando..." />}
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className={`grid w-full ${SIGNUP_ENABLED ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            {SIGNUP_ENABLED && <TabsTrigger value="signup">Registrarse</TabsTrigger>}
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {SIGNUP_ENABLED && (
            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Cuenta</CardTitle>
                  <CardDescription>
                    Completa los datos para crear tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={signupForm.nombre}
                          onChange={(e) => setSignupForm({ ...signupForm, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          value={signupForm.apellido}
                          onChange={(e) => setSignupForm({ ...signupForm, apellido: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono (opcional)</Label>
                      <Input
                        id="telefono"
                        value={signupForm.telefono}
                        onChange={(e) => setSignupForm({ ...signupForm, telefono: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa (opcional)</Label>
                      <Input
                        id="empresa"
                        value={signupForm.empresa}
                        onChange={(e) => setSignupForm({ ...signupForm, empresa: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
