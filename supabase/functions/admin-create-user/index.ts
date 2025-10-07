import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 [admin-create-user] Function invoked');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to verify the admin making the request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [admin-create-user] No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ [admin-create-user] Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .rpc('check_is_admin', { _user_id: user.id });

    if (adminCheckError || !isAdmin) {
      console.error('❌ [admin-create-user] Not admin or error checking admin status:', adminCheckError);
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password } = await req.json();

    if (!email || !password) {
      console.error('❌ [admin-create-user] Missing email or password');
      return new Response(
        JSON.stringify({ success: false, error: 'Email and password are required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      console.error('❌ [admin-create-user] Password too short');
      return new Response(
        JSON.stringify({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👤 [admin-create-user] Creating user:', email);

    // Create user using admin client
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (createError) {
      console.error('❌ [admin-create-user] Error creating user:', createError);
      
      // Traducir errores comunes al español
      let errorMessage = createError.message;
      const errorCode = createError.code || '';
      const statusCode = createError.status || 400;
      
      // Verificar por código de error primero (más confiable)
      if (errorCode === 'email_exists' || 
          errorMessage.toLowerCase().includes('already been registered') || 
          errorMessage.toLowerCase().includes('email address has already')) {
        errorMessage = 'Ya existe un usuario con este correo electrónico';
      } else if (errorMessage.toLowerCase().includes('password')) {
        errorMessage = 'La contraseña no cumple con los requisitos mínimos de seguridad';
      } else if (errorMessage.toLowerCase().includes('invalid email')) {
        errorMessage = 'El correo electrónico no es válido';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [admin-create-user] User created successfully:', newUser.user?.id);

    // Create profile for the new user
    if (newUser.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: newUser.user.email,
          nombre: null,
          apellido: null,
          empresa: null
        });

      if (profileError) {
        console.error('⚠️ [admin-create-user] Error creating profile:', profileError);
        // Don't fail the entire operation for profile creation error
      } else {
        console.log('✅ [admin-create-user] Profile created successfully');
      }

      // Assign default 'user' role (this should be handled by the trigger, but let's ensure it)
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'user'
        });

      if (roleError) {
        console.error('⚠️ [admin-create-user] Error assigning role:', roleError);
        // Don't fail the entire operation for role assignment error
      } else {
        console.log('✅ [admin-create-user] Default role assigned successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          created_at: newUser.user?.created_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [admin-create-user] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})