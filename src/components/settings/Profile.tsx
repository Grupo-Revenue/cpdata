import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";

import { Eye, EyeOff, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
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
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control: form.control, name: 'newPassword' }) || "";

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPwFocused, setNewPwFocused] = useState(false);

  const passwordChecks = React.useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

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
        description: "Tu contraseña se ha actualizado correctamente.",
      });

      // Refrescar la sesión sin cerrar sesión
      await supabase.auth.refreshSession();
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
          <CardDescription>
            Estos datos identifican tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input value={user?.email ?? ""} readOnly aria-readonly autoComplete="email" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          <CardDescription>
            Cambia tu contraseña. Te notificaremos cuando se actualice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          onFocus={() => setNewPwFocused(true)}
                          onBlur={() => setNewPwFocused(false)}
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
                    {(newPwFocused || newPassword.length > 0) && (
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
                    )}
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

              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Actualizar contraseña"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión en todos los dispositivos
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Cerrar sesión en todos los dispositivos?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto revocará todas tus sesiones activas. Podrás iniciar sesión nuevamente cuando quieras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleGlobalSignOut}>Cerrar sesión</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
