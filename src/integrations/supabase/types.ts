export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          id?: string
          nombre?: string
          telefono?: string
          updated_at?: string
          user_id?: string
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
      negocios: {
        Row: {
          cantidad_asistentes: number | null
          cantidad_invitados: number | null
          cliente_final_id: string | null
          contacto_id: string
          created_at: string
          estado: Database["public"]["Enums"]["estado_negocio"]
          fecha_evento: string | null
          horas_acreditacion: string
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
          fecha_evento?: string | null
          horas_acreditacion: string
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
          fecha_evento?: string | null
          horas_acreditacion?: string
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
          id: string
          negocio_id: string
          nombre: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          id?: string
          negocio_id: string
          nombre: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
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
          nombre?: string
          precio_base?: number
          updated_at?: string
        }
        Relationships: []
      }
      productos_presupuesto: {
        Row: {
          cantidad: number
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          precio_unitario: number
          presupuesto_id: string
          total: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          precio_unitario: number
          presupuesto_id: string
          total: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_unitario?: number
          presupuesto_id?: string
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
    }
    Enums: {
      app_role: "admin" | "user"
      estado_negocio: "activo" | "cerrado" | "cancelado"
      estado_presupuesto: "borrador" | "enviado" | "aprobado" | "rechazado"
      tipo_empresa: "productora" | "cliente_final"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      estado_negocio: ["activo", "cerrado", "cancelado"],
      estado_presupuesto: ["borrador", "enviado", "aprobado", "rechazado"],
      tipo_empresa: ["productora", "cliente_final"],
    },
  },
} as const
