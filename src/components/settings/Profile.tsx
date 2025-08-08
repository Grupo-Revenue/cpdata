import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, CheckCircle2, XCircle, LogOut } from "lucide-react";
const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Debe tener al menos 8 caracteres"),
    newPassword: z.string().min(8, "Debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["newPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Profile = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordChecks = React.useMemo(() => {
    const np = form.watch("newPassword") || "";
    return {
      length: np.length >= 8,
      upper: /[A-Z]/.test(np),
      lower: /[a-z]/.test(np),
      number: /[0-9]/.test(np),
      symbol: /[^A-Za-z0-9]/.test(np),
    };
  }, [form]);

  const strength = React.useMemo(() => {
    const values = Object.values(passwordChecks);
    const count = values.filter(Boolean).length;
    return (count / 5) * 100;
  }, [passwordChecks]);

  const strengthLabel = React.useMemo(() => {
    if (strength < 40) return "Débil";
    if (strength < 80) return "Media";
    return "Fuerte";
  }, [strength]);
  const onSubmit = async (values: PasswordFormValues) => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "No hay sesión activa",
        description: "Vuelve a iniciar sesión e intenta nuevamente.",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar contraseña actual
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      });

      if (verifyError) {
        toast({
          variant: "destructive",
          title: "Contraseña actual incorrecta",
          description: "Verifica tu contraseña actual e inténtalo de nuevo.",
        });
        return;
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        toast({
          variant: "destructive",
          title: "No se pudo actualizar la contraseña",
          description: updateError.message || "Intenta nuevamente en unos minutos.",
        });
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Por seguridad, cerraremos tu sesión para que vuelvas a ingresar.",
      });

      // Cerrar sesión por seguridad
      await signOut();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: e?.message ?? "Ocurrió un error al cambiar la contraseña.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' as any });
      toast({
        title: "Sesión cerrada en todos los dispositivos",
        description: "Se revocaron tus sesiones activas.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "No se pudo cerrar la sesión global",
        description: e?.message ?? "Inténtalo nuevamente.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
        <CardDescription>
          Gestiona la información de tu perfil y tu seguridad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="account-info">
          <h3 id="account-info" className="text-lg font-medium tracking-tight">Información de la cuenta</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Estos datos identifican tu cuenta.
          </p>
          <div className="mt-4 grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input value={user?.email ?? ""} readOnly aria-readonly autoComplete="email" />
            </div>
          </div>
        </section>

        <Separator />

        <section aria-labelledby="security">
          <h3 id="security" className="text-lg font-medium tracking-tight">Seguridad</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cambia tu contraseña. Por seguridad, cerraremos tu sesión tras actualizarla.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4 max-w-md">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrent ? "text" : "password"}
                          autoComplete="current-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                          onClick={() => setShowCurrent((v) => !v)}
                          aria-label={showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          autoComplete="new-password"
                          aria-describedby="password-help"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                          onClick={() => setShowNew((v) => !v)}
                          aria-label={showNew ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <div className="space-y-2" id="password-help">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fortaleza de la contraseña</span>
                        <span className="font-medium">{strengthLabel}</span>
                      </div>
                      <Progress value={strength} className="h-2" />
                      <ul className="grid grid-cols-2 gap-2 text-xs">
                        <li className={passwordChecks.length ? "text-primary" : "text-muted-foreground"}>
                          <span className="inline-flex items-center gap-1">
                            {passwordChecks.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            8+ caracteres
                          </span>
                        </li>
                        <li className={passwordChecks.upper ? "text-primary" : "text-muted-foreground"}>
                          <span className="inline-flex items-center gap-1">
                            {passwordChecks.upper ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Mayúscula (A-Z)
                          </span>
                        </li>
                        <li className={passwordChecks.lower ? "text-primary" : "text-muted-foreground"}>
                          <span className="inline-flex items-center gap-1">
                            {passwordChecks.lower ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Minúscula (a-z)
                          </span>
                        </li>
                        <li className={passwordChecks.number ? "text-primary" : "text-muted-foreground"}>
                          <span className="inline-flex items-center gap-1">
                            {passwordChecks.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Número (0-9)
                          </span>
                        </li>
                        <li className={passwordChecks.symbol ? "text-primary" : "text-muted-foreground"}>
                          <span className="inline-flex items-center gap-1">
                            {passwordChecks.symbol ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Símbolo (!@#$%)
                          </span>
                        </li>
                      </ul>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Actualizar contraseña"}
                </Button>
                <Button type="button" variant="outline" onClick={handleGlobalSignOut}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión en todos los dispositivos
                </Button>
              </div>
            </form>
          </Form>
        </section>
      </CardContent>
    </Card>
  );
};

export default Profile;
