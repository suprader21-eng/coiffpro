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

const CATS = [
  { id:'tout',     label:'Tout' },
  { id:'Coupes',   label:'Barbier' },
  { id:'Soins',    label:'Soin' },
  { id:'Massages', label:'Spa' },
  { id:'Pressing', label:'Pressing' },
]

type SalonCard = {
  id: string; slug: string; name: string; tagline: string
  city: string; address: string; accent_color: string; primary_color: string
  phone: string; status: string
  mainCat: string
  services: { id:string; name:string; price_cents:number; category:string }[]
  employees: { name:string }[]
}

function StarIcon({ fill }: { fill: boolean }) {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill={fill ? D.gold : '#ddd'}><path d="M5 1l1.2 3.1H9l-2.6 1.9 1 3.1L5 7.3 2.6 9.1l1-3.1L1 4.1h2.8L5 1z"/></svg>
}

const CAT_EMOJI: Record<string, string> = {
  Coupes:'✂️', Soins:'💆', Massages:'🛁', Pressing:'👔', default:'⭐'
}

function QuartierContent() {
  const router = useRouter()
  const params = useSearchParams()
  const initCat = params.get('cat') || 'tout'

  const [cat, setCat] = useState(initCat)
  const [search, setSearch] = useState('')
  const [salons, setSalons] = useState<SalonCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}

    fetch('/api/salon/list')
      .then(r => r.ok ? r.json() : { salons: [] })
      .then(({ salons: data }) => {
        setSalons(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const filtered = salons.filter(s => {
    if (cat !== 'tout' && s.mainCat !== cat) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !(s.tagline||'').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const minPrice = (s: SalonCard) => {
    const prices = s.services.map(sv => sv.price_cents).filter(Boolean)
    return prices.length ? Math.min(...prices) : null
  }

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
        <div style={{ padding:'6px 18px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2C7 2 3 6.5 3 9a4 4 0 008 0c0-2.5-4-7-4-7z" stroke={D.gold} strokeWidth="1.3" fill="rgba(200,169,110,.15)"/><circle cx="7" cy="9" r="1.5" fill={D.gold}/></svg>
            <span style={{ fontSize:11, color:D.fg2 }}>Frontignan, Hérault (34)</span>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:700, color:'#fff', marginBottom:12 }}>Mon Quartier</div>

          <div style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:12, display:'flex', alignItems:'center', gap:8, padding:'10px 14px' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="rgba(245,242,237,.6)" strokeWidth="1.3"/><path d="M10 10l3 3" stroke="rgba(245,242,237,.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Barbier, soin, pressing…"
              style={{ flex:1, background:'none', border:'none', outline:'none', color:D.fg, fontSize:13, fontFamily:"'Outfit',sans-serif" }}
            />
            {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', color:D.fg2, cursor:'pointer', padding:0, fontSize:16, lineHeight:1 }}>×</button>}
          </div>
        </div>

        <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none', padding:'0 14px 14px' }}>
          {CATS.map(c => {
            const on = cat === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, border: on ? `1.5px solid ${D.gold}` : '1.5px solid rgba(255,255,255,.15)', background: on ? D.gold : 'rgba(255,255,255,.08)', color: on ? D.dark : D.fg, fontSize:11, fontWeight: on ? 700 : 500, cursor:'pointer', fontFamily:"'Outfit',sans-serif", marginRight:6, transition:'all .15s' }}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'14px', paddingBottom:90 }}>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:16, height:160, opacity:0.5+i*0.15 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>
              {filtered.length} établissement{filtered.length !== 1 ? 's' : ''} · {cat === 'tout' ? 'Tous types' : CATS.find(c=>c.id===cat)?.label}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(s => {
                const price = minPrice(s)
                const emoji = CAT_EMOJI[s.mainCat] || CAT_EMOJI.default
                const gradient = `linear-gradient(135deg,${s.accent_color||D.gold},${s.primary_color||D.dark})`
                const tags = [...new Set(s.services.map(sv => sv.name))].slice(0,4)

                return (
                  <div key={s.id} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
                    <div style={{ background:gradient, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22 }}>
                        {emoji}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{s.name}</span>
                          <span style={{ fontSize:9, background:D.gold, color:D.dark, padding:'2px 6px', borderRadius:6, fontWeight:700 }}>✓ Vérifié</span>
                        </div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginTop:2 }}>{s.tagline || s.city}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ display:'flex', gap:1 }}>
                          {[1,2,3,4,5].map(i => <StarIcon key={i} fill={i <= 5} />)}
                        </div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:1 }}>5.0</div>
                      </div>
                    </div>

                    <div style={{ padding:'12px 16px' }}>
                      {tags.length > 0 && (
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                          {tags.map(tag => (
                            <span key={tag} style={{ fontSize:10, background:'rgba(200,169,110,.08)', border:'1px solid rgba(200,169,110,.2)', borderRadius:6, padding:'3px 8px', color:D.gold, fontWeight:500 }}>{tag}</span>
                          ))}
                        </div>
                      )}

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />
                          <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>Disponible</span>
                        </div>
                        {price && <span style={{ fontSize:11, color:D.muted }}>À partir de {Math.round(price/100)}€</span>}
                      </div>

                      <div style={{ display:'flex', gap:8 }}>
                        <Link
                          href={`/barbier/${s.slug}`}
                          style={{ flex:1, padding:'10px', borderRadius:10, background:D.dark, color:'#fff', fontSize:12, fontWeight:700, textAlign:'center', textDecoration:'none', display:'block', fontFamily:"'Outfit',sans-serif" }}
                        >
                          Réserver →
                        </Link>
                        {s.phone && (
                          <a href={`tel:${s.phone}`} style={{ width:42, borderRadius:10, background:D.light, border:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 11.3c-.1-.1-1.8-1.2-2.1-1.3-.3-.1-.6 0-.9.3l-.7.9c-.2.2-.5.3-.7.1-1-.5-2.7-2.2-3.1-3.2-.1-.2 0-.5.2-.7l.8-.8c.3-.3.3-.6.2-.9-.1-.3-1.1-2-1.2-2.2C6.2 3 5.9 3 5.6 3c-.8 0-2.6 1-2.6 3.2 0 2.2 2 4.5 4.3 6.2 1.7 1.2 3.8 1.9 5.7 1.6 1-.2 2.4-1.3 2.4-2.4 0-.7-.3-.9-1.4-1.3z" fill={D.muted}/></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filtered.length === 0 && !loading && (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
                <div style={{ fontSize:14, fontWeight:600, color:D.dark, marginBottom:6 }}>Aucun résultat</div>
                <div style={{ fontSize:12, color:D.muted }}>Essaie une autre catégorie ou élargis ta recherche</div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="quartier" />
    </div>
  )
}

export default function QuartierPage() {
  return <Suspense><QuartierContent /></Suspense>
}
