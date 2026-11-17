'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole, getUserProfile } from '@/lib/auth/roles'

export type AuthResponse = {
  success: boolean
  error?: string
  data?: any
}

const SignupSchema = z.object({
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  password: z.string().min(12, { message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษรเพื่อความปลอดภัยสูงสุด' }),
  fullName: z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  password: z.string().min(1, { message: 'กรุณากรอกรหัสผ่าน' }),
})

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
})

const ResetPasswordSchema = z.object({
  password: z.string().min(12, { message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 12 ตัวอักษร' }),
})

export async function signupAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const parsed = SignupSchema.safeParse({ email, password, fullName })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName || 'Customer',
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

  const parsed = LoginSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  }

  revalidatePath('/', 'layout')
  return { success: true, data }
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get('email') as string

  const parsed = ForgotPasswordSchema.safeParse({ email })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  try {
    let supabase: any
    try {
      supabase = await createServerClient()
    } catch {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/reset-password`,
    })

    if (error) {
      console.warn('[RECOVERY LOG] resetPasswordForEmail notice:', error.message)
    }

    // OWASP Anti-User-Enumeration: Always return identical generic success message
    return {
      success: true,
      data: {
        message: 'หากอีเมลนี้ลงทะเบียนไว้ในระบบ ลิงก์สำหรับรีเซ็ตรหัสผ่านได้ถูกจัดส่งไปยังอีเมลของคุณเรียบร้อยแล้ว',
      },
    }
  } catch (err: any) {
    console.error('[UNEXPECTED ERROR] forgotPasswordAction:', err?.message)
    return {
      success: true,
      data: {
        message: 'หากอีเมลนี้ลงทะเบียนไว้ในระบบ ลิงก์สำหรับรีเซ็ตรหัสผ่านได้ถูกจัดส่งไปยังอีเมลของคุณเรียบร้อยแล้ว',
      },
    }
  }
}

export async function resetPasswordAction(formData: FormData): Promise<AuthResponse> {
  const password = formData.get('password') as string

  const parsed = ResetPasswordSchema.safeParse({ password })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true, data: { message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว' } }
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }
  }
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

export async function getUserRoleAction() {
  return await getCurrentUserWithRole()
}

/**
 * Updates profile with STRICT ROLE ESCALATION PROTECTION.
 * Only 'full_name' can be updated by user. 'role' can NEVER be altered through this action!
 */
export async function updateProfileAction(formData: FormData): Promise<AuthResponse> {
  const fullName = formData.get('fullName') as string
  const attemptedRole = formData.get('role') as string

  if (attemptedRole && attemptedRole !== 'customer') {
    // Audit attempt and reject immediately
    return {
      success: false,
      error: 'SECURITY VIOLATION: ไม่อนุญาตให้แก้ไขสิทธิ์ผู้ใช้งาน (Role Escalation Blocked)',
    }
  }

  try {
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'คุณต้องเข้าสู่ระบบก่อนอัปเดตข้อมูล' }
    }

    // Only update full_name, NEVER touch role column
    const admin = createAdminClient()
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' }
  }
}
