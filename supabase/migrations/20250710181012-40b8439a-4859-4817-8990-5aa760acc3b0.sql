-- ================================================================
-- MIGRACIÓN: CONTACTOS Y MAPEO DE ESTADOS GLOBALES (REVISADA)
-- ================================================================

-- 1. ACTUALIZAR TABLA CONTACTOS PARA SER GLOBAL
-- Eliminar constraints existentes si existen
ALTER TABLE public.contactos DROP CONSTRAINT IF EXISTS unique_contactos_user_email;
ALTER TABLE public.contactos DROP CONSTRAINT IF EXISTS unique_contactos_email;

-- Crear constraint única solo por email (global)
ALTER TABLE public.contactos ADD CONSTRAINT unique_contactos_email UNIQUE (email);

-- 2. ACTUALIZAR TABLA HUBSPOT_STAGE_MAPPING PARA SER GLOBAL
-- Eliminar constraint única por usuario para hacer el mapeo global
ALTER TABLE public.hubspot_stage_mapping DROP CONSTRAINT IF EXISTS unique_mapping_user_estado;
ALTER TABLE public.hubspot_stage_mapping DROP CONSTRAINT IF EXISTS unique_mapping_estado;

-- Crear constraint única solo por estado (global)
ALTER TABLE public.hubspot_stage_mapping ADD CONSTRAINT unique_mapping_estado UNIQUE (estado_negocio);

-- 3. ACTUALIZAR POLÍTICAS RLS PARA CONTACTOS (ACCESO GLOBAL)
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.contactos;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contactos;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can view all contacts" ON public.contactos;

-- Políticas globales para contactos
CREATE POLICY "Authenticated users can view all contacts globally" 
ON public.contactos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create contacts globally" 
ON public.contactos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts globally" 
ON public.contactos 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete contacts globally" 
ON public.contactos 
FOR DELETE 
TO authenticated
USING (true);

-- 4. ACTUALIZAR POLÍTICAS RLS PARA HUBSPOT_STAGE_MAPPING (ACCESO GLOBAL)
DROP POLICY IF EXISTS "Users can view their own stage mappings" ON public.hubspot_stage_mapping;
DROP POLICY IF EXISTS "Users can insert their own stage mappings" ON public.hubspot_stage_mapping;
DROP POLICY IF EXISTS "Users can update their own stage mappings" ON public.hubspot_stage_mapping;
DROP POLICY IF EXISTS "Users can delete their own stage mappings" ON public.hubspot_stage_mapping;

-- Políticas globales para mapeo de estados
CREATE POLICY "Authenticated users can view stage mappings globally" 
ON public.hubspot_stage_mapping 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage stage mappings globally" 
ON public.hubspot_stage_mapping 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 5. ACTUALIZAR POLÍTICAS RLS PARA EMPRESAS (ACCESO GLOBAL)
DROP POLICY IF EXISTS "Users can create their own companies" ON public.empresas;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.empresas;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.empresas;
DROP POLICY IF EXISTS "Authenticated users can view all companies" ON public.empresas;

-- Políticas globales para empresas
CREATE POLICY "Authenticated users can view all companies globally" 
ON public.empresas 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create companies globally" 
ON public.empresas 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies globally" 
ON public.empresas 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete companies globally" 
ON public.empresas 
FOR DELETE 
TO authenticated
USING (true);

-- 6. LIMPIAR CONTACTOS DUPLICADOS EXISTENTES
-- Mantener solo un contacto por email (el más reciente)
WITH duplicates AS (
  SELECT id, email, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM public.contactos
  WHERE email IN (
    SELECT email 
    FROM public.contactos 
    GROUP BY email 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM public.contactos 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 7. LIMPIAR MAPEO DE ESTADOS DUPLICADOS
-- Mantener solo un mapeo por estado (el más reciente)
WITH duplicate_mappings AS (
  SELECT id, estado_negocio,
         ROW_NUMBER() OVER (PARTITION BY estado_negocio ORDER BY created_at DESC) as rn
  FROM public.hubspot_stage_mapping
  WHERE estado_negocio IN (
    SELECT estado_negocio 
    FROM public.hubspot_stage_mapping 
    GROUP BY estado_negocio 
    HAVING COUNT(*) > 1
  )
)
DELETE FROM public.hubspot_stage_mapping 
WHERE id IN (
  SELECT id FROM duplicate_mappings WHERE rn > 1
);