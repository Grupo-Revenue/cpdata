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

    console.log('🔍 [admin-create-user] Checking for orphan users...');

    // STEP 1: Check if user already exists in auth.users (orphan detection)
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const orphanUser = existingAuthUsers?.users.find(u => u.email === email);

    if (orphanUser) {
      console.log('👤 [admin-create-user] Found user in auth.users:', orphanUser.id);
      
      // Check if user has profile
      const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', orphanUser.id)
        .maybeSingle();
      
      if (profileCheckError) {
        console.error('❌ [admin-create-user] Error checking profile:', profileCheckError);
      }
      
      if (!existingProfile) {
        // ORPHAN USER DETECTED - Create missing profile and roles
        console.log('🔧 [admin-create-user] ORPHAN USER DETECTED - Creating missing profile and roles...');
        
        // Create missing profile
        const { error: createProfileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: orphanUser.id,
            email: orphanUser.email,
            nombre: null,
            apellido: null,
            empresa: null
          });
        
        if (createProfileError) {
          console.error('⚠️ [admin-create-user] Failed to create profile for orphan:', createProfileError);
          return new Response(
            JSON.stringify({ success: false, error: 'Error al corregir usuario existente' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('✅ [admin-create-user] Profile created for orphan user');
        
        // Ensure default role
        const { error: createRoleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: orphanUser.id,
            role: 'user'
          });
        
        if (createRoleError && createRoleError.code !== '23505') { // Ignore duplicates
          console.error('⚠️ [admin-create-user] Failed to create role for orphan:', createRoleError);
        } else {
          console.log('✅ [admin-create-user] Role assigned to orphan user');
        }
        
        // Update password
        const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          orphanUser.id,
          { password: password }
        );
        
        if (updatePasswordError) {
          console.error('⚠️ [admin-create-user] Failed to update password:', updatePasswordError);
        } else {
          console.log('✅ [admin-create-user] Password updated for orphan user');
        }
        
        // Return success with correction note
        return new Response(
          JSON.stringify({ 
            success: true,
            user: {
              id: orphanUser.id,
              email: orphanUser.email,
              created_at: orphanUser.created_at
            },
            corrected: true,
            message: 'Usuario corregido: se creó el perfil faltante'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Complete user already exists
        console.log('❌ [admin-create-user] Complete user already exists');
        return new Response(
          JSON.stringify({ success: false, error: 'Ya existe un usuario con este correo electrónico' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // STEP 2: Create new user (no orphan detected)
    console.log('👤 [admin-create-user] Creating new user:', email);

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

    // STEP 3: Profile is created automatically by trigger on_auth_user_created
    if (newUser.user) {
      console.log('✅ [admin-create-user] Profile created automatically by trigger');

      // STEP 4: Assign default 'user' role with ROLLBACK on failure
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'user'
        });

      if (roleError && roleError.code !== '23505') { // Ignore duplicate error
        console.error('❌ [admin-create-user] Error assigning role, ROLLING BACK...');
        
        // ROLLBACK: Delete user only (profile was created correctly by trigger)
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Error al asignar rol al usuario. La operación ha sido revertida.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('✅ [admin-create-user] Default role assigned successfully');
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