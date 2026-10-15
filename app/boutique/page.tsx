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

const CATS = ['Tout', 'Barbe', 'Cheveux', 'Peau', 'Corps']

const PRODUCTS = [
  {
    id:'huile-barbe', cat:'Barbe', name:'Huile de barbe Black Seed', brand:'Alex B. × NOAWOW', price:28, oldPrice:null,
    rating:4.9, reviews:84, emoji:'🧴', gradient:'linear-gradient(135deg,#2d2218,#c8a96e20)',
    tag:'Bestseller', pickup:'Retrait chez Alex B.', retrait:true,
    desc:'Adoucit et nourrit la barbe. Senteur boisée légère. Recommandée par les barbiers du réseau.',
  },
  {
    id:'serum-visage', cat:'Peau', name:'Sérum hydratant homme', brand:'Atelier Léon × NOAWOW', price:42, oldPrice:55,
    rating:4.8, reviews:61, emoji:'✨', gradient:'linear-gradient(135deg,#1a2a3a,#2a4a3a)',
    tag:'−24%', pickup:'Livraison J+1', retrait:false,
    desc:'Formule anti-pollution adaptée à la peau masculine. Texture légère, non grasse.',
  },
  {
    id:'cire-mate', cat:'Cheveux', name:'Cire mate structurante', brand:'Evaan & Dams', price:18, oldPrice:null,
    rating:4.7, reviews:132, emoji:'💈', gradient:'linear-gradient(135deg,#1a1a1a,#3a2a1a)',
    tag:'Pro choice', pickup:'Retrait chez Alex B.', retrait:true,
    desc:'La cire qu\'utilise Alex B. sur tous ses clients. Tenue forte, fini mat, pas de résidu.',
  },
  {
    id:'gommage-corps', cat:'Corps', name:'Gommage corps au sel noir', brand:'Spa Antigone', price:35, oldPrice:null,
    rating:4.6, reviews:38, emoji:'🛁', gradient:'linear-gradient(135deg,#2a1a3a,#1a1a2a)',
    tag:'Nouveau', pickup:'Livraison J+1', retrait:false,
    desc:'Sel noir de la mer Morte. Exfoliant naturel, peau douce après 1 utilisation.',
  },
  {
    id:'tonique-barbe', cat:'Barbe', name:'Tonique après-rasage', brand:'Barber Shop 34', price:22, oldPrice:28,
    rating:4.5, reviews:47, emoji:'🧴', gradient:'linear-gradient(135deg,#3a2a1a,#2a1a0a)',
    tag:'−21%', pickup:'Retrait en boutique', retrait:true,
    desc:'Apaise la peau après rasage. Formule sans alcool, idéale peau sensible.',
  },
  {
    id:'shampoing', cat:'Cheveux', name:'Shampoing homme kératine', brand:'Evaan & Dams', price:24, oldPrice:null,
    rating:4.6, reviews:55, emoji:'💆', gradient:'linear-gradient(135deg,#1a1a1a,#2a2a1a)',
    tag:null, pickup:'Livraison J+1', retrait:false,
    desc:'Fortifie et hydrate sans alourdir. Pour cheveux épais ou fins, usage quotidien.',
  },
]

