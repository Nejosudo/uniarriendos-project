'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
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

  if (!nombre || !email || !password) {
    return { error: 'Por favor, completa todos los campos' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: nombre,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/explorar')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

