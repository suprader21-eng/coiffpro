'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase'

const D = {
  bg:'#0a0908', dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', light2:'#f5f3f0', border:'#f0ece5',
  muted:'#888', muted2:'#aaa', green:'#2e7d32', greenBg:'#e8f5e9',
}

type Appt = {
  id: string
  salon: { name: string; city?: string }
  service: { name: string; duration_minutes: number }
  employee?: { name: string }
  scheduled_at: string
  price_cents: number
  status: string
}

function BottomNav({ active }: { active: string }) {
  const tabs = [
    { id:'home',     label:'Accueil',  href:'/home',     icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" fill={on?'rgba(200,169,110,.15)':'none'}/></svg> },
    { id:'quartier', label:'Quartier',  href:'/quartier', icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3C11 3 6 8.5 6 12a5 5 0 0010 0c0-3.5-5-9-5-9z" stroke={on?D.gold:'#bbb'} strokeWidth="1.4" fill={on?'rgba(200,169,110,.12)':'none'}/><circle cx="11" cy="12" r="1.8" fill={on?D.gold:'#bbb'}/></svg> },
    { id:'rdv',      label:'Mes RDV',  href:'/rdv',      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke={on?D.gold:'#bbb'} strokeWidth="1.5"/><path d="M7 3v4M15 3v4M3 9h16" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id:'fidelite', label:'Fidélité', href:'/fidelite', icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 6.3H20l-5.5 4 2.1 6.4L11 15l-5.6 3.7 2.1-6.4L2 8.3h6.6L11 2z" stroke={on?D.gold:'#bbb'} strokeWidth="1.4" fill={on?'rgba(200,169,110,.15)':'none'} strokeLinejoin="round"/></svg> },
    { id:'profil',   label:'Profil',   href:'/profile',  icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke={on?D.gold:'#bbb'} strokeWidth="1.5"/><path d="M4 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, display:'flex', borderTop:`1px solid ${D.border}`, background:'#fff', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(t => {
        const on = active === t.id
        return <Link key={t.id} href={t.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 12px', gap:3, textDecoration:'none' }}>{t.icon(on)}<span style={{ fontSize:9, color:on?D.gold:'#bbb', fontWeight:on?600:400, fontFamily:"'Outfit',sans-serif" }}>{t.label}</span></Link>
      })}
    </div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
}

export default function RdvPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appt[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [hasClient, setHasClient] = useState(false)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}

    getBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !session.user.is_anonymous) {
        setHasSession(true)
        const res = await fetch('/api/client/me', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (res.ok) {
          const j = await res.json()
          setHasClient(!!j.client)
          setAppointments(j.appointments || [])
        }
      }
      setLoading(false)
    })
  }, [router])

  const now = new Date()
  const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= now && a.status !== 'cancelled')
  const past = appointments.filter(a => new Date(a.scheduled_at) < now || a.status === 'cancelled')

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.light }}>

      {/* Dark header */}
      <div style={{ background:`linear-gradient(155deg,${D.dark} 0%,${D.dark2} 100%)`, flexShrink:0 }}>
        <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
          </div>
        </div>
        <div style={{ padding:'8px 18px 20px' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:700, color:'#fff' }}>Mes rendez-vous</div>
          <div style={{ fontSize:12, color:D.fg2, marginTop:3 }}>Vos prochains et anciens RDV</div>
        </div>
      </div>

      {/* Content — fond clair */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'14px 16px', paddingBottom:90 }}>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <div style={{ fontSize:13, color:D.muted }}>Chargement…</div>
          </div>
        ) : !hasSession ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'32px 24px' }}>
            <div style={{ width:72, height:72, borderRadius:20, background:'#fff', border:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="7" width="24" height="20" rx="3" stroke={D.gold} strokeWidth="1.6"/>
                <path d="M10 4v6M22 4v6M4 13h24" stroke={D.gold} strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M10 19h4M18 19h4M10 23h4" stroke={D.gold} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, color:D.dark, fontWeight:700, marginBottom:8 }}>Suivez vos rendez-vous</div>
            <div style={{ fontSize:13, color:D.muted, lineHeight:1.6, marginBottom:24, maxWidth:260 }}>
              Réservez votre prochain rendez-vous et retrouvez ici l'historique de toutes vos visites.
            </div>
            <Link href="/home" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
              Trouver un salon →
            </Link>
            <div style={{ fontSize:11, color:D.muted2, marginTop:12, lineHeight:1.5 }}>
              Vos RDV apparaîtront ici après votre première réservation
            </div>
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'32px 24px' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, color:D.dark, fontWeight:700, marginBottom:8 }}>Aucun rendez-vous</div>
            {!hasClient && hasSession ? (
              <>
                <div style={{ fontSize:13, color:D.muted, lineHeight:1.6, marginBottom:24 }}>Vous avez déjà réservé ? Liez votre téléphone pour retrouver vos RDVs.</div>
                <Link href="/onboarding" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', marginBottom:10 }}>
                  Lier mon compte →
                </Link>
                <Link href="/home" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:'transparent', color:D.muted, border:`1px solid ${D.border}`, fontSize:13, fontWeight:600, textAlign:'center', textDecoration:'none' }}>
                  Réserver un RDV →
                </Link>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color:D.muted, lineHeight:1.6, marginBottom:24 }}>Réservez maintenant !</div>
                <Link href="/home" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none' }}>
                  Réserver un RDV →
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>À venir</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {upcoming.map(a => (
                    <div key={a.id} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:16, color:D.dark, fontWeight:700 }}>{a.salon?.name}</div>
                          <div style={{ fontSize:12, color:D.muted }}>{a.service?.name}</div>
                        </div>
                        <div style={{ background:D.greenBg, border:'1px solid rgba(46,125,50,.2)', borderRadius:6, padding:'3px 8px', fontSize:10, color:D.green, fontWeight:600 }}>Confirmé</div>
                      </div>
                      <div style={{ height:1, background:D.border, marginBottom:10 }} />
                      <div style={{ display:'flex', gap:16 }}>
                        <div><div style={{ fontSize:9, color:D.muted2, textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Date</div><div style={{ fontSize:12, color:D.dark, fontWeight:600 }}>{fmtDate(a.scheduled_at)}</div></div>
                        <div><div style={{ fontSize:9, color:D.muted2, textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Heure</div><div style={{ fontSize:12, color:D.dark, fontWeight:600 }}>{fmtTime(a.scheduled_at)}</div></div>
                        {a.employee && <div><div style={{ fontSize:9, color:D.muted2, textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Coiffeur</div><div style={{ fontSize:12, color:D.dark, fontWeight:600 }}>{a.employee.name}</div></div>}
                        <div style={{ marginLeft:'auto', textAlign:'right' }}><div style={{ fontSize:9, color:D.muted2, textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Prix</div><div style={{ fontSize:15, color:D.gold, fontWeight:700, fontFamily:"'Cormorant Garamond',serif" }}>{(a.price_cents/100).toFixed(0)}€</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Historique</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {past.map(a => (
                    <div key={a.id} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:12, padding:'12px 14px', opacity:0.7 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div>
                          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:14, color:D.dark, fontWeight:700 }}>{a.salon?.name}</div>
                          <div style={{ fontSize:11, color:D.muted }}>{a.service?.name} · {fmtDate(a.scheduled_at)}</div>
                        </div>
                        <div style={{ fontSize:13, color:D.gold, fontWeight:700, fontFamily:"'Cormorant Garamond',serif" }}>{(a.price_cents/100).toFixed(0)}€</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="rdv" />
    </div>
  )
}
