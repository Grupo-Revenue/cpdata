import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 [admin-delete-user] Function invoked');

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
      console.error('❌ [admin-delete-user] No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ [admin-delete-user] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .rpc('check_is_admin', { _user_id: user.id });

    if (adminCheckError || !isAdmin) {
      console.error('❌ [admin-delete-user] Not admin or error checking admin status:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      console.error('❌ [admin-delete-user] Missing userId');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (user.id === userId) {
      console.error('❌ [admin-delete-user] Attempted self-deletion');
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user to delete is an admin and if they're the last admin
    const { data: userToDeleteIsAdmin } = await supabaseAdmin
      .rpc('check_is_admin', { _user_id: userId });

    if (userToDeleteIsAdmin) {
      // Count total admins
      const { data: adminCount, error: countError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id', { count: 'exact' })
        .eq('role', 'admin');

      if (countError) {
        console.error('❌ [admin-delete-user] Error counting admins:', countError);
        return new Response(
          JSON.stringify({ error: 'Error checking admin count' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent deletion of last admin
      if (adminCount && adminCount.length <= 1) {
        console.error('❌ [admin-delete-user] Attempted to delete last admin');
        return new Response(
          JSON.stringify({ error: 'Cannot delete the last administrator' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('👤 [admin-delete-user] Deleting user:', userId);

    // Delete user using admin client (this will cascade to profiles and user_roles)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('❌ [admin-delete-user] Error deleting user:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [admin-delete-user] User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [admin-delete-user] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})