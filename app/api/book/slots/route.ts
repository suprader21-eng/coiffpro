import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Créneaux pris pour un employé + jour donné — public, bypass RLS
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const salonId    = searchParams.get('salonId')
  const employeeId = searchParams.get('employeeId')
  const from       = searchParams.get('from')
  const to         = searchParams.get('to')

  if (!salonId || !employeeId || !from || !to) {
    return NextResponse.json({ takenTimes: [] })
  }

  const db = getSupabaseAdmin()
  const { data: appts } = await db.from('appointments')
    .select('scheduled_at, duration_minutes')
    .eq('salon_id', salonId)
    .eq('employee_id', employeeId)
    .in('status', ['confirmed', 'pending'])
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)

  const takenTimes = (appts || []).map(a =>
    new Date(a.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )

  return NextResponse.json({ takenTimes })
}
