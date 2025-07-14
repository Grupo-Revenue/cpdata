import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BudgetData {
  presupuesto: any;
  negocio: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get public link ID from URL
    const url = new URL(req.url);
    const publicId = url.pathname.split('/').pop();

    if (!publicId) {
      return new Response(
        JSON.stringify({ error: 'ID de link público requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify public link exists and is active
    const { data: publicLink, error: linkError } = await supabase
      .from('public_budget_links')
      .select('presupuesto_id, expires_at, is_active, access_count')
      .eq('id', publicId)
      .eq('is_active', true)
      .single();

    if (linkError || !publicLink) {
      console.log('Link no encontrado:', linkError);
      return new Response(
        JSON.stringify({ error: 'Link público no encontrado o inactivo' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if link has expired
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Link público ha expirado' }),
        { 
          status: 410, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get budget data
    const { data: presupuesto, error: presupuestoError } = await supabase
      .from('presupuestos')
      .select(`
        *,
        productos_presupuesto (*)
      `)
      .eq('id', publicLink.presupuesto_id)
      .single();

    if (presupuestoError || !presupuesto) {
      console.log('Presupuesto no encontrado:', presupuestoError);
      return new Response(
        JSON.stringify({ error: 'Presupuesto no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get business data
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select(`
        *,
        contactos (*),
        empresas!negocios_cliente_final_id_fkey (*),
        productora:empresas!negocios_productora_id_fkey (*)
      `)
      .eq('id', presupuesto.negocio_id)
      .single();

    if (negocioError || !negocio) {
      console.log('Negocio no encontrado:', negocioError);
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Increment access count in background
    supabase
      .from('public_budget_links')
      .update({ access_count: publicLink.access_count + 1 })
      .eq('id', publicId)
      .then(() => console.log('Access count updated'));

    // Return budget data
    const budgetData: BudgetData = {
      presupuesto: {
        ...presupuesto,
        productos: presupuesto.productos_presupuesto || []
      },
      negocio
    };

    return new Response(
      JSON.stringify(budgetData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en public-budget-pdf:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});