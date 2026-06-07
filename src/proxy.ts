/**
 * Punto de entrada del Proxy (Next.js 16+).
 * Reemplaza el antiguo middleware.ts — ver:
 * https://nextjs.org/docs/app/getting-started/proxy
 */
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
    return updateSession(request)
}

export const config = {
    matcher: [
        // Protección de rutas privadas
        '/dashboard/:path*',
        '/admin/:path*',
        '/login',
        '/registro',
        '/registro/confirmar',
        '/olvide-contrasena',
        '/restablecer-contrasena',
        '/auth/callback',
        /*
         * Refresco de sesión Supabase en el resto de rutas dinámicas.
         * Excluye estáticos e imágenes optimizadas.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