export default function BoutiquePage() {
  const router = useRouter()
  const [cat, setCat] = useState('Tout')
  const [cart, setCart] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (!role) { router.replace('/onboarding'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}
  }, [router])

  const filtered = PRODUCTS.filter(p => cat === 'Tout' || p.cat === cat)
  const inCart = (id: string) => cart.includes(id)
  const toggle = (id: string) => setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const total = cart.reduce((s, id) => { const p = PRODUCTS.find(x => x.id === id); return s + (p?.price || 0) }, 0)

  return (
    <div style={{ position:'fixed', inset:0, fontFamily:"'Outfit',system-ui,sans-serif", display:'flex', flexDirection:'column', background:D.light }}>

      {/* Dark header */}
      <div style={{ background:`linear-gradient(155deg,${D.dark} 0%,${D.dark2} 100%)`, flexShrink:0 }}>
        <div style={{ height:50, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontSize:15, fontWeight:600, color:D.fg }}>9:41</span>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill={D.fg}><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.fg}><rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/><rect x="22" y="4" width="3" height="4" rx="1" fill={D.fg} stroke="none"/><rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.fg} stroke="none"/></svg>
            {cart.length > 0 && (
              <div style={{ background:D.gold, borderRadius:8, padding:'2px 8px', display:'flex', alignItems:'center', gap:4 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1h2l1.5 6h5.5l1-4H4" stroke={D.dark} strokeWidth="1.3" strokeLinecap="round"/><circle cx="6.5" cy="10" r="1" fill={D.dark}/><circle cx="9.5" cy="10" r="1" fill={D.dark}/></svg>
                <span style={{ fontSize:11, fontWeight:700, color:D.dark }}>{cart.length}</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding:'6px 18px 14px' }}>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:24, fontWeight:700, color:'#fff', marginBottom:4 }}>Boutique</div>
          <div style={{ fontSize:11, color:D.fg2 }}>Produits recommandés par les pros de ton quartier</div>
        </div>
        {/* Category tabs */}
        <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none', padding:'0 14px 14px' }}>
          {CATS.map(c => {
            const on = cat === c
            return (
              <button key={c} onClick={()=>setCat(c)} style={{ flexShrink:0, padding:'7px 14px', borderRadius:20, border: on ? `1.5px solid ${D.gold}` : '1.5px solid rgba(255,255,255,.15)', background: on ? D.gold : 'rgba(255,255,255,.08)', color: on ? D.dark : D.fg, fontSize:11, fontWeight: on ? 700 : 500, cursor:'pointer', fontFamily:"'Outfit',sans-serif", marginRight:6, transition:'all .15s' }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Products */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'14px', paddingBottom: cart.length > 0 ? 120 : 90 }}>
        <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10 }}>
          {filtered.length} produit{filtered.length > 1 ? 's' : ''} · {cat}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background:'#fff', border:`1px solid ${inCart(p.id) ? D.gold : D.border}`, borderRadius:16, overflow:'hidden', boxShadow: inCart(p.id) ? `0 2px 12px rgba(200,169,110,.2)` : '0 2px 8px rgba(0,0,0,.05)', transition:'all .2s' }}>
              {/* Card header */}
              <div style={{ background:p.gradient, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={()=>setExpanded(expanded===p.id ? null : p.id)}>
                <div style={{ width:50, height:50, borderRadius:14, background:'rgba(255,255,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{p.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{p.name}</span>
                    {p.tag && <span style={{ fontSize:9, background:p.tag.includes('%') ? '#ef4444' : D.gold, color:'#fff', padding:'2px 6px', borderRadius:5, fontWeight:700, flexShrink:0 }}>{p.tag}</span>}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.6)' }}>{p.brand}</div>
                  <div style={{ display:'flex', gap:4, alignItems:'center', marginTop:4 }}>
                    {[1,2,3,4,5].map(i=><svg key={i} width="8" height="8" viewBox="0 0 10 10" fill={i<=Math.round(p.rating)?D.gold:'rgba(255,255,255,.2)'}><path d="M5 1l1.2 3.1H9l-2.6 1.9 1 3.1L5 7.3 2.6 9.1l1-3.1L1 4.1h2.8L5 1z"/></svg>)}
                    <span style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginLeft:2 }}>({p.reviews})</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  {p.oldPrice && <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', textDecoration:'line-through' }}>{p.oldPrice}€</div>}
                  <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:22, fontWeight:700, color:'#fff' }}>{p.price}€</div>
                </div>
              </div>

              {/* Expanded desc */}
              {expanded === p.id && (
                <div style={{ padding:'10px 16px', background:'rgba(200,169,110,.04)', borderBottom:`1px solid ${D.border}` }}>
                  <div style={{ fontSize:12, color:'#555', lineHeight:1.6 }}>{p.desc}</div>
                </div>
              )}

              {/* Card footer */}
              <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: p.retrait ? D.gold : '#60a5fa' }} />
                  <span style={{ fontSize:10, color:D.muted }}>{p.pickup}</span>
                </div>
                <button
                  onClick={()=>toggle(p.id)}
                  style={{ background: inCart(p.id) ? D.gold : D.dark, color: inCart(p.id) ? D.dark : '#fff', border:'none', borderRadius:9, padding:'8px 16px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif", transition:'all .2s' }}
                >
                  {inCart(p.id) ? '✓ Ajouté' : 'Ajouter'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Retrait chez le barbier upsell */}
        {cart.length > 0 && (
          <div style={{ background:`linear-gradient(135deg,${D.dark},${D.dark2})`, border:'1px solid rgba(200,169,110,.2)', borderRadius:14, padding:'12px 14px', marginTop:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#fff', marginBottom:4 }}>Retrait chez Alex B. disponible</div>
            <div style={{ fontSize:10, color:D.fg2 }}>Les produits marqués ● peuvent être récupérés lors de ton prochain RDV. Zéro livraison.</div>
          </div>
        )}
      </div>

      {/* Cart CTA */}
      {cart.length > 0 && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 16px', paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))', background:'#fff', borderTop:`1px solid ${D.border}` }}>
          <button style={{ width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span>Commander {cart.length} article{cart.length > 1 ? 's' : ''}</span>
            <span style={{ background:'rgba(255,255,255,.15)', borderRadius:7, padding:'3px 10px' }}>{total}€</span>
          </button>
        </div>
      )}

      {cart.length === 0 && <BottomNav active="home" />}
    </div>
  )
}
