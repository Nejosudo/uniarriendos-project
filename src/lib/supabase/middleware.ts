import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Rutas que exigen sesión activa */
const RUTAS_DASHBOARD = '/dashboard'
const RUTAS_ADMIN = '/admin'

/** Rutas solo para invitados (redirigen si ya hay sesión) */
const RUTAS_INVITADO = ['/login', '/registro', '/olvide-contrasena']

/** Nivel 3: solo perfil y PQRS en dashboard */
const RUTAS_NIVEL_3 = ['/dashboard/perfil', '/dashboard/pqrs']

function esRutaPermitidaNivel3(pathname: string): boolean {
    return RUTAS_NIVEL_3.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    )
}

type SuspensionRow = { nivel: number }

async function obtenerNivelSuspension(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
): Promise<number | null> {
    const { data, error } = await supabase.rpc('get_suspension_activa', {
        check_user_id: userId,
    })

    if (!error && data) {
        const row = (Array.isArray(data) ? data[0] : data) as SuspensionRow | undefined
        if (row?.nivel) return Number(row.nivel)
    }

    const { data: directo } = await supabase
        .from('suspensiones')
        .select('nivel')
        .eq('usuario_id', userId)
        .eq('activa', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return directo?.nivel != null ? Number(directo.nivel) : null
}

function redirectTo(request: NextRequest, pathname: string) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    return NextResponse.redirect(url)
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    // Invitado intenta acceder a dashboard → login
    if (pathname.startsWith(RUTAS_DASHBOARD) && !user) {
        return redirectTo(request, '/login')
    }

    // Invitado intenta acceder a admin → login
    if (pathname.startsWith(RUTAS_ADMIN) && !user) {
        return redirectTo(request, '/login')
    }

    // Usuario autenticado sin rol admin → home
    if (pathname.startsWith(RUTAS_ADMIN) && user) {
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single()

        if (!perfil || perfil.rol !== 'admin') {
            return redirectTo(request, '/')
        }
    }

    // Sesión activa en login/registro → explorar
    if (user && RUTAS_INVITADO.includes(pathname)) {
        return redirectTo(request, '/explorar')
    }

    // Restricciones por suspensión en dashboard
    if (user && pathname.startsWith(RUTAS_DASHBOARD)) {
        const nivel = await obtenerNivelSuspension(supabase, user.id)

        if (nivel !== null) {
            if (nivel >= 3 && !esRutaPermitidaNivel3(pathname)) {
                return redirectTo(request, '/dashboard/perfil')
            }

            if (nivel >= 2 && pathname.startsWith('/dashboard/favoritos')) {
                return redirectTo(request, '/dashboard/perfil')
            }

            if (
                pathname.startsWith('/dashboard/propiedades/crear') ||
                pathname.includes('/editar')
            ) {
                return redirectTo(request, nivel >= 3 ? '/dashboard/perfil' : '/dashboard/propiedades')
            }
        }
    }

    return supabaseResponse
}
