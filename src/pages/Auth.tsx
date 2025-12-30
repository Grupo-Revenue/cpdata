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
import { useEmailValidator } from '@/hooks/useEmailValidator';

const Auth = () => {
  // Configuration to control signup visibility
  const SIGNUP_ENABLED = false;
  const {
    user,
    signIn,
    signUp,
    resetPassword,
    updatePassword
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPasswordForm, setNewPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const emailValidator = useEmailValidator();
  const { toast } = useToast();

  // Detect recovery mode from URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const type = hashParams.get('type') || queryParams.get('type');
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const errorParam = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    // Si hay error en la URL, mostrar mensaje
    if (errorParam) {
      toast({
        variant: 'destructive',
        title: 'Enlace inválido',
        description: errorDescription?.replace(/\+/g, ' ') || 'El enlace ha expirado. Solicita uno nuevo.'
      });
      // Limpiar la URL
      window.history.replaceState({}, '', '/auth');
      return;
    }
    
    // Si es tipo recovery, activar modo recuperación
    if (type === 'recovery' || accessToken) {
      console.log('[Auth] Recovery mode detected');
      setIsRecoveryMode(true);
    }
  }, [toast]);

  // Redirect if already authenticated (but not in recovery mode)
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (loginForm.email || '').trim();
    const password = loginForm.password || '';

    // Evita llamadas a /token con credenciales vacías
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Completa tus credenciales',
        description: 'Ingresa tu email y contraseña para iniciar sesión.'
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = resetEmail.trim();
    
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email requerido',
        description: 'Ingresa tu email para recuperar tu contraseña.'
      });
      return;
    }

    if (!emailValidator.validate(email)) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Ingresa un email válido.'
      });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    
    if (!error) {
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPasswordForm.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Contraseña muy corta',
        description: 'La contraseña debe tener al menos 6 caracteres.'
      });
      return;
    }
    
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Las contraseñas no coinciden',
        description: 'Asegúrate de que ambas contraseñas sean iguales.'
      });
      return;
    }
    
    setLoading(true);
    const { error } = await updatePassword(newPasswordForm.password);
    setLoading(false);
    
    if (!error) {
      setIsRecoveryMode(false);
      window.history.replaceState({}, '', '/auth');
      navigate('/');
    }
  };

  // Recovery mode view - set new password
  if (isRecoveryMode && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        {loading && <LoadingOverlay message="Actualizando..." />}
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña para completar la recuperación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPasswordForm.password}
                    onChange={e => setNewPasswordForm({
                      ...newPasswordForm,
                      password: e.target.value
                    })}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={newPasswordForm.confirmPassword}
                    onChange={e => setNewPasswordForm({
                      ...newPasswordForm,
                      confirmPassword: e.target.value
                    })}
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        {loading && <LoadingOverlay message="Enviando..." />}
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Recuperar Contraseña</CardTitle>
              <CardDescription>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Volver al login
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {loading && <LoadingOverlay message="Cargando..." />}
      <div className="w-full max-w-md">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className={`grid w-full ${SIGNUP_ENABLED ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="login">CPDATA</TabsTrigger>
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
                      onChange={e => setLoginForm({
                        ...loginForm,
                        email: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={e => setLoginForm({
                        ...loginForm,
                        password: e.target.value
                      })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
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
                          onChange={e => setSignupForm({
                            ...signupForm,
                            nombre: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          value={signupForm.apellido}
                          onChange={e => setSignupForm({
                            ...signupForm,
                            apellido: e.target.value
                          })}
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
                        onChange={e => setSignupForm({
                          ...signupForm,
                          email: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signupForm.password}
                        onChange={e => setSignupForm({
                          ...signupForm,
                          password: e.target.value
                        })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono (opcional)</Label>
                      <Input
                        id="telefono"
                        value={signupForm.telefono}
                        onChange={e => setSignupForm({
                          ...signupForm,
                          telefono: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empresa">Empresa (opcional)</Label>
                      <Input
                        id="empresa"
                        value={signupForm.empresa}
                        onChange={e => setSignupForm({
                          ...signupForm,
                          empresa: e.target.value
                        })}
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