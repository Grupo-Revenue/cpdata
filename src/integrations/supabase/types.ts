export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      budget_terms_config: {
        Row: {
          certificacion_texto: string
          condicion_comercial_1: string | null
          condicion_comercial_2: string | null
          condicion_comercial_3: string | null
          condicion_comercial_4: string | null
          condicion_comercial_5: string | null
          condicion_comercial_6: string | null
          created_at: string
          documento_texto: string
          forma_pago: string
          id: string
          moneda: string
          observacion_1: string
          observacion_2: string
          observacion_3: string
          observacion_4: string
          observacion_5: string
          observacion_6: string
          precios_incluyen: string
          terminos_garantias: string
          terminos_pago_entrega: string
          tiempo_entrega: string
          updated_at: string
          validez_oferta: string
        }
        Insert: {
          certificacion_texto?: string
          condicion_comercial_1?: string | null
          condicion_comercial_2?: string | null
          condicion_comercial_3?: string | null
          condicion_comercial_4?: string | null
          condicion_comercial_5?: string | null
          condicion_comercial_6?: string | null
          created_at?: string
          documento_texto?: string
          forma_pago?: string
          id?: string
          moneda?: string
          observacion_1?: string
          observacion_2?: string
          observacion_3?: string
          observacion_4?: string
          observacion_5?: string
          observacion_6?: string
          precios_incluyen?: string
          terminos_garantias?: string
          terminos_pago_entrega?: string
          tiempo_entrega?: string
          updated_at?: string
          validez_oferta?: string
        }
        Update: {
          certificacion_texto?: string
          condicion_comercial_1?: string | null
          condicion_comercial_2?: string | null
          condicion_comercial_3?: string | null
          condicion_comercial_4?: string | null
          condicion_comercial_5?: string | null
          condicion_comercial_6?: string | null
          created_at?: string
          documento_texto?: string
          forma_pago?: string
          id?: string
          moneda?: string
          observacion_1?: string
          observacion_2?: string
          observacion_3?: string
          observacion_4?: string
          observacion_5?: string
          observacion_6?: string
          precios_incluyen?: string
          terminos_garantias?: string
          terminos_pago_entrega?: string
          tiempo_entrega?: string
          updated_at?: string
          validez_oferta?: string
        }
        Relationships: []
      }
      business_number_audit: {
        Row: {
          assigned_at: string | null
          business_number: number
          created_at: string | null
          id: string
          negocio_id: string | null
          notes: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          business_number: number
          created_at?: string | null
          id?: string
          negocio_id?: string | null
          notes?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          business_number?: number
          created_at?: string | null
          id?: string
          negocio_id?: string | null
          notes?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      configuracion_marca: {
        Row: {
          color_primario: string | null
          color_secundario: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre_empresa: string
          sitio_web: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre_empresa?: string
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre_empresa?: string
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contactos: {
        Row: {
          apellido: string
          cargo: string | null
          created_at: string
          email: string
          hubspot_id: string | null
          id: string
          nombre: string
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apellido: string
          cargo?: string | null
          created_at?: string
          email: string
          hubspot_id?: string | null
          id?: string
          nombre: string
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apellido?: string
          cargo?: string | null
          created_at?: string
          email?: string
          hubspot_id?: string | null
          id?: string
          nombre?: string
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contador_global: {
        Row: {
          id: number
          ultimo_numero: number
          updated_at: string
        }
        Insert: {
          id?: number
          ultimo_numero?: number
          updated_at?: string
        }
        Update: {
          id?: number
          ultimo_numero?: number
          updated_at?: string
        }
        Relationships: []
      }
      contadores_usuario: {
        Row: {
          contador_negocio: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contador_negocio?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contador_negocio?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          created_at: string
          direccion: string | null
          hubspot_id: string | null
          id: string
          nombre: string
          rut: string | null
          sitio_web: string | null
          tipo: Database["public"]["Enums"]["tipo_empresa"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          hubspot_id?: string | null
          id?: string
          nombre: string
          rut?: string | null
          sitio_web?: string | null
          tipo: Database["public"]["Enums"]["tipo_empresa"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          hubspot_id?: string | null
          id?: string
          nombre?: string
          rut?: string | null
          sitio_web?: string | null
          tipo?: Database["public"]["Enums"]["tipo_empresa"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hubspot_api_keys: {
        Row: {
          activo: boolean
          api_key: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          api_key: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          api_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hubspot_stage_mapping: {
        Row: {
          created_at: string
          estado_negocio: Database["public"]["Enums"]["estado_negocio"]
          id: string
          stage_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado_negocio: Database["public"]["Enums"]["estado_negocio"]
          id?: string
          stage_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado_negocio?: Database["public"]["Enums"]["estado_negocio"]
          id?: string
          stage_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hubspot_sync_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          hubspot_deal_id: string | null
          id: string
          max_retries: number | null
          negocio_id: string
          operation_type: string
          processed_at: string | null
          request_payload: Json | null
          response_payload: Json | null
          retry_count: number | null
          status: string | null
          trigger_source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          hubspot_deal_id?: string | null
          id?: string
          max_retries?: number | null
          negocio_id: string
          operation_type: string
          processed_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          hubspot_deal_id?: string | null
          id?: string
          max_retries?: number | null
          negocio_id?: string
          operation_type?: string
          processed_at?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          retry_count?: number | null
          status?: string | null
          trigger_source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lineas_producto: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          orden: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      negocios: {
        Row: {
          cantidad_asistentes: number | null
          cantidad_invitados: number | null
          cliente_final_id: string | null
          contacto_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_negocio"]
          fecha_cierre: string | null
          fecha_evento: string | null
          horas_acreditacion: string
          hubspot_id: string | null
          id: string
          locacion: string
          nombre_evento: string
          numero: number
          productora_id: string | null
          tipo_evento: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cantidad_asistentes?: number | null
          cantidad_invitados?: number | null
          cliente_final_id?: string | null
          contacto_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_negocio"]
          fecha_cierre?: string | null
          fecha_evento?: string | null
          horas_acreditacion: string
          hubspot_id?: string | null
          id?: string
          locacion: string
          nombre_evento: string
          numero: number
          productora_id?: string | null
          tipo_evento: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cantidad_asistentes?: number | null
          cantidad_invitados?: number | null
          cliente_final_id?: string | null
          contacto_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_negocio"]
          fecha_cierre?: string | null
          fecha_evento?: string | null
          horas_acreditacion?: string
          hubspot_id?: string | null
          id?: string
          locacion?: string
          nombre_evento?: string
          numero?: number
          productora_id?: string | null
          tipo_evento?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocios_cliente_final_id_fkey"
            columns: ["cliente_final_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_productora_id_fkey"
            columns: ["productora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_presupuesto"]
          facturado: boolean | null
          fecha_aprobacion: string | null
          fecha_envio: string | null
          fecha_rechazo: string | null
          fecha_vencimiento: string | null
          id: string
          negocio_id: string
          nombre: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          facturado?: boolean | null
          fecha_aprobacion?: string | null
          fecha_envio?: string | null
          fecha_rechazo?: string | null
          fecha_vencimiento?: string | null
          id?: string
          negocio_id: string
          nombre: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          facturado?: boolean | null
          fecha_aprobacion?: string | null
          fecha_envio?: string | null
          fecha_rechazo?: string | null
          fecha_vencimiento?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_biblioteca: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          descripcion: string | null
          id: string
          linea_producto_id: string | null
          nombre: string
          precio_base: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          linea_producto_id?: string | null
          nombre: string
          precio_base?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          linea_producto_id?: string | null
          nombre?: string
          precio_base?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_biblioteca_linea_producto_id_fkey"
            columns: ["linea_producto_id"]
            isOneToOne: false
            referencedRelation: "lineas_producto"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_presupuesto: {
        Row: {
          cantidad: number
          comentarios: string | null
          created_at: string
          descripcion: string | null
          descuento_porcentaje: number | null
          id: string
          nombre: string
          precio_unitario: number
          presupuesto_id: string
          sessions: Json | null
          total: number
        }
        Insert: {
          cantidad?: number
          comentarios?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_porcentaje?: number | null
          id?: string
          nombre: string
          precio_unitario: number
          presupuesto_id: string
          sessions?: Json | null
          total: number
        }
        Update: {
          cantidad?: number
          comentarios?: string | null
          created_at?: string
          descripcion?: string | null
          descuento_porcentaje?: number | null
          id?: string
          nombre?: string
          precio_unitario?: number
          presupuesto_id?: string
          sessions?: Json | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "productos_presupuesto_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string | null
          created_at: string
          email: string
          empresa: string | null
          id: string
          nombre: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          created_at?: string
          email: string
          empresa?: string | null
          id: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_budget_links: {
        Row: {
          access_count: number
          created_at: string
          created_by: string
          expires_at: string | null
          hubspot_property: string | null
          id: string
          is_active: boolean
          link_url: string | null
          negocio_id: string | null
          presupuesto_id: string
          updated_at: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by: string
          expires_at?: string | null
          hubspot_property?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          negocio_id?: string | null
          presupuesto_id: string
          updated_at?: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string
          expires_at?: string | null
          hubspot_property?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          negocio_id?: string | null
          presupuesto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_public_budget_links_presupuesto"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_budget_links_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_evento: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_presupuestos_vencidos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calcular_estado_negocio: {
        Args: { negocio_id_param: string }
        Returns: Database["public"]["Enums"]["estado_negocio"]
      }
      check_business_numbering_consistency: {
        Args: { p_user_id: string }
        Returns: {
          issue_type: string
          description: string
          expected_number: number
          actual_number: number
          negocio_id: string
        }[]
      }
      check_is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      enqueue_hubspot_sync: {
        Args: {
          p_negocio_id: string
          p_operation_type: string
          p_payload: Json
          p_priority?: number
          p_trigger_source?: string
        }
        Returns: string
      }
      fix_all_user_counters: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          old_counter: number
          max_used_number: number
          new_counter: number
          correction_applied: boolean
        }[]
      }
      get_global_hubspot_token: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          created_at: string
          activo: boolean
        }[]
      }
      get_hubspot_sync_stats: {
        Args: { p_user_id?: string }
        Returns: {
          total_pending: number
          total_success_today: number
          total_failed_today: number
          total_retrying: number
          avg_execution_time_ms: number
          last_sync_at: string
          success_rate_percentage: number
        }[]
      }
      get_next_business_number: {
        Args: Record<PropertyKey, never> | { p_user_id: string }
        Returns: number
      }
      get_public_budget_data: {
        Args: { p_negocio_id: string; p_presupuesto_id: string }
        Returns: {
          presupuesto_data: Json
          negocio_data: Json
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_business_number_assignment: {
        Args: {
          p_user_id: string
          p_business_number: number
          p_negocio_id?: string
          p_status?: string
          p_notes?: string
        }
        Returns: string
      }
      marcar_presupuesto_facturado: {
        Args: { presupuesto_id_param: string }
        Returns: undefined
      }
      recalcular_todos_estados_negocios: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      retry_failed_hubspot_syncs: {
        Args: { p_user_id?: string }
        Returns: number
      }
      run_numbering_system_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          maintenance_type: string
          affected_users: number
          corrections_made: number
          issues_found: number
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      estado_negocio:
        | "oportunidad_creada"
        | "presupuesto_enviado"
        | "parcialmente_aceptado"
        | "negocio_aceptado"
        | "negocio_cerrado"
        | "negocio_perdido"
      estado_presupuesto:
        | "borrador"
        | "publicado"
        | "aprobado"
        | "rechazado"
        | "vencido"
        | "cancelado"
      tipo_empresa: "productora" | "cliente_final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      estado_negocio: [
        "oportunidad_creada",
        "presupuesto_enviado",
        "parcialmente_aceptado",
        "negocio_aceptado",
        "negocio_cerrado",
        "negocio_perdido",
      ],
      estado_presupuesto: [
        "borrador",
        "publicado",
        "aprobado",
        "rechazado",
        "vencido",
        "cancelado",
      ],
      tipo_empresa: ["productora", "cliente_final"],
    },
  },
} as const
