'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const D = {
  dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', gold2:'#e8d4a8', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
}

const PERKS = [
  { emoji:'⚡', title:'Priorité de réservation', sub:'Tu passes avant les autres, même en heure de pointe' },
  { emoji:'⭐', title:'Points x2', sub:'Chaque visite compte double dans ton programme fidélité' },
  { emoji:'💸', title:'-10% partout', sub:'Sur tous les services NOAWOW de ton quartier' },
  { emoji:'🎁', title:'Soin offert chaque mois', sub:'Un soin visage express à choisir parmi nos partenaires' },
  { emoji:'📋', title:'Fiche coupe partagée', sub:'Ton barbier reçoit ta fiche avant chaque visite' },
  { emoji:'🔔', title:'Alertes créneaux rares', sub:'Notifié en premier si un créneau se libère' },
]

export default function PremiumPage() {
  const router = useRouter()
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) router.replace('/onboarding')
    } catch {}
  }, [router])

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.dark }}>

      {/* Status bar */}
      <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0', flexShrink:0 }}>
        <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', paddingBottom:110 }}>

        {/* Hero */}
        <div style={{ padding:'8px 18px 0' }}>
          <button onClick={()=>router.back()} style={{ background:'none', border:'none', color:D.gold, fontSize:12, fontWeight:500, cursor:'pointer', padding:'0 0 12px', fontFamily:"'Outfit',sans-serif" }}>← Retour</button>

          {/* Gold star */}
          <div style={{ textAlign:'center', padding:'20px 0 16px' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:`linear-gradient(135deg,${D.gold},${D.gold2})`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:36, boxShadow:'0 8px 32px rgba(200,169,110,.4)', marginBottom:20 }}>⭐</div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:34, fontWeight:700, color:'#fff', lineHeight:1.1 }}>NOAWOW</div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:22, fontWeight:400, color:D.gold, marginBottom:8 }}>Premium</div>
            <div style={{ fontSize:12, color:D.fg2, maxWidth:260, margin:'0 auto', lineHeight:1.6 }}>Accès prioritaire, réductions partout, points doublés. L'abonnement de l'homme qui sait ce qu'il vaut.</div>
          </div>

          {/* Price card */}
          <div style={{ background:`linear-gradient(135deg,${D.dark2},rgba(200,169,110,.12))`, border:'1px solid rgba(200,169,110,.3)', borderRadius:18, padding:'20px', textAlign:'center', marginBottom:24 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:42, fontWeight:700, color:'#fff', lineHeight:1 }}>4,99€</div>
            <div style={{ fontSize:12, color:D.fg2, marginTop:4 }}>par mois · sans engagement · annulable à tout moment</div>
            <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:16 }}>
              <div style={{ fontSize:10, color:D.gold, background:'rgba(200,169,110,.12)', border:'1px solid rgba(200,169,110,.2)', borderRadius:6, padding:'4px 10px', fontWeight:600 }}>1er mois offert</div>
              <div style={{ fontSize:10, color:'#fff', background:'rgba(255,255,255,.1)', borderRadius:6, padding:'4px 10px' }}>Puis 4,99€/mois</div>
            </div>
          </div>
        </div>

        {/* Perks */}
        <div style={{ padding:'0 18px', marginBottom:20 }}>
          <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12 }}>Inclus dans Premium</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(200,169,110,.1)', border:'1px solid rgba(200,169,110,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.emoji}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{p.title}</div>
                  <div style={{ fontSize:11, color:D.fg2, lineHeight:1.4 }}>{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{ margin:'0 18px 20px', background:'rgba(200,169,110,.06)', border:'1px solid rgba(200,169,110,.15)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ fontSize:12, color:D.fg2, fontStyle:'italic', lineHeight:1.6, marginBottom:8 }}>"J'ai économisé plus de 60€ en un mois avec les réductions et le soin offert. Ça vaut largement les 5€."</div>
          <div style={{ fontSize:10, color:D.gold, fontWeight:700 }}>— Thomas M., membre depuis 6 mois</div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 18px', paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))', background:D.dark, borderTop:'1px solid rgba(255,255,255,.08)' }}>
        {subscribed ? (
          <div style={{ background:'rgba(200,169,110,.15)', border:'1px solid rgba(200,169,110,.3)', borderRadius:13, padding:'15px', textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:700, color:D.gold }}>Bienvenue en Premium ⭐</div>
            <div style={{ fontSize:11, color:D.fg2, marginTop:4 }}>1er mois gratuit · Commence maintenant</div>
          </div>
        ) : (
          <>
            <button
              onClick={()=>setSubscribed(true)}
              style={{ width:'100%', padding:16, borderRadius:13, background:`linear-gradient(135deg,${D.gold},${D.gold2})`, color:D.dark, fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", marginBottom:8 }}
            >
              Commencer — 1er mois offert →
            </button>
            <div style={{ textAlign:'center', fontSize:10, color:D.fg2 }}>Puis 4,99€/mois · Annulable à tout moment</div>
          </>
        )}
      </div>
    </div>
  )
}
