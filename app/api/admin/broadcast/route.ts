import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import nodemailer from 'nodemailer'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!
const ADMIN_SECRET = process.env.ADMIN_SECRET!

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    // Vérifier que c'est l'admin
    const db = getSupabaseAdmin()
    const { data: { user } } = await db.auth.getUser(auth)
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { subject, body, emails } = await req.json() as {
      subject: string
      body: string
      emails: { email: string; name: string }[]
    }

    if (!subject || !body || !emails?.length) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.coiffpro.fr',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || ADMIN_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    let ok = 0
    let fail = 0

    for (const { email, name } of emails) {
      try {
        const personalizedBody = body.replace(/\{nom\}/g, name)
        await transporter.sendMail({
          from: `CoiffPro <${ADMIN_EMAIL}>`,
          to: email,
          subject,
          text: personalizedBody,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <div style="font-size:20px;font-weight:700;margin-bottom:20px">✂ CoiffPro</div>
            <div style="font-size:15px;line-height:1.7;white-space:pre-wrap">${personalizedBody.replace(/\n/g, '<br>')}</div>
            <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999">
              CoiffPro · coiffpro.fr<br>
              Pour vous désabonner, répondez à cet email avec "Désabonnement".
            </div>
          </div>`,
        })
        ok++
      } catch {
        fail++
      }
    }

    return NextResponse.json({ ok, fail })
  } catch (e: any) {
    console.error('Broadcast error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
