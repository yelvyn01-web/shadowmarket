'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export type AuthResponse = {
  success: boolean
  error?: string
  data?: any
}

export async function signupAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || password.length < 6) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัวอักษร' }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || 'Customer',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, data }
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  revalidatePath('/', 'layout')
  return { success: true, data }
}

export async function signoutAction(): Promise<AuthResponse> {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getUserAction() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
