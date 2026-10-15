'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase'

const D = {
  dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa', red:'#c0392b',
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

const DIAG_PEAU = ['Normale', 'Mixte', 'Grasse', 'Sèche', 'Sensible']
const DIAG_BARBE = ['Rasé', 'Courte', '3 jours', 'Longue', 'En pousse']
const DIAG_CHEVEUX = ['Fins', 'Épais', 'Bouclés', 'Frisés', 'Raides', 'Ondulés']
const DIAG_STYLE = ['Classique', 'Casual', 'Streetwear', 'Business', 'Athlétique']

const FICHE_COUPE = [
  { label:'Longueur dessus', value:'5–6 cm' },
  { label:'Côtés', value:'Dégradé 2→4' },
  { label:'Nuque', value:'Dégradé fondu' },
  { label:'Barbe', value:'Contours nets, 3j' },
  { label:'Finition', value:'Cire mate' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [phone, setPhone] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [tab, setTab] = useState<'profil'|'diagnostic'|'fiche'>('profil')

  const [peau, setPeau] = useState<string | null>(null)
  const [barbe, setBarbe] = useState<string | null>(null)
  const [cheveux, setCheveux] = useState<string | null>(null)
  const [style, setStyle] = useState<string | null>(null)
  const [diagSaved, setDiagSaved] = useState(false)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
      setFirstName(localStorage.getItem('cp_firstName') || '')
      const saved = localStorage.getItem('cp_diag')
      if (saved) {
        const d = JSON.parse(saved)
        setPeau(d.peau); setBarbe(d.barbe); setCheveux(d.cheveux); setStyle(d.style)
        setDiagSaved(true)
      }
    } catch {}
    getBrowserClient().auth.getSession().then(({ data }) => {
      const p = data.session?.user?.phone
      if (p) setPhone(p)
    })
  }, [router])

  const saveDiag = () => {
    try {
      localStorage.setItem('cp_diag', JSON.stringify({ peau, barbe, cheveux, style }))
      setDiagSaved(true)
    } catch {}
  }

  const logout = async () => {
    setLoggingOut(true)
    try {
      await getBrowserClient().auth.signOut()
      localStorage.removeItem('cp_role')
      localStorage.removeItem('cp_firstName')
      localStorage.removeItem('cp_diag')
    } catch {}
    router.replace('/onboarding')
  }

  const diagComplete = peau && barbe && cheveux && style

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.light }}>

      {/* Dark hero */}
      <div style={{ background:`linear-gradient(155deg,${D.dark} 0%,${D.dark2} 100%)`, flexShrink:0 }}>
        <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
          </div>
        </div>
        <div style={{ padding:'10px 18px 0', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:54, height:54, borderRadius:16, background:'rgba(200,169,110,.15)', border:'2px solid rgba(200,169,110,.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="9" r="5" stroke={D.gold} strokeWidth="1.5"/><path d="M4 23c0-5 4-9 9-9s9 4 9 9" stroke={D.gold} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:23, fontWeight:700, color:'#fff', lineHeight:1.1 }}>
              {firstName || 'Mon profil'}
            </div>
            {phone && <div style={{ fontSize:11, color:D.fg2, marginTop:3 }}>{phone}</div>}
            {diagSaved && (
              <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                {[peau, barbe, style].filter(Boolean).map(tag => (
                  <span key={tag} style={{ fontSize:9, background:D.gold, color:D.dark, padding:'2px 6px', borderRadius:5, fontWeight:700 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, padding:'14px 18px 0' }}>
          {(['profil','diagnostic','fiche'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex:1, padding:'8px 4px', border:'none', background:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight: tab===t ? 700 : 400, color: tab===t ? '#fff' : D.fg2, borderBottom: tab===t ? `2px solid ${D.gold}` : '2px solid transparent', transition:'all .15s' }}
            >
              {t === 'profil' ? 'Infos' : t === 'diagnostic' ? 'Diagnostic' : 'Fiche coupe'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'16px', paddingBottom:90 }}>

        {/* === TAB: Profil === */}
        {tab === 'profil' && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Informations</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {[
                { label:'Prénom', value: firstName || '—' },
                { label:'Téléphone', value: phone || '—' },
              ].map(row => (
                <div key={row.label} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div>
                    <div style={{ fontSize:9, color:D.muted2, textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{row.label}</div>
                    <div style={{ fontSize:14, color:D.dark, fontWeight:500 }}>{row.value}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3l3 3-7 7H3v-3L10 3z" stroke={D.muted2} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              ))}
            </div>

            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>Raccourcis</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              {[
                { label:'Mes rendez-vous', emoji:'📅', href:'/rdv' },
                { label:'Programme fidélité', emoji:'⭐', href:'/fidelite' },
                { label:'Mon Quartier', emoji:'📍', href:'/quartier' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', textDecoration:'none', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:18 }}>{item.emoji}</span>
                    <span style={{ fontSize:14, color:D.dark, fontWeight:500 }}>{item.label}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke={D.muted2} strokeWidth="1.3" strokeLinecap="round"/></svg>
                </Link>
              ))}
            </div>

            <button
              onClick={logout}
              disabled={loggingOut}
              style={{ width:'100%', padding:14, borderRadius:12, background:'#fff', border:`1px solid ${D.border}`, color:D.red, fontSize:14, fontWeight:500, cursor:loggingOut?'not-allowed':'pointer', fontFamily:"'Outfit',sans-serif", opacity:loggingOut?0.6:1, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}
            >
              {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
          </>
        )}

        {/* === TAB: Diagnostic === */}
        {tab === 'diagnostic' && (
          <>
            <div style={{ fontSize:12, color:D.muted, marginBottom:16, lineHeight:1.5 }}>
              Ton diagnostic permet aux pros de te connaître avant même ton arrivée.
            </div>

            {[
              { label:'Type de peau', emoji:'🧴', opts:DIAG_PEAU, val:peau, set:setPeau },
              { label:'Barbe actuelle', emoji:'🧔', opts:DIAG_BARBE, val:barbe, set:setBarbe },
              { label:'Type de cheveux', emoji:'💈', opts:DIAG_CHEVEUX, val:cheveux, set:setCheveux },
              { label:'Style vestimentaire', emoji:'👕', opts:DIAG_STYLE, val:style, set:setStyle },
            ].map(section => (
              <div key={section.label} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                  <span style={{ fontSize:16 }}>{section.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:D.dark }}>{section.label}</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {section.opts.map(opt => {
                    const on = section.val === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => section.set(on ? null : opt)}
                        style={{ padding:'8px 14px', borderRadius:20, border: on ? `1.5px solid ${D.gold}` : `1px solid ${D.border}`, background: on ? D.gold : '#fff', color: on ? D.dark : '#555', fontSize:12, fontWeight: on ? 700 : 400, cursor:'pointer', fontFamily:"'Outfit',sans-serif", transition:'all .15s' }}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={saveDiag}
              disabled={!diagComplete}
              style={{ width:'100%', padding:15, borderRadius:13, background: diagComplete ? D.dark : '#ddd', color: diagComplete ? '#fff' : '#aaa', fontSize:14, fontWeight:700, border:'none', cursor: diagComplete ? 'pointer' : 'not-allowed', fontFamily:"'Outfit',sans-serif", marginTop:8 }}
            >
              {diagSaved ? '✓ Diagnostic enregistré' : 'Enregistrer mon profil'}
            </button>

            {diagSaved && (
              <div style={{ marginTop:12, background:'rgba(200,169,110,.08)', border:'1px solid rgba(200,169,110,.25)', borderRadius:12, padding:'12px 16px', fontSize:12, color:D.gold, textAlign:'center' }}>
                Les pros de ton quartier verront ton profil lors de la réservation.
              </div>
            )}
          </>
        )}

        {/* === TAB: Fiche coupe === */}
        {tab === 'fiche' && (
          <>
            <div style={{ background:`linear-gradient(135deg,${D.dark},${D.dark2})`, borderRadius:16, padding:'16px', marginBottom:16, border:'1px solid rgba(200,169,110,.2)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:700, color:'#fff' }}>Fiche coupe</div>
                  <div style={{ fontSize:11, color:D.fg2, marginTop:2 }}>Comme la dernière fois</div>
                </div>
                <div style={{ background:'rgba(200,169,110,.15)', border:'1px solid rgba(200,169,110,.3)', borderRadius:10, padding:'6px 12px' }}>
                  <div style={{ fontSize:9, color:D.gold, fontWeight:700, letterSpacing:'1px' }}>BARBIER</div>
                  <div style={{ fontSize:11, color:'#fff', fontWeight:600 }}>Alex B.</div>
                </div>
              </div>

              {FICHE_COUPE.map((row, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i < FICHE_COUPE.length-1 ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
                  <span style={{ fontSize:12, color:D.fg2 }}>{row.label}</span>
                  <span style={{ fontSize:12, color:'#fff', fontWeight:600 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:D.dark, marginBottom:8 }}>Dernière visite</div>
              <div style={{ fontSize:12, color:D.muted }}>Il y a 5 semaines · Alex B. · Coupe + barbe · 45€</div>
            </div>

            <button
              onClick={() => router.push('/quartier?cat=barbier')}
              style={{ width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}
            >
              Reprendre comme la dernière fois →
            </button>

            <div style={{ marginTop:10, textAlign:'center' }}>
              <button style={{ background:'none', border:'none', fontSize:12, color:D.muted, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
                Modifier la fiche coupe
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav active="profil" />
    </div>
  )
}
