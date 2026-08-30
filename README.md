# UniArriendos — Arriendos para UNIPAZ

Next.js 16 + Supabase + Cloudinary + Leaflet. Marketplace de arriendos para la comunidad UNIPAZ (Barrancabermeja).

## Requisitos

- Node 20+, pnpm
- Supabase CLI (`npm i -g supabase` o `npx supabase`)
- Cloudinary account (para fotos)
- (Opcional Fase 4) Gemini API key gratuita en aistudio.google.com

## Setup local (<10 min)

```bash
pnpm install
cp .env.example .env.local  # configurar NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, CLOUDINARY_*, NEXT_PUBLIC_SITE_URL=http://localhost:3000
npx supabase link --project-ref TU_REF  # vincula proyecto remoto
npx supabase db reset                    # aplica 000_baseline.sql + 001–009
pnpm dev
```

Abre http://localhost:3000

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # solo server
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Futuro IA (Fase 4)
GEMINI_API_KEY=
```

Configurar en Supabase Dashboard → Auth → URL Configuration: `http://localhost:3000/auth/callback` y URL producción.

## Migraciones

- `supabase/migrations/000_baseline.sql` — snapshot esquema base (generado Fase 0, reemplazar con `supabase db dump` real si tienes acceso remoto con datos)
- `001–009` — incrementales (PQRS, admin, suspensiones, reseñas, preguntas, notificaciones)
- No commitear `.env*`. Migraciones SÍ versionadas (`.gitignore` ya corregido).

## Roles

Primer admin: `UPDATE perfiles SET rol='admin' WHERE id='UUID'`

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm lint`
- `npx supabase gen types typescript --project-id TU_REF > src/lib/types/database.types.ts` — regenerar tipos

## Estado

Ver `documentacion/kanban.md` (proceso), `documentacion/etapa_final.md` (cierre) y `plan-report-2808.md` (roadmap 60%→100%).
