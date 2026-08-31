'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { inferTipoUsuario } from '@/lib/usuarios/tipoUsuario'
import { authCallbackUrl } from '@/lib/auth/siteUrl'
import { validateNombre, validatePassword, sanitizeText } from '@/lib/validation'
import { checkRateLimit, rateLimitKey } from '@/lib/rateLimit'

export async function loginAction(prevState: any, formData: FormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const rl = checkRateLimit(rateLimitKey(ip, null, 'login'), 5, 60_000)
  if (!rl.ok) return { error: 'Demasiados intentos. Intenta en unos segundos.' }

  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('email not confirmed')) {
      return {
        error: 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
      }
    }
    return { error: 'Correo o contraseña incorrectos' }
  }

  revalidatePath('/', 'layout')
  redirect('/explorar')
}

export async function registerAction(prevState: any, formData: FormData) {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const rl = checkRateLimit(rateLimitKey(ip, null, 'registro'), 3, 60_000)
  if (!rl.ok) return { error: 'Demasiados intentos de registro. Espera un momento.' }

  const supabase = await createClient()

  const nombreRaw = formData.get('nombre') as string
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const aceptaTerminos = formData.get('aceptaTerminos') === 'on'

  if (!nombreRaw || !email || !password || !aceptaTerminos) {
    if (!aceptaTerminos) {
      return { error: 'Debes aceptar los términos y condiciones para registrarte' }
    }
    return { error: 'Por favor, completa todos los campos' }
  }

  const nombre = sanitizeText(nombreRaw, 60)
  const errNombre = validateNombre(nombre)
  if (errNombre) return { error: errNombre }
  const errPass = validatePassword(password)
  if (errPass) return { error: errPass }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Correo inválido' }

  const tipo = inferTipoUsuario(email)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: nombre,
        tipo,
      },
      emailRedirectTo: authCallbackUrl('/explorar'),
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session && data.user) {
    await supabase.from('perfiles').update({ tipo }).eq('id', data.user.id)
    try {
      const h = await headers()
      const ua = h.get('user-agent') || null
      const fwd = h.get('x-forwarded-for') || null
      const ipHash = fwd ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fwd.split(',')[0].trim())).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join('').slice(0,16)) : null
      await supabase.from('consentimientos').insert({ usuario_id: data.user.id, tipo: 'terminos', version: '2026-08-28', ip_hash: ipHash, user_agent: ua?.slice(0,256) })
      await supabase.from('consentimientos').insert({ usuario_id: data.user.id, tipo: 'privacidad', version: '2026-08-28', ip_hash: ipHash, user_agent: ua?.slice(0,256) })
    } catch {}
    revalidatePath('/', 'layout')
    redirect('/explorar')
  }

  redirect(`/registro/confirmar?email=${encodeURIComponent(email)}`)
}

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return { error: 'Ingresa tu correo electrónico.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl('/restablecer-contrasena'),
  })

  if (error) {
    return { error: 'No se pudo enviar el enlace. Verifica el correo e intenta de nuevo.' }
  }

  return {
    success: true,
    message: `Si existe una cuenta con ${email}, recibirás un enlace para restablecer tu contraseña.`,
  }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Completa ambos campos de contraseña.' }
  }

  const errPw = validatePassword(password)
  if (errPw) return { error: errPw }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'El enlace no es válido o expiró. Solicita uno nuevo.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'No se pudo actualizar la contraseña. Intenta de nuevo.' }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login?reset=ok')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
