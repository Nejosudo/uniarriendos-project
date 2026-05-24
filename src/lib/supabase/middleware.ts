import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RUTAS_NIVEL_3 = ['/dashboard/perfil', '/dashboard/pqrs'];

function esRutaPermitidaNivel3(pathname: string): boolean {
    return RUTAS_NIVEL_3.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    );
}

type SuspensionRow = { nivel: number };

async function obtenerNivelSuspension(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
): Promise<number | null> {
    const { data, error } = await supabase.rpc('get_suspension_activa', {
        check_user_id: userId,
    });

    if (!error && data) {
        const row = (Array.isArray(data) ? data[0] : data) as SuspensionRow | undefined;
        if (row?.nivel) return Number(row.nivel);
    }

    // Fallback directo si RPC aún no existe
    const { data: directo } = await supabase
        .from('suspensiones')
        .select('nivel')
        .eq('usuario_id', userId)
        .eq('activa', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return directo?.nivel != null ? Number(directo.nivel) : null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (!perfil || perfil.rol !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Restricciones por suspensión en rutas del dashboard
  if (user && pathname.startsWith('/dashboard')) {
    const nivel = await obtenerNivelSuspension(supabase, user.id)

    if (nivel !== null) {
      if (nivel >= 3 && !esRutaPermitidaNivel3(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/perfil'
        return NextResponse.redirect(url)
      }

      if (nivel >= 2 && pathname.startsWith('/dashboard/favoritos')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard/perfil'
        return NextResponse.redirect(url)
      }

      if (
        pathname.startsWith('/dashboard/propiedades/crear') ||
        pathname.includes('/editar')
      ) {
        const url = request.nextUrl.clone()
        url.pathname = nivel >= 3 ? '/dashboard/perfil' : '/dashboard/propiedades'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
