'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const D = {
  bg:'#0a0908', dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
}

function BottomNav({ active }: { active: string }) {
  const tabs = [
    { id:'home',     label:'Accueil',  href:'/home',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" fill={on?'rgba(200,169,110,.15)':'none'}/></svg> },
    { id:'quartier', label:'Quartier', href:'/quartier',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="9" r="5" stroke={on?D.gold:'#bbb'} strokeWidth="1.5"/><path d="M11 9v0" stroke={on?D.gold:'#bbb'} strokeWidth="2" strokeLinecap="round"/><path d="M11 4C11 4 6 9.5 6 13a5 5 0 0010 0c0-3.5-5-9-5-9z" stroke={on?D.gold:'#bbb'} strokeWidth="1.4" fill={on?'rgba(200,169,110,.12)':'none'}/></svg> },
    { id:'rdv',      label:'Mes RDV',  href:'/rdv',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke={on?D.gold:'#bbb'} strokeWidth="1.5"/><path d="M7 3v4M15 3v4M3 9h16" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id:'fidelite', label:'Fidélité', href:'/fidelite',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.4 6.3H20l-5.5 4 2.1 6.4L11 15l-5.6 3.7 2.1-6.4L2 8.3h6.6L11 2z" stroke={on?D.gold:'#bbb'} strokeWidth="1.4" fill={on?'rgba(200,169,110,.15)':'none'} strokeLinejoin="round"/></svg> },
    { id:'profil',   label:'Profil',   href:'/profile',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke={on?D.gold:'#bbb'} strokeWidth="1.5"/><path d="M4 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, display:'flex', borderTop:`1px solid ${D.border}`, background:'#fff', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {tabs.map(t => {
        const on = active === t.id
        return <Link key={t.id} href={t.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 0 12px', gap:3, textDecoration:'none' }}>
          {t.icon(on)}
          <span style={{ fontSize:9, color:on?D.gold:'#bbb', fontWeight:on?600:400, fontFamily:"'Outfit',sans-serif" }}>{t.label}</span>
        </Link>
      })}
    </div>
  )
}

const OCCASIONS = [
  { id:'soir',      emoji:'🌙', label:'Je sors ce soir',     sub:'Prêt en 2h, pros dispo',        href:'/preparer?occasion=soir',      dark:true },
  { id:'planifie',  emoji:'📅', label:'Je planifie',          sub:'Rendez-vous, mariage…',          href:'/preparer?occasion=planifie',  dark:false },
  { id:'coupe',     emoji:'✂️', label:'Coupe ou barbe',       sub:'Barbiers autour de toi',         href:'/quartier?cat=barbier',        dark:false },
  { id:'soin',      emoji:'💆', label:'Soin du visage',       sub:'Peau, barbe, sourcils',          href:'/quartier?cat=soin',           dark:false },
  { id:'detente',   emoji:'🛁', label:'Me détendre',          sub:'Spa, massage, hammam',           href:'/quartier?cat=spa',            dark:false },
  { id:'musthave',  emoji:'👕', label:'Must have',            sub:'Boutiques, drops, style',        href:'/quartier?cat=musthave',       dark:false },
  { id:'pressing',  emoji:'👔', label:'Pressing, retouches',  sub:'Chemise, costume, ourlet',       href:'/quartier?cat=pressing',       dark:false },
]

const DISPO = [
  { name:'Alex B.', service:'Coupe', delay:'dans 30 min', discount:'-15%', salon:'Evaan & Dams', href:'/quartier?cat=barbier' },
  { name:'Atelier Léon', service:'Soin visage', delay:'dans 45 min', discount:null, salon:'Soin homme', href:'/quartier?cat=soin' },
]

const CONSEIL = {
  text: 'Peau mixte et temps humide : nettoyant léger ce soir, et cire mate plutôt que gel demain matin.',
  tag: 'Conseil du jour',
}

export default function HomePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
      setFirstName(localStorage.getItem('cp_firstName') || '')
    } catch {}
  }, [router])

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.light }}>

      {/* Dark hero */}
      <div style={{ background:`linear-gradient(155deg,${D.dark} 0%,${D.dark2} 100%)`, flexShrink:0 }}>
        {/* Status bar */}
        <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
          </div>
        </div>

        {/* Header */}
        <div style={{ padding:'10px 18px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2C7 2 3 6.5 3 9a4 4 0 008 0c0-2.5-4-7-4-7z" stroke={D.gold} strokeWidth="1.3" fill="rgba(200,169,110,.15)"/><circle cx="7" cy="9" r="1.5" fill={D.gold}/></svg>
              <span style={{ fontSize:11, color:D.fg2 }}>Frontignan, Hérault (34)</span>
            </div>
            <div style={{ fontSize:13, color:D.fg2, marginBottom:2 }}>Bonjour {firstName || 'toi'} 👋</div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:22, fontWeight:700, color:'#fff', lineHeight:1.15 }}>
              Qu'est-ce que tu veux<br/>faire aujourd'hui ?
            </div>
          </div>
          <Link href="/profile" style={{ width:38, height:38, borderRadius:12, background:'rgba(200,169,110,.15)', border:'1px solid rgba(200,169,110,.3)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', flexShrink:0, marginTop:4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke={D.gold} strokeWidth="1.3"/><path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={D.gold} strokeWidth="1.3" strokeLinecap="round"/></svg>
          </Link>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', paddingBottom:90 }}>

        {/* Occasion cards */}
        <div style={{ padding:'14px 14px 0' }}>
          {/* Top card - Je sors ce soir - full width dark */}
          <Link href="/preparer?occasion=soir" style={{ textDecoration:'none', display:'block', marginBottom:10 }}>
            <div style={{ background:`linear-gradient(135deg,${D.dark},${D.dark2})`, borderRadius:16, padding:'16px 18px', border:'1px solid rgba(200,169,110,.2)', boxShadow:'0 4px 16px rgba(0,0,0,.12)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:22, marginBottom:6 }}>🌙</div>
                <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, fontWeight:700, color:'#fff' }}>Je sors ce soir</div>
                <div style={{ fontSize:12, color:D.fg2, marginTop:2 }}>Prêt en 2h, pros dispo maintenant</div>
              </div>
              <div style={{ background:D.gold, borderRadius:10, padding:'8px 14px', fontSize:12, fontWeight:700, color:D.dark }}>C'est parti →</div>
            </div>
          </Link>

          {/* Grid 2 cols */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {OCCASIONS.slice(1).map(o => (
              <Link key={o.id} href={o.href} style={{ textDecoration:'none' }}>
                <div style={{ background:'#fff', borderRadius:14, padding:'14px 14px', border:`1px solid ${D.border}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                  <div style={{ fontSize:20, marginBottom:8 }}>{o.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:D.dark, lineHeight:1.2, marginBottom:3 }}>{o.label}</div>
                  <div style={{ fontSize:10, color:D.muted }}>{o.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Conseil du jour */}
        <div style={{ margin:'0 14px 14px' }}>
          <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.04)', display:'flex', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(200,169,110,.1)', border:'1px solid rgba(200,169,110,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={D.gold} strokeWidth="1.3"/><path d="M8 5v3l2 1.5" stroke={D.gold} strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:D.gold, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:4 }}>Conseil du jour</div>
              <div style={{ fontSize:12, color:'#444', lineHeight:1.55 }}>{CONSEIL.text}</div>
            </div>
          </div>
        </div>

        {/* Dispo maintenant */}
        <div style={{ padding:'0 14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:D.dark }}>Dispo maintenant autour de toi</div>
            <Link href="/quartier" style={{ fontSize:11, color:D.gold, textDecoration:'none', fontWeight:600 }}>Voir tout →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {DISPO.map((d, i) => (
              <Link key={i} href={d.href} style={{ textDecoration:'none' }}>
                <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${i===0?'#c8a96e,#7a5c2e':'#2a4a3a,#1a3028'})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 15 L10 5 L13 15M8.5 11h3" stroke="rgba(255,255,255,.9)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:D.dark }}>{d.name}</div>
                    <div style={{ fontSize:11, color:D.muted }}>{d.service} · {d.delay}</div>
                  </div>
                  {d.discount && <div style={{ background:'rgba(200,169,110,.12)', border:'1px solid rgba(200,169,110,.25)', borderRadius:6, padding:'3px 8px', fontSize:10, color:D.gold, fontWeight:700 }}>{d.discount}</div>}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke={D.muted2} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      <BottomNav active="home" />
    </div>
  )
}
