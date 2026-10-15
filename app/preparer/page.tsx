'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const D = {
  dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
}

function BottomNav({ active }: { active: string }) {
  const tabs = [
    { id:'home',     label:'Accueil',  href:'/home',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={on?D.gold:'#bbb'} strokeWidth="1.5" fill={on?'rgba(200,169,110,.15)':'none'}/></svg> },
    { id:'quartier', label:'Quartier', href:'/quartier',
      icon:(on:boolean)=><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3C11 3 6 8.5 6 12a5 5 0 0010 0c0-3.5-5-9-5-9z" stroke={on?D.gold:'#bbb'} strokeWidth="1.4" fill={on?'rgba(200,169,110,.12)':'none'}/><circle cx="11" cy="12" r="1.8" fill={on?D.gold:'#bbb'}/></svg> },
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
  {
    id:'soir', emoji:'🌙', label:'Ce soir, en 2h', sub:'Je sors dans 2h',
    plan: [
      { time:'Maintenant', icon:'✂️', label:'Coupe + barbe', detail:'Alex B. · dans 30 min', href:'/quartier?cat=barbier' },
      { time:'+1h', icon:'💆', label:'Soin visage express', detail:'Atelier Léon · 30 min', href:'/quartier?cat=soin' },
    ],
    cta:'Voir les pros dispo maintenant', ctaHref:'/quartier?filter=now',
  },
  {
    id:'planifie', emoji:'📅', label:'Je planifie', sub:'Dans quelques jours',
    plan: [
      { time:'J-1', icon:'👔', label:'Chemise au pressing', detail:'Pressing du Peyrou · prêt en 24h', href:'/quartier?cat=pressing' },
      { time:'Jour J', icon:'✂️', label:'Coupe et barbe', detail:'Alex B. · comme la dernière fois', href:'/quartier?cat=barbier' },
      { time:'Jour J', icon:'💆', label:'Soin visage', detail:'Atelier Léon · 45 min', href:'/quartier?cat=soin' },
    ],
    cta:'Choisir une date', ctaHref:'/rdv',
  },
  {
    id:'rdv', emoji:'💼', label:'Entretien d\'embauche', sub:'Coupe nette, tenue pro',
    plan: [
      { time:'J-2', icon:'👔', label:'Costume au pressing', detail:'Pressing du Peyrou · 48h', href:'/quartier?cat=pressing' },
      { time:'J-1', icon:'✂️', label:'Coupe nette', detail:'Alex B. · dégradé propre', href:'/quartier?cat=barbier' },
      { time:'Jour J', icon:'👕', label:'Chemise Must have', detail:'Maison Chemise · 300m', href:'/quartier?cat=musthave' },
    ],
    cta:'Organiser mon entretien', ctaHref:'/quartier',
  },
  {
    id:'premier-rdv', emoji:'❤️', label:'Premier rendez-vous', sub:'Coupe, soin, tenue',
    plan: [
      { time:'J-1', icon:'✂️', label:'Coupe + barbe', detail:'Alex B. · soigné', href:'/quartier?cat=barbier' },
      { time:'Matin', icon:'💆', label:'Soin visage', detail:'Atelier Léon · peau nette', href:'/quartier?cat=soin' },
      { time:'Tenue', icon:'👕', label:'Must have', detail:'Le Vestiaire · concept store', href:'/quartier?cat=musthave' },
    ],
    cta:'Préparer mon look', ctaHref:'/quartier',
  },
  {
    id:'mariage', emoji:'💍', label:'Mariage', sub:'Coupe, barbe, costume',
    plan: [
      { time:'J-3', icon:'👔', label:'Costume à retoucher', detail:'Pressing du Peyrou · ajustement', href:'/quartier?cat=pressing' },
      { time:'J-1', icon:'💆', label:'Soin visage premium', detail:'Atelier Léon · 60 min', href:'/quartier?cat=soin' },
      { time:'Matin', icon:'✂️', label:'Coupe + barbe sculptée', detail:'Alex B. · réservé à l\'avance', href:'/quartier?cat=barbier' },
    ],
    cta:'Planifier le mariage', ctaHref:'/quartier',
  },
  {
    id:'voyage', emoji:'✈️', label:'Voyage', sub:'Coupe avant le départ',
    plan: [
      { time:'Avant', icon:'✂️', label:'Coupe de voyage', detail:'Alex B. · dégradé durable', href:'/quartier?cat=barbier' },
      { time:'Bagages', icon:'👔', label:'Pressing express', detail:'Pressing du Peyrou · 24h', href:'/quartier?cat=pressing' },
      { time:'Détente', icon:'🛁', label:'Spa avant décollage', detail:'Spa Antigone · relax', href:'/quartier?cat=spa' },
    ],
    cta:'Préparer mon voyage', ctaHref:'/quartier',
  },
  {
    id:'detente', emoji:'🛁', label:'Me remettre en forme', sub:'Spa, massage, hammam',
    plan: [
      { time:'Option 1', icon:'💆', label:'Massage relaxant', detail:'Spa Antigone · 60 min · 70€', href:'/quartier?cat=spa' },
      { time:'Option 2', icon:'🧖', label:'Hammam + gommage', detail:'Spa Antigone · 45 min · 40€', href:'/quartier?cat=spa' },
      { time:'Option 3', icon:'🏊', label:'Accès spa complet', detail:'Sauna, hammam, bassin · 30€', href:'/quartier?cat=spa' },
    ],
    cta:'Réserver mon moment', ctaHref:'/quartier?cat=spa',
  },
]

function PreparerContent() {
  const router = useRouter()
  const params = useSearchParams()
  const preSelected = params.get('occasion')
  const [selected, setSelected] = useState<string | null>(preSelected)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}
  }, [router])

  const plan = OCCASIONS.find(o => o.id === selected)

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.light }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(155deg,${D.dark} 0%,${D.dark2} 100%)`, flexShrink:0 }}>
        <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
          </div>
        </div>
        <div style={{ padding:'6px 18px 20px' }}>
          <button onClick={()=>router.back()} style={{ background:'none', border:'none', color:D.gold, fontSize:12, fontWeight:500, cursor:'pointer', padding:'0 0 10px', fontFamily:"'Outfit',sans-serif" }}>← Retour</button>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:700, color:'#fff' }}>Me préparer pour…</div>
          <div style={{ fontSize:12, color:D.fg2, marginTop:3 }}>Choisis l'occasion, on organise le reste.</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'16px', paddingBottom:90 }}>

        {/* Occasion grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
          {OCCASIONS.map(o => {
            const on = selected === o.id
            return (
              <button
                key={o.id}
                onClick={() => setSelected(on ? null : o.id)}
                style={{ background: on ? D.dark : '#fff', border: on ? `2px solid ${D.gold}` : `1px solid ${D.border}`, borderRadius:14, padding:'14px 14px', textAlign:'left', cursor:'pointer', fontFamily:"'Outfit',sans-serif", boxShadow: on ? `0 2px 12px rgba(200,169,110,.25)` : '0 1px 4px rgba(0,0,0,.05)', transition:'all .2s' }}
              >
                <div style={{ fontSize:22, marginBottom:8 }}>{o.emoji}</div>
                <div style={{ fontSize:13, fontWeight:600, color: on ? '#fff' : D.dark, lineHeight:1.2, marginBottom:3 }}>{o.label}</div>
                <div style={{ fontSize:10, color: on ? D.fg2 : D.muted }}>{o.sub}</div>
              </button>
            )
          })}
        </div>

        {/* Plan */}
        {plan && (
          <div style={{ animation:'fadeIn .3s ease' }}>
            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12 }}>
              On a tout calé pour toi
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:16, position:'relative' }}>
              {/* Vertical line */}
              <div style={{ position:'absolute', left:19, top:20, bottom:20, width:1, background:`linear-gradient(to bottom, ${D.gold}, rgba(200,169,110,.1))` }} />

              {plan.plan.map((step, i) => (
                <Link key={i} href={step.href} style={{ textDecoration:'none', display:'flex', gap:14, marginBottom:10, position:'relative', zIndex:1 }}>
                  <div style={{ width:38, height:38, borderRadius:12, background: i===0 ? D.gold : '#fff', border:`1px solid ${i===0 ? D.gold : D.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16, boxShadow:'0 2px 6px rgba(0,0,0,.08)' }}>
                    {step.icon}
                  </div>
                  <div style={{ flex:1, background:'#fff', border:`1px solid ${D.border}`, borderRadius:12, padding:'10px 14px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize:9, color:D.gold, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:3 }}>{step.time}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:D.dark }}>{step.label}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{step.detail}</div>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={plan.ctaHref}
              style={{ display:'block', width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, textAlign:'center', textDecoration:'none', fontFamily:"'Outfit',sans-serif" }}
            >
              {plan.cta} →
            </Link>
          </div>
        )}

        {!selected && (
          <div style={{ textAlign:'center', padding:'8px 0 0' }}>
            <div style={{ fontSize:12, color:D.muted2 }}>Sélectionne une occasion pour voir le plan</div>
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <BottomNav active="home" />
    </div>
  )
}

export default function PreparerPage() {
  return <Suspense><PreparerContent /></Suspense>
}
