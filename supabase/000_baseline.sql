-- 000_baseline.sql — Snapshot del esquema base UniArriendos
-- Generado: 2026-08-28 (Fase 0 — Cimientos) — Actualizado: 2026-08-28 (Fase 3/4: 010–013)
-- Origen: inferido desde código + migraciones 001–009 + 010_consentimientos, 011_fotos_validacion, 012_indices_y_auditoria, 013_pqrs_respuestas_usuario. Reemplazar con `supabase db dump -f supabase/migrations/000_baseline.sql` cuando haya acceso remoto.
-- Uso: `supabase db reset` recrea BD desde este snapshot + incrementales 001–013.
-- Nota: Este archivo NO contiene datos, solo estructura. Equivale al "backup del esqueleto".

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum tipo_perfil (usado en perfiles.tipo)
DO $$ BEGIN CREATE TYPE public.tipo_perfil AS ENUM ('unipaz', 'externo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla perfiles (base, creada en Supabase Auth trigger)
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    telefono TEXT,
    avatar_url TEXT,
    rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario','admin')),
    tipo public.tipo_perfil NOT NULL DEFAULT 'externo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tabla propiedades (base)
CREATE TABLE IF NOT EXISTS public.propiedades (
    id BIGSERIAL PRIMARY KEY,
    propietario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    precio BIGINT NOT NULL,
    ubicacion_texto TEXT NOT NULL,
    ubicacion_lat DOUBLE PRECISION,
    ubicacion_lng DOUBLE PRECISION,
    estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible','ocupado','inactivo')),
    prioridad TEXT NOT NULL DEFAULT 'comun' CHECK (prioridad IN ('comun','recomendada')),
    vivienda_compartida BOOLEAN NOT NULL DEFAULT false,
    perfil_arriendo TEXT CHECK (perfil_arriendo IN ('hombres','mujeres','ambos')),
    verificada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Tabla servicios
CREATE TABLE IF NOT EXISTS public.servicios (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    icono TEXT
);

-- Tabla propiedades_servicios (M:N)
CREATE TABLE IF NOT EXISTS public.propiedades_servicios (
    propiedad_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    servicio_id BIGINT NOT NULL REFERENCES public.servicios(id) ON DELETE CASCADE,
    PRIMARY KEY (propiedad_id, servicio_id)
);

-- Tabla propiedades_fotos
CREATE TABLE IF NOT EXISTS public.propiedades_fotos (
    id BIGSERIAL PRIMARY KEY,
    propiedad_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla favoritos
CREATE TABLE IF NOT EXISTS public.favoritos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    propiedad_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, propiedad_id)
);

-- Tabla resenas (estructura inferida de resenasActions.ts + 005_resenas.sql)
CREATE TABLE IF NOT EXISTS public.resenas (
    id BIGSERIAL PRIMARY KEY,
    propiedad_id BIGINT NOT NULL REFERENCES public.propiedades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT NOT NULL,
    reportada BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resto de tablas se crean en migraciones 001–013
-- 001_pqrs.sql, 002_admin.sql, 006_preguntas.sql, 009_notificaciones.sql, 010_consentimientos.sql, 011_fotos_validacion.sql, 012_indices_y_auditoria.sql, 013_pqrs_respuestas_usuario.sql
-- Para esquema completo: `supabase db reset` aplica 000_baseline + 001–013 en orden.
