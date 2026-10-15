'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const D = {
  dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
}

const PLAN = [
  { time:'17h00', duration:'45 min', emoji:'✂️', service:'Coupe + barbe', pro:'Alex B.', lieu:'Evaan & Dams · 350m', prix:38, color:'#c8a96e', done:false },
  { time:'18h00', duration:'30 min', emoji:'💆', service:'Soin visage express', pro:'Atelier Léon', lieu:'Soin homme · 500m', prix:35, color:'#2a4a3a', done:false },
  { time:'18h45', duration:'15 min', emoji:'👕', service:'Pick-up commande', pro:'Le Vestiaire', lieu:'Concept store · 600m', prix:0, color:'#1a2a4a', done:false },
  { time:'19h00', duration:'—', emoji:'🌙', service:'Tu es prêt', pro:'', lieu:'Profite de ta soirée', prix:0, color:'#2d2218', done:false },
]

export default function SoireePage() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [steps, setSteps] = useState(PLAN.map(() => false))

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
    } catch {}
  }, [router])

  const total = PLAN.filter(p => p.prix > 0).reduce((s, p) => s + p.prix, 0)

  const toggle = (i: number) => {
    const next = [...steps]
    next[i] = !next[i]
    setSteps(next)
  }

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
          <button onClick={()=>router.back()} style={{ background:'none', border:'none', color:D.gold, fontSize:12, fontWeight:500, cursor:'pointer', padding:'0 0 8px', fontFamily:"'Outfit',sans-serif" }}>← Retour</button>
          <div style={{ fontSize:12, color:D.fg2, marginBottom:4 }}>Ce soir à partir de 17h</div>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:26, fontWeight:700, color:'#fff' }}>Prêt pour ta soirée 🌙</div>
          <div style={{ fontSize:12, color:D.fg2, marginTop:4 }}>Plan multi-services · {total}€ au total</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'16px', paddingBottom:110 }}>

        {/* Timeline */}
        <div style={{ position:'relative' }}>
          {/* Vertical line */}
          <div style={{ position:'absolute', left:28, top:30, bottom:30, width:2, background:`linear-gradient(to bottom, ${D.gold}, rgba(200,169,110,.1))` }} />

          {PLAN.map((step, i) => (
            <div key={i} style={{ display:'flex', gap:14, marginBottom:14, position:'relative', zIndex:1 }}>
              {/* Time dot */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, width:58 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background: steps[i] ? '#4ade80' : (i === 0 ? D.gold : '#fff'), border:`2px solid ${steps[i] ? '#4ade80' : (i === 0 ? D.gold : D.border)}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
                  {steps[i] && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color: i === 0 ? D.gold : D.muted, fontFamily:"'Outfit',sans-serif" }}>{step.time}</div>
                {step.duration !== '—' && <div style={{ fontSize:9, color:D.muted2 }}>{step.duration}</div>}
              </div>

              {/* Card */}
              <div
                onClick={() => step.prix > 0 && toggle(i)}
                style={{ flex:1, borderRadius:14, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.07)', cursor: step.prix > 0 ? 'pointer' : 'default', opacity: steps[i] ? 0.7 : 1, transition:'opacity .2s' }}
              >
                <div style={{ background:step.color, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>{step.emoji}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{step.service}</div>
                    {step.pro && <div style={{ fontSize:10, color:'rgba(255,255,255,.7)' }}>{step.pro}</div>}
                  </div>
                  {step.prix > 0 && (
                    <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:17, fontWeight:700, color:'#fff' }}>{step.prix}€</span>
                  )}
                </div>
                <div style={{ background:'#fff', padding:'10px 14px', border:`1px solid ${D.border}`, borderTop:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:11, color:D.muted }}>{step.lieu}</span>
                  {steps[i] && <span style={{ fontSize:10, color:'#16a34a', fontWeight:700 }}>✓ Confirmé</span>}
                  {!steps[i] && step.prix > 0 && <span style={{ fontSize:10, color:D.gold, fontWeight:600 }}>Tap pour valider</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', marginTop:4, marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Récapitulatif</div>
          {PLAN.filter(p => p.prix > 0).map((p, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i < PLAN.filter(x => x.prix > 0).length-1 ? `1px solid ${D.border}` : 'none' }}>
              <span style={{ fontSize:12, color:'#555' }}>{p.service}</span>
              <span style={{ fontSize:12, fontWeight:600, color:D.dark }}>{p.prix}€</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:`2px solid ${D.border}` }}>
            <span style={{ fontSize:13, fontWeight:700, color:D.dark }}>Total</span>
            <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, fontWeight:700, color:D.gold }}>{total}€</span>
          </div>
        </div>

        {/* Premium upsell */}
        <Link href="/premium" style={{ textDecoration:'none', display:'block', background:`linear-gradient(135deg,${D.dark},${D.dark2})`, border:'1px solid rgba(200,169,110,.25)', borderRadius:14, padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'rgba(200,169,110,.15)', border:'1px solid rgba(200,169,110,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⭐</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>Premium · 4,99€/mois</div>
              <div style={{ fontSize:10, color:D.fg2, marginTop:2 }}>Points x2 ce soir · -10% sur tous tes services</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke={D.gold} strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
        </Link>
      </div>

      {/* CTA sticky */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 16px', paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))', background:'#fff', borderTop:`1px solid ${D.border}` }}>
        {confirmed ? (
          <div style={{ background:'rgba(74,222,128,.1)', border:'1px solid rgba(74,222,128,.3)', borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#166534' }}>Plan confirmé 🎉 Bonne soirée !</div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmed(true)}
            style={{ width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}
          >
            Confirmer tout le plan · {total}€ →
          </button>
        )}
      </div>
    </div>
  )
}
