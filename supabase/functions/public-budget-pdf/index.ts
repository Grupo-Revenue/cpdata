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

    // Get public link ID from request (supports both POST body and URL path)
    let publicId: string;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        publicId = body.publicId;
      } catch {
        // If body parsing fails, try URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1] || '';
        // Remove .pdf extension if present
        publicId = lastPart.replace('.pdf', '');
      }
    } else {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1] || '';
      // Remove .pdf extension if present
      publicId = lastPart.replace('.pdf', '');
    }

    if (!publicId) {
      console.log('No publicId provided');
      return new Response(
        JSON.stringify({ error: 'ID de link público requerido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing public link request for ID:', publicId);

    // Verify public link exists and is active
    const { data: publicLink, error: linkError } = await supabase
      .from('public_budget_links')
      .select('presupuesto_id, expires_at, is_active, access_count')
      .eq('id', publicId)
      .eq('is_active', true)
      .single();

    if (linkError || !publicLink) {
      console.log('Link no encontrado:', { publicId, linkError, publicLink });
      return new Response(
        JSON.stringify({ error: 'Link público no encontrado o inactivo' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Public link found:', { publicId, presupuestoId: publicLink.presupuesto_id, isActive: publicLink.is_active });

    // Check if link has expired
    if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
      console.log('Link expired:', { publicId, expiresAt: publicLink.expires_at });
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
      console.log('Presupuesto no encontrado:', { presupuestoId: publicLink.presupuesto_id, presupuestoError });
      return new Response(
        JSON.stringify({ error: 'Presupuesto no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Presupuesto found:', { presupuestoId: presupuesto.id, nombre: presupuesto.nombre });

    // Get business data - simplified query to handle null foreign keys
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .select(`
        *,
        contactos (*)
      `)
      .eq('id', presupuesto.negocio_id)
      .single();

    if (negocioError || !negocio) {
      console.log('Negocio no encontrado:', { negocioId: presupuesto.negocio_id, negocioError });
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Negocio found:', { negocioId: negocio.id, nombreEvento: negocio.nombre_evento });

    // Get empresa data separately to handle null values
    let clienteFinal = null;
    let productora = null;

    if (negocio.cliente_final_id) {
      const { data: clienteData } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', negocio.cliente_final_id)
        .single();
      clienteFinal = clienteData;
    }

    if (negocio.productora_id) {
      const { data: productoraData } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', negocio.productora_id)
        .single();
      productora = productoraData;
    }

    // Add empresa data to negocio object
    negocio.empresas = clienteFinal;
    negocio.productora = productora;

    // Increment access count in background
    supabase
      .from('public_budget_links')
      .update({ access_count: publicLink.access_count + 1 })
      .eq('id', publicId)
      .then(() => console.log('Access count updated'))
      .catch(err => console.log('Error updating access count:', err));

    // Return budget data
    const budgetData: BudgetData = {
      presupuesto: {
        ...presupuesto,
        productos: presupuesto.productos_presupuesto || []
      },
      negocio
    };

    console.log('Returning budget data successfully');
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