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
          tipo: 'unipaz' | 'externo';
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'usuario' | 'admin';
          tipo?: 'unipaz' | 'externo';
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          nombre_completo?: string | null;
          telefono?: string | null;
          avatar_url?: string | null;
          rol?: 'usuario' | 'admin';
          tipo?: 'unipaz' | 'externo';
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
      servicios: {
        Row: { id: number; nombre: string; icono: string | null };
        Insert: { id?: number; nombre: string; icono?: string | null };
        Update: { id?: number; nombre?: string; icono?: string | null };
      };
      propiedades_servicios: {
        Row: { propiedad_id: number; servicio_id: number };
        Insert: { propiedad_id: number; servicio_id: number };
        Update: { propiedad_id?: number; servicio_id?: number };
      };
      propiedades_fotos: {
        Row: { id: number; propiedad_id: number; url: string; created_at: string };
        Insert: { id?: number; propiedad_id: number; url: string; created_at?: string };
        Update: { id?: number; propiedad_id?: number; url?: string; created_at?: string };
      };
      favoritos: {
        Row: { id: number; usuario_id: string; propiedad_id: number; created_at: string };
        Insert: { id?: number; usuario_id: string; propiedad_id: number; created_at?: string };
        Update: { id?: number; usuario_id?: string; propiedad_id?: number; created_at?: string };
      };
      pqrs: {
        Row: {
          id: number;
          usuario_id: string;
          tipo: 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
          asunto: string;
          mensaje: string;
          estado: 'pendiente' | 'en_proceso' | 'resuelto';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          tipo: 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
          asunto: string;
          mensaje: string;
          estado?: 'pendiente' | 'en_proceso' | 'resuelto';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          tipo?: 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
          asunto?: string;
          mensaje?: string;
          estado?: 'pendiente' | 'en_proceso' | 'resuelto';
          created_at?: string;
          updated_at?: string;
        };
      };
      pqrs_respuestas: {
        Row: { id: number; pqrs_id: number; admin_id: string; mensaje: string; created_at: string };
        Insert: { id?: number; pqrs_id: number; admin_id: string; mensaje: string; created_at?: string };
        Update: { id?: number; pqrs_id?: number; admin_id?: string; mensaje?: string; created_at?: string };
      };
      suspensiones: {
        Row: {
          id: number;
          usuario_id: string;
          admin_id: string;
          nivel: 1 | 2 | 3;
          motivo: string | null;
          fecha_inicio: string;
          fecha_fin: string | null;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          admin_id: string;
          nivel: 1 | 2 | 3;
          motivo?: string | null;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          admin_id?: string;
          nivel?: 1 | 2 | 3;
          motivo?: string | null;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activa?: boolean;
          created_at?: string;
        };
      };
      resenas: {
        Row: {
          id: number;
          propiedad_id: number;
          usuario_id: string;
          calificacion: number;
          comentario: string;
          reportada: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          propiedad_id: number;
          usuario_id: string;
          calificacion: number;
          comentario: string;
          reportada?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          propiedad_id?: number;
          usuario_id?: string;
          calificacion?: number;
          comentario?: string;
          reportada?: boolean;
          created_at?: string;
        };
      };
      preguntas: {
        Row: {
          id: number;
          propiedad_id: number;
          usuario_id: string;
          pregunta: string;
          respuesta: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          propiedad_id: number;
          usuario_id: string;
          pregunta: string;
          respuesta?: string | null;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          propiedad_id?: number;
          usuario_id?: string;
          pregunta?: string;
          respuesta?: string | null;
          responded_at?: string | null;
          created_at?: string;
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
      consentimientos: {
        Row: { id: number; usuario_id: string; tipo: string; version: string; aceptado_at: string; ip_hash: string | null; user_agent: string | null };
        Insert: { id?: number; usuario_id: string; tipo: string; version: string; aceptado_at?: string; ip_hash?: string | null; user_agent?: string | null };
        Update: { id?: number; usuario_id?: string; tipo?: string; version?: string; aceptado_at?: string; ip_hash?: string | null; user_agent?: string | null };
      };
      fotos_validacion: {
        Row: { id: number; usuario_id: string | null; propiedad_id: number | null; foto_url: string | null; resultado: string; motivo: string | null; scores: Json | null; revisado_por: string | null; created_at: string };
        Insert: { id?: number; usuario_id?: string | null; propiedad_id?: number | null; foto_url?: string | null; resultado: string; motivo?: string | null; scores?: Json | null; revisado_por?: string | null; created_at?: string };
        Update: { id?: number; usuario_id?: string | null; propiedad_id?: number | null; foto_url?: string | null; resultado?: string; motivo?: string | null; scores?: Json | null; revisado_por?: string | null; created_at?: string };
      };
      admin_audit_log: {
        Row: { id: number; admin_id: string; accion: string; entidad: string; entidad_id: string | null; detalle: Json | null; created_at: string };
        Insert: { id?: number; admin_id: string; accion: string; entidad: string; entidad_id?: string | null; detalle?: Json | null; created_at?: string };
        Update: { id?: number; admin_id?: string; accion?: string; entidad?: string; entidad_id?: string | null; detalle?: Json | null; created_at?: string };
      };
    };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
