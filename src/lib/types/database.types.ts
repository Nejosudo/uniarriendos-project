export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre_completo: string | null;
          telefono: string | null;
          avatar_url: string | null;
          rol: 'usuario' | 'admin';
          tipo_usuario: 'unipaz' | 'externo';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'usuario' | 'admin';
          tipo_usuario?: 'unipaz' | 'externo';
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'usuario' | 'admin';
          tipo_usuario?: 'unipaz' | 'externo';
          created_at?: string;
          updated_at?: string | null;
        };
      };
      propiedades: {
        Row: {
          id: number;
          propietario_id: string;
          titulo: string;
          descripcion: string;
          precio: number;
          ubicacion_texto: string;
          ubicacion_lat: number | null;
          ubicacion_lng: number | null;
          estado: 'disponible' | 'ocupado' | 'inactivo';
          prioridad: 'comun' | 'recomendada';
          vivienda_compartida: boolean;
          perfil_arriendo: string | null;
          verificada: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          propietario_id: string;
          titulo: string;
          descripcion: string;
          precio: number;
          ubicacion_texto: string;
          ubicacion_lat?: number | null;
          ubicacion_lng?: number | null;
          estado?: 'disponible' | 'ocupado' | 'inactivo';
          prioridad?: 'comun' | 'recomendada';
          vivienda_compartida: boolean;
          perfil_arriendo?: string | null;
          verificada?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          propietario_id?: string;
          titulo?: string;
          descripcion?: string;
          precio?: number;
          ubicacion_texto?: string;
          ubicacion_lat?: number | null;
          ubicacion_lng?: number | null;
          estado?: 'disponible' | 'ocupado' | 'inactivo';
          prioridad?: 'comun' | 'recomendada';
          vivienda_compartida?: boolean;
          perfil_arriendo?: string | null;
          verificada?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      notificaciones: {
        Row: {
          id: number;
          usuario_id: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          enlace: string | null;
          metadata: Json | null;
          leida: boolean;
          created_at: string;
        };
        Insert: {
          usuario_id: string;
          tipo: string;
          titulo: string;
          mensaje: string;
          enlace?: string | null;
          metadata?: Json | null;
          leida?: boolean;
          created_at?: string;
        };
        Update: {
          usuario_id?: string;
          tipo?: string;
          titulo?: string;
          mensaje?: string;
          enlace?: string | null;
          metadata?: Json | null;
          leida?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
