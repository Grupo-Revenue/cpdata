import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil de Usuario</CardTitle>
        <CardDescription>
          Gestiona la información de tu perfil personal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium tracking-tight">Cambiar contraseña</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Por seguridad, cerraremos tu sesión tras actualizar la contraseña.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
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
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
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
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Profile;
