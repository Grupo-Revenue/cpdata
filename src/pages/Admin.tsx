import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserTable } from '@/components/UserTable';
import { ProductTable } from '@/components/ProductTable';
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import { validate } from 'uuid';
import UpdateQuoteNamesButton from '@/components/admin/UpdateQuoteNamesButton';

const Admin = () => {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const { toast } = useToast()
	const router = useRouter()
	const session = useSession()
	const supabase = useSupabaseClient()

	useEffect(() => {
		const checkAdmin = async () => {
			if (session && session.user) {
				const { data: isAdmin, error } = await supabase
					.from('profiles')
					.select('is_admin')
					.eq('id', session.user.id)
					.single();

				if (error) {
					console.error('Error fetching admin status:', error);
					return;
				}

				if (!isAdmin?.is_admin) {
					router.push('/');
				}
			}
		};

		checkAdmin();
	}, [session, supabase, router]);

  const handleCreateUser = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      })
      return;
    }

    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            is_admin: false,
          }
        }
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return;
      }

      toast({
        title: "Success",
        description: "Usuario creado exitosamente.",
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona usuarios, productos y configuración del sistema</p>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        <UpdateQuoteNamesButton />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Crear Usuario</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Crear un nuevo usuario</AlertDialogTitle>
              <AlertDialogDescription>
                Ingrese el correo electrónico y la contraseña del nuevo usuario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" type="email" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" type="password" />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateUser}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UserTable />
        </TabsContent>
        <TabsContent value="productos">
          <ProductTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
