'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const D = {
  dark:'#1a1a1a', dark2:'#2d2218',
  gold:'#c8a96e', fg:'#f5f2ed', fg2:'rgba(245,242,237,.55)',
  light:'#faf9f5', border:'#f0ece5',
  muted:'#888', muted2:'#aaa',
}

type Service = { id:string; name:string; description:string; category:string; duration_minutes:number; price_cents:number }
type Employee = { id:string; name:string; role:string; bio:string; color:string; specialties:string[] }
type Hour = { day_name:string; is_open:boolean; open_time:string; close_time:string }
type SalonData = {
  salon: { id:string; slug:string; name:string; tagline:string; description:string; address:string; city:string; phone:string; accent_color:string; primary_color:string }
  services: Service[]
  employees: Employee[]
  hours: Hour[]
}

function nextDays(n: number) {
  const days = []
  for (let i = 1; i <= n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}
function fmtDay(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })
}
const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30']

export default function BarbierPage() {
  const router = useRouter()
  const params = useParams()
  const slug = (params?.id as string) || ''

  const [data, setData] = useState<SalonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<'services'|'portfolio'|'infos'>('services')

  // Booking modal state
  const [bookSvc, setBookSvc] = useState<Service | null>(null)
  const [bookEmp, setBookEmp] = useState<Employee | null>(null)
  const [bookDay, setBookDay] = useState<Date | null>(null)
  const [bookSlot, setBookSlot] = useState<string | null>(null)
  const [bookName, setBookName] = useState('')
  const [bookPhone, setBookPhone] = useState('')
  const [bookNote, setBookNote] = useState('')
  const [bookLoading, setBookLoading] = useState(false)
  const [bookDone, setBookDone] = useState(false)
  const [bookErr, setBookErr] = useState('')

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (role === 'pro') { router.replace('/dashboard'); return }
      const name = localStorage.getItem('cp_firstName') || ''
      if (name) setBookName(name)
    } catch {}

    fetch(`/api/book/salon?slug=${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !d.salon) { setNotFound(true); setLoading(false); return }
        setData(d)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug, router])

  const openBook = (svc: Service) => {
    setBookSvc(svc)
    setBookEmp(data?.employees[0] || null)
    setBookDay(nextDays(7)[0])
    setBookSlot(null)
    setBookDone(false)
    setBookErr('')
  }

  const submitBook = async () => {
    if (!bookSvc || !bookDay || !bookSlot || !bookName.trim() || !bookPhone.trim()) {
      setBookErr('Tous les champs sont requis')
      return
    }
    setBookLoading(true)
    setBookErr('')
    try {
      const res = await fetch('/api/book', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          salonId: data!.salon.id,
          serviceId: bookSvc.id,
          employeeId: bookEmp?.id || null,
          date: bookDay.toISOString().split('T')[0],
          time: bookSlot,
          firstName: bookName.split(' ')[0] || bookName,
          lastName: bookName.split(' ').slice(1).join(' ') || '',
          phone: bookPhone,
          note: bookNote,
        }),
      })
      if (res.ok) {
        setBookDone(true)
        try {
          localStorage.setItem('cp_firstName', bookName.split(' ')[0])
          localStorage.setItem('cp_phone', bookPhone)
          localStorage.setItem('cp_salon_id', salon.id)
        } catch {}
      } else {
        const j = await res.json()
        setBookErr(j.error || 'Erreur lors de la réservation')
      }
    } catch { setBookErr('Erreur réseau') }
    setBookLoading(false)
  }

  if (loading) return (
    <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:D.dark }}>
      <div style={{ fontSize:13, color:D.fg2 }}>Chargement…</div>
    </div>
  )

  if (notFound || !data) return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:D.light, gap:16 }}>
      <div style={{ fontSize:32 }}>✂️</div>
      <div style={{ fontSize:16, fontWeight:700, color:D.dark }}>Salon introuvable</div>
      <Link href="/quartier" style={{ color:D.gold, textDecoration:'none', fontSize:13 }}>← Retour au quartier</Link>
    </div>
  )

  const { salon, services, employees, hours } = data
  const accent = salon.accent_color || D.gold
  const tags = [...new Set(services.map(s => s.name))].slice(0,4)

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

        <div style={{ padding:'6px 18px 0' }}>
          <button onClick={()=>router.back()} style={{ background:'none', border:'none', color:D.gold, fontSize:12, fontWeight:500, cursor:'pointer', padding:'0 0 8px', fontFamily:"'Outfit',sans-serif" }}>← Retour</button>
        </div>

        <div style={{ padding:'0 18px 0', display:'flex', gap:14, alignItems:'center' }}>
          <div style={{ width:60, height:60, borderRadius:18, background:`linear-gradient(135deg,${accent},${D.dark2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:28 }}>✂️</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:22, fontWeight:700, color:'#fff' }}>{salon.name}</span>
              <span style={{ fontSize:9, background:accent, color:D.dark, padding:'2px 6px', borderRadius:5, fontWeight:700 }}>✓ Vérifié</span>
            </div>
            <div style={{ fontSize:11, color:D.fg2, marginTop:2 }}>{salon.tagline || 'Salon de coiffure'}</div>
            <div style={{ fontSize:10, color:D.fg2 }}>{salon.city}</div>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, padding:'10px 18px 0', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(74,222,128,.12)', border:'1px solid rgba(74,222,128,.25)', borderRadius:8, padding:'4px 10px' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }} />
            <span style={{ fontSize:10, color:'#4ade80', fontWeight:600 }}>Disponible</span>
          </div>
          {services.length > 0 && (
            <div style={{ background:'rgba(200,169,110,.12)', border:'1px solid rgba(200,169,110,.25)', borderRadius:8, padding:'4px 10px' }}>
              <span style={{ fontSize:10, color:accent }}>À partir de {Math.round(Math.min(...services.map(s=>s.price_cents))/100)}€</span>
            </div>
          )}
          {employees.length > 0 && (
            <div style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'4px 10px' }}>
              <span style={{ fontSize:10, color:D.fg2 }}>{employees.length} coiffeur{employees.length>1?'s':''}</span>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:0, padding:'12px 18px 0' }}>
          {(['services','portfolio','infos'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'8px 4px', border:'none', background:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight:tab===t?700:400, color:tab===t?'#fff':D.fg2, borderBottom:tab===t?`2px solid ${accent}`:'2px solid transparent', transition:'all .15s' }}>
              {t === 'services' ? 'Services' : t === 'portfolio' ? 'Équipe' : 'Infos'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'14px', paddingBottom:90 }}>

        {/* Services */}
        {tab === 'services' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {services.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:D.muted, fontSize:13 }}>Aucun service configuré</div>
            ) : services.map(s => (
              <div key={s.id} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:13, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:D.dark, marginBottom:2 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:D.muted }}>{s.duration_minutes} min{s.description ? ` · ${s.description}` : ''}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:700, color:accent }}>{Math.round(s.price_cents/100)}€</span>
                  <button
                    onClick={() => openBook(s)}
                    style={{ background:D.dark, color:'#fff', border:'none', borderRadius:8, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}
                  >
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Équipe */}
        {tab === 'portfolio' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {employees.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:D.muted, fontSize:13 }}>Aucun membre d'équipe</div>
            ) : employees.map(e => (
              <div key={e.id} style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:13, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${e.color||accent},${D.dark2})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>✂️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:D.dark }}>{e.name}</div>
                  <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{e.role}</div>
                  {e.bio && <div style={{ fontSize:11, color:D.muted, marginTop:4, lineHeight:1.5 }}>{e.bio}</div>}
                  {e.specialties?.length > 0 && (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                      {e.specialties.map(sp => (
                        <span key={sp} style={{ fontSize:10, background:'rgba(200,169,110,.08)', border:'1px solid rgba(200,169,110,.2)', borderRadius:6, padding:'2px 8px', color:accent }}>{sp}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Infos */}
        {tab === 'infos' && (
          <>
            {salon.description && (
              <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:D.dark, marginBottom:8 }}>À propos</div>
                <div style={{ fontSize:12, color:D.muted, lineHeight:1.6 }}>{salon.description}</div>
              </div>
            )}
            {hours.length > 0 && (
              <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ fontSize:11, fontWeight:700, color:D.dark, marginBottom:10 }}>Horaires</div>
                {hours.map(h => (
                  <div key={h.day_name} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${D.border}` }}>
                    <span style={{ fontSize:12, color:D.dark, textTransform:'capitalize' }}>{h.day_name}</span>
                    <span style={{ fontSize:12, color:h.is_open?D.muted:'#ef4444', fontWeight:500 }}>
                      {h.is_open ? `${h.open_time} – ${h.close_time}` : 'Fermé'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize:11, fontWeight:700, color:D.dark, marginBottom:8 }}>Adresse</div>
              <div style={{ fontSize:12, color:D.muted }}>{salon.address}</div>
              <div style={{ fontSize:11, color:accent, marginTop:4 }}>{salon.city}</div>
            </div>
            {salon.phone && (
              <a href={`tel:${salon.phone}`} style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', border:`1px solid ${D.border}`, borderRadius:14, padding:'14px 16px', textDecoration:'none', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                <span style={{ fontSize:22 }}>📞</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:D.dark }}>Appeler</div>
                  <div style={{ fontSize:11, color:D.muted }}>{salon.phone}</div>
                </div>
              </a>
            )}
          </>
        )}
      </div>

      {/* Booking modal */}
      {bookSvc && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'flex-end', zIndex:100 }} onClick={e => { if (e.target === e.currentTarget) setBookSvc(null) }}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 18px', paddingBottom:'calc(20px + env(safe-area-inset-bottom,0px))', width:'100%', maxHeight:'85vh', overflowY:'auto' }}>

            {bookDone ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
                <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:22, fontWeight:700, color:D.dark, marginBottom:8 }}>Réservation confirmée !</div>
                <div style={{ fontSize:13, color:D.muted, marginBottom:24 }}>
                  {bookSvc.name} · {bookDay ? fmtDay(bookDay) : ''} à {bookSlot}<br/>
                  chez {salon.name}
                </div>
                <a href="/rdv" style={{ display:'block', width:'100%', padding:14, borderRadius:12, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", textDecoration:'none', textAlign:'center', boxSizing:'border-box' }}>
                  Voir mes RDV →
                </a>
                <a href="/onboarding" style={{ display:'block', width:'100%', padding:14, borderRadius:12, background:'transparent', color:accent, fontSize:13, fontWeight:600, border:`1.5px solid ${accent}`, cursor:'pointer', fontFamily:"'Outfit',sans-serif", textDecoration:'none', textAlign:'center', boxSizing:'border-box', marginTop:10 }}>
                  Créer un compte pour suivre mes RDVs
                </a>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <div>
                    <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:18, fontWeight:700, color:D.dark }}>Réserver · {bookSvc.name}</div>
                    <div style={{ fontSize:11, color:D.muted, marginTop:2 }}>{bookSvc.duration_minutes} min · {Math.round(bookSvc.price_cents/100)}€</div>
                  </div>
                  <button onClick={()=>setBookSvc(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:D.muted, padding:4 }}>×</button>
                </div>

                {/* Coiffeur */}
                {employees.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Coiffeur</div>
                    <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none' }}>
                      {employees.map(e => (
                        <button key={e.id} onClick={()=>setBookEmp(e)} style={{ flexShrink:0, padding:'8px 14px', borderRadius:10, border:`1.5px solid ${bookEmp?.id===e.id?accent:D.border}`, background:bookEmp?.id===e.id?`rgba(200,169,110,.1)`:'#fff', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:600, color:bookEmp?.id===e.id?accent:D.dark }}>
                          {e.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Date</div>
                  <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
                    {nextDays(7).map(d => {
                      const sel = bookDay?.toDateString() === d.toDateString()
                      return (
                        <button key={d.toDateString()} onClick={()=>{ setBookDay(d); setBookSlot(null) }} style={{ flexShrink:0, padding:'8px 12px', borderRadius:10, border:`1.5px solid ${sel?accent:D.border}`, background:sel?`rgba(200,169,110,.1)`:'#fff', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:11, fontWeight:sel?700:400, color:sel?accent:D.dark, textAlign:'center', minWidth:70 }}>
                          {fmtDay(d)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Créneau */}
                {bookDay && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Créneau</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {SLOTS.map(sl => (
                        <button key={sl} onClick={()=>setBookSlot(sl)} style={{ padding:'7px 12px', borderRadius:8, border:`1.5px solid ${bookSlot===sl?accent:D.border}`, background:bookSlot===sl?`rgba(200,169,110,.1)`:'#fff', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:bookSlot===sl?700:400, color:bookSlot===sl?accent:D.dark }}>
                          {sl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Infos client */}
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:D.muted, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Vos informations</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <input
                      value={bookName}
                      onChange={e=>setBookName(e.target.value)}
                      placeholder="Prénom Nom"
                      style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${D.border}`, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:'none', boxSizing:'border-box' }}
                    />
                    <input
                      value={bookPhone}
                      onChange={e=>setBookPhone(e.target.value)}
                      placeholder="06 00 00 00 00"
                      type="tel"
                      style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${D.border}`, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:'none', boxSizing:'border-box' }}
                    />
                    <input
                      value={bookNote}
                      onChange={e=>setBookNote(e.target.value)}
                      placeholder="Note (optionnel)"
                      style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1px solid ${D.border}`, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:'none', boxSizing:'border-box' }}
                    />
                  </div>
                </div>

                {bookErr && <div style={{ fontSize:12, color:'#ef4444', marginBottom:10, textAlign:'center' }}>{bookErr}</div>}

                <button
                  onClick={submitBook}
                  disabled={bookLoading}
                  style={{ width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", opacity:bookLoading?0.6:1 }}
                >
                  {bookLoading ? 'Envoi…' : `Confirmer · ${Math.round(bookSvc.price_cents/100)}€ →`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CTA sticky */}
      {!bookSvc && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'12px 16px', paddingBottom:'calc(12px + env(safe-area-inset-bottom,0px))', background:'#fff', borderTop:`1px solid ${D.border}` }}>
          <button
            onClick={() => services.length > 0 && openBook(services[0])}
            style={{ width:'100%', padding:15, borderRadius:13, background:D.dark, color:'#fff', fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}
          >
            Réserver avec {salon.name} →
          </button>
        </div>
      )}
    </div>
  )
}
