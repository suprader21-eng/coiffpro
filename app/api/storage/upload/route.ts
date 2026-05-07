import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: salon } = await admin.from('salons').select('id').eq('email', user.email!).single()
  if (!salon) return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string || 'photo' // 'logo' or 'photo'

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${salon.id}/${type}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('salon-photos')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data: { publicUrl } } = admin.storage.from('salon-photos').getPublicUrl(path)

  // Si c'est un logo → mettre à jour salon.logo_url
  if (type === 'logo') {
    await admin.from('salons').update({ logo_url: publicUrl }).eq('id', salon.id)
  } else {
    // Photo de galerie → insérer dans salon_photos
    await admin.from('salon_photos').insert({ salon_id: salon.id, url: publicUrl })
  }

  return NextResponse.json({ url: publicUrl })
}
