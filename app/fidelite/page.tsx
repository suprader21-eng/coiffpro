'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase'

const D = {
  bg:'#0a0908', dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', gold2:'#e8d4a8',
  fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', light2:'#f5f3f0', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
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

const REWARDS = [
  { pts:250, label:'Coupe -10%', icon:'✂', desc:'Réduction sur votre prochaine coupe' },
  { pts:500, label:'Produit offert', icon:'🧴', desc:'Un produit capillaire à choisir' },
  { pts:1000, label:'Coupe gratuite', icon:'⭐', desc:'Une coupe homme offerte' },
  { pts:2000, label:'Soin premium', icon:'💆', desc:'Un soin professionnel complet' },
]

export default function FidelitePage() {
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [visitCount, setVisitCount] = useState(0)
  const [hasSession, setHasSession] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}

    getBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !session.user.is_anonymous) {
        setHasSession(true)
        const res = await fetch('/api/client/me', { headers: { Authorization:`Bearer ${session.access_token}` } })
        if (res.ok) {
          const j = await res.json()
          const appts = j.appointments || []
          const total = appts.reduce((sum: number, a: any) => sum + (a.price_cents || 0), 0)
          setPoints(Math.round(total / 100))
          setVisitCount(appts.filter((a: any) => a.status !== 'cancelled').length)
        }
      }
      setLoading(false)
    })
  }, [router])

  const nextReward = REWARDS.find(r => r.pts > points)
  const prevPts = REWARDS.filter(r => r.pts <= points).slice(-1)[0]?.pts || 0
  const progress = nextReward ? Math.round(((points - prevPts) / (nextReward.pts - prevPts)) * 100) : 100

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
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:700, color:'#fff' }}>Programme fidélité</div>
          <div style={{ fontSize:12, color:D.fg2, marginTop:3 }}>Gagnez des points à chaque visite</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'16px', paddingBottom:90 }}>

        {!hasSession && !loading ? (
          <>
            {/* Carte teaser — dark gradient */}
            <div style={{ background:`linear-gradient(135deg,${D.dark},${D.dark2})`, borderRadius:16, padding:'20px 18px', marginBottom:16, border:'1px solid rgba(200,169,110,.2)', boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}>
              <div style={{ fontSize:10, color:D.gold, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>✦ Ma carte fidélité</div>
              <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:36, fontWeight:700, color:D.gold, lineHeight:1 }}>
                0 <span style={{ fontSize:16, color:'rgba(200,169,110,.6)' }}>pts</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(245,242,237,.4)', marginTop:4, marginBottom:14 }}>
                Commencez à réserver pour gagner des points
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width:'0%', background:`linear-gradient(90deg,${D.gold},${D.gold2})`, borderRadius:2 }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)' }}>
                <span>0</span><span>🎁 500 pts</span><span>🎁 1000 pts</span>
              </div>
            </div>

            {/* How it works */}
            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Comment ça marche</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {[
                { icon:'📅', title:'Réservez', desc:'Prenez RDV dans un salon CoiffPro' },
                { icon:'⭐', title:'Gagnez des points', desc:'1€ dépensé = 1 point fidélité' },
                { icon:'🎁', title:'Réclamez vos récompenses', desc:'Coupes gratuites, produits, soins...' },
              ].map(item => (
                <div key={item.title} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ fontSize:22, flexShrink:0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:13, color:D.dark, fontWeight:600 }}>{item.title}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/home" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
              Commencer à gagner des points →
            </Link>
          </>
        ) : (
          <>
            {/* Carte points — dark gradient (artifact exact) */}
            <div style={{ background:`linear-gradient(135deg,${D.dark},${D.dark2})`, borderRadius:16, padding:'20px 18px', marginBottom:16, border:'1px solid rgba(200,169,110,.2)', boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:10, color:D.gold, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 }}>✦ Ma carte fidélité</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:42, fontWeight:700, color:D.gold, lineHeight:1 }}>
                    {points} <span style={{ fontSize:18, color:'rgba(200,169,110,.6)' }}>pts</span>
                  </div>
                  <div style={{ fontSize:11, color:'rgba(245,242,237,.4)', marginTop:2 }}>
                    {points > 0 ? `+${points} pts avec ce RDV` : 'Commencez à réserver'}
                    {nextReward ? ` · prochain palier à ${nextReward.pts} pts` : ' · palier max atteint !'}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:D.fg2, marginBottom:4 }}>Visites</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:28, fontWeight:700, color:'#fff' }}>{visitCount}</div>
                </div>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg,${D.gold},${D.gold2})`, borderRadius:2, transition:'width .5s ease' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,255,255,.3)' }}>
                <span>0</span><span>🎁 500 pts</span><span>🎁 1000 pts</span>
              </div>
            </div>

            {/* Récompenses */}
            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Récompenses</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              {REWARDS.map(r => {
                const unlocked = points >= r.pts
                return (
                  <div key={r.pts} style={{ background:unlocked?'#fff':'#fff', border:`1px solid ${unlocked?'rgba(200,169,110,.4)':D.border}`, borderRadius:12, padding:'14px 12px', textAlign:'center', opacity:unlocked?1:0.6, boxShadow:unlocked?'0 2px 10px rgba(200,169,110,.15)':'none' }}>
                    <div style={{ fontSize:26, marginBottom:6 }}>{r.icon}</div>
                    <div style={{ fontSize:12, color:D.dark, fontWeight:600, marginBottom:3 }}>{r.label}</div>
                    <div style={{ fontSize:10, color:unlocked?D.gold:D.muted, fontWeight:unlocked?700:400 }}>
                      {unlocked ? '✓ Disponible !' : `${r.pts} pts`}
                    </div>
                  </div>
                )
              })}
            </div>

            <Link href="/home" style={{ display:'block', width:'100%', padding:'14px 0', borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}>
              Réserver et gagner des points →
            </Link>
          </>
        )}
      </div>

      <BottomNav active="fidelite" />
    </div>
  )
}
