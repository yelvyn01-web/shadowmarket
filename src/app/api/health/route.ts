import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('products').select('id').limit(1)

    const dbLatencyMs = Date.now() - startTime

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          database: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      platform: 'ShadowMarket Vault Engine',
      version: '2.0.0',
      region: 'sin1 (Singapore Edge)',
      database: 'connected (Supabase PostgreSQL)',
      dbLatencyMs,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: err?.message || 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
