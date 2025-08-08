
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('recovery') === '1';
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isRecoveryMode) {
      navigate('/');
    }
  }, [user, navigate, isRecoveryMode]);


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

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { toast } = useToast();
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
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

  const handleSendRecoveryEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (recoveryLoading) return;

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const emailInput = (formData.get('recovery-email') as string) || loginForm.email;
    const email = (emailInput || '').trim();

    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email requerido',
        description: 'Ingresa tu email para enviar el enlace de recuperación.',
      });
      return;
    }

    try {
      setRecoveryLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?recovery=1`,
      });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error al enviar enlace',
          description: error.message,
        });
        return;
      }
      toast({
        title: 'Enlace enviado',
        description: 'Revisa tu correo para restablecer tu contraseña.',
      });
      setForgotOpen(false);
      setForgotEmail('');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Las contraseñas no coinciden',
        description: 'Asegúrate de que ambas contraseñas sean iguales.',
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar contraseña',
        description: error.message,
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Contraseña actualizada',
      description: 'Tu contraseña se ha restablecido correctamente.',
    });
    setIsRecoveryMode(false);
    setNewPassword('');
    setConfirmPassword('');
    setLoading(false);
    navigate('/');
  };

  // Recovery mode standalone view
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Restablecer contraseña</CardTitle>
              <CardDescription>
                Ingresa y confirma tu nueva contraseña para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
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
                  <div className="flex justify-end -mt-2">
                    <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="link" size="sm">
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Recuperar contraseña</DialogTitle>
                          <DialogDescription>
                            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendRecoveryEmail} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="recovery-email">Email</Label>
                            <Input
                              id="recovery-email"
                              name="recovery-email"
                              type="email"
                              value={forgotEmail || loginForm.email}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="tucorreo@ejemplo.com"
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={recoveryLoading}>
                              {recoveryLoading ? 'Enviando...' : 'Enviar enlace'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

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
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
