'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { inferTipoUsuario } from '@/lib/usuarios/tipoUsuario'
import { authCallbackUrl } from '@/lib/auth/siteUrl'

export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
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
  const supabase = await createClient()

  const nombre = formData.get('nombre') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const aceptaTerminos = formData.get('aceptaTerminos') === 'on'

  if (!nombre || !email || !password || !aceptaTerminos) {
    if (!aceptaTerminos) {
      return { error: 'Debes aceptar los términos y condiciones para registrarte' }
    }
    return { error: 'Por favor, completa todos los campos' }
  }

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

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

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
