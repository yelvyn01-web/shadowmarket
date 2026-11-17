import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type UserRole = 'customer' | 'admin'

export interface UserProfile {
  id: string
  fullName: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

/**
 * Server-side authoritative role resolver.
 * Queries Supabase database directly - NEVER trusts client-supplied roles or cookies alone.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      fullName: data.full_name,
      role: (data.role as UserRole) || 'customer',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (err) {
    console.error('Error fetching user profile from database:', err)
    return null
  }
}

/**
 * Returns current authenticated user and their verified database role.
 */
export async function getCurrentUserWithRole() {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, profile: null, isAdmin: false }
  }

  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.role === 'admin'

  return { user, profile, isAdmin }
}

/**
 * Server guard: throws error if caller is not authenticated.
 */
export async function requireAuth() {
  const { user, profile, isAdmin } = await getCurrentUserWithRole()
  if (!user) {
    throw new Error('UNAUTHORIZED: คุณต้องเข้าสู่ระบบก่อนดำเนินการ')
  }
  return { user, profile, isAdmin }
}

/**
 * Server guard: throws error if caller does not possess the 'admin' role in Supabase profiles.
 * Strictly prevents role escalation attacks.
 */
export async function requireAdmin() {
  const { user, profile, isAdmin } = await getCurrentUserWithRole()
  if (!user) {
    throw new Error('UNAUTHORIZED: คุณต้องเข้าสู่ระบบก่อนดำเนินการ')
  }
  if (!isAdmin) {
    throw new Error('FORBIDDEN: คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ (Admin Access Required)')
  }
  return { user, profile }
}
