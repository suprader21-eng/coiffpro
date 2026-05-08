'use client'
import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const sb = getBrowserClient()


/* ── Types ── */
type Salon = {
  id:string; name:string; description:string; address:string; city:string
  phone:string; email:string; instagram:string; google_link:string
  google_maps_embed:string; primary_color:string; accent_color:string
  rating?:number; review_count?:number; slug:string
}
type Employee = { id:string; name:string; role:string; bio:string; color:string; rating:number; review_count:number; specialties:string[]; is_active:boolean }
type Service  = { id:string; name:string; description:string; category:string; duration_minutes:number; price_cents:number; is_active:boolean }
type SalonHour= { day_name:string; is_open:boolean; open_time:string; close_time:string }
type Review   = { id:string; client?:{name:string}; employee?:{name:string}; rating:number; comment:string; created_at:string }
type SalonPhoto = { id:string; url:string; alt:string }

/* ── Helpers ── */
const ini = (n:string) => n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'
const fmtPrice = (c:number) => (c/100).toFixed(0)+'€'
const fmtDur = (m:number) => m<60?`${m} min`:`${Math.floor(m/60)}h${m%60?m%60+'min':''}`
function Stars({ n, size=13 }:{ n:number; size?:number }) {
  return <span style={{color:'#c8a96e',fontSize:size}}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5-Math.round(n))}</span>
}

const ALL_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00']

export default function SalonPage({ params }:{ params:{ salonId:string } }) {
  const [salon, setSalon]         = useState<Salon|null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices]   = useState<Service[]>([])
  const [hours, setHours]         = useState<SalonHour[]>([])
  const [photos, setPhotos]       = useState<SalonPhoto[]>([])
  const [reviews, setReviews]     = useState<Review[]>([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  /* Client auth state */
  const [clientUser, setClientUser]   = useState<any>(null)
  const [clientRecord, setClientRecord] = useState<any>(null)
  const [clientAppts, setClientAppts] = useState<any[]>([])
  const [authView, setAuthView]       = useState<'choice'|'otp'|'verify'|null>(null)
  const [otpEmail, setOtpEmail]       = useState('')
  const [otpCode, setOtpCode]         = useState('')
  const [otpSending, setOtpSending]   = useState(false)
  const [otpError, setOtpError]       = useState('')

  /* Booking state */
  const [view, setView]         = useState<'page'|'booking'|'account'>('page')
  const [step, setStep]         = useState(1)
  const [selSvc, setSelSvc]     = useState<Service|null>(null)
  const [selEmp, setSelEmp]     = useState<Employee|null>(null)
  const [selDate, setSelDate]   = useState(0)
  const [selSlot, setSelSlot]   = useState<string|null>(null)
  const [slots, setSlots]       = useState<{sl:string;taken:boolean}[]>([])
  const [form, setForm]         = useState({ firstName:'', lastName:'', phone:'', email:'', note:'' })
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(()=>{ setMounted(true) },[])

  // Vérifier si le client est déjà connecté
  useEffect(()=>{
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setClientUser(session.user)
        fetchClientData(session.access_token)
      }
    })
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      setClientUser(session?.user || null)
      if (session?.user) fetchClientData(session.access_token)
      else { setClientRecord(null); setClientAppts([]) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchClientData(token: string) {
    const res = await fetch('/api/client/me', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const j = await res.json()
      setClientRecord(j.client)
      setClientAppts(j.appointments || [])
    }
  }

  async function sendOtp() {
    if (!otpEmail.includes('@')) { setOtpError('Email invalide'); return }
    setOtpSending(true); setOtpError('')
    const { error } = await sb.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: true },
    })
    setOtpSending(false)
    if (error) { setOtpError(error.message); return }
    setAuthView('verify')
  }

  async function verifyOtp() {
    if (otpCode.length < 6) return
    setOtpSending(true); setOtpError('')
    const { data, error } = await sb.auth.verifyOtp({ email: otpEmail, token: otpCode, type: 'email' })
    setOtpSending(false)
    if (error) { setOtpError('Code incorrect ou expiré, réessayez'); return }
    setClientUser(data.user)
    setAuthView(null)
    setOtpCode('')
    if (data.session) fetchClientData(data.session.access_token)
  }

  async function signOut() {
    await sb.auth.signOut()
    setClientUser(null); setClientRecord(null); setClientAppts([])
  }

  async function cancelAppt(id: string) {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return
    const res = await fetch('/api/client/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'cancel', appointmentId: id }),
    })
    if (res.ok) {
      setClientAppts(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    } else {
      const j = await res.json(); alert(j.error)
    }
  }

  /* Load salon data — via API route (service role, bypass RLS, works sans auth) */
  useEffect(()=>{
    async function load() {
      const res = await fetch(`/api/book/salon?slug=${encodeURIComponent(params.salonId)}`)
      if (!res.ok) { setNotFound(true); setLoading(false); return }
      const json = await res.json()
      if (!json.salon) { setNotFound(true); setLoading(false); return }
      setSalon(json.salon)
      setEmployees(json.employees)
      setServices(json.services)
      setHours(json.hours)
      setPhotos(json.photos)
      setReviews(json.reviews)
      setLoading(false)
    }
    load()
  }, [params.salonId])

  /* Load slots for selected date + employee — via API (bypass RLS) */
  useEffect(()=>{
    if (!selEmp || !salon) return
    async function loadSlots() {
      if (!salon) return
      const date = addDays(new Date(), selDate+1)
      const dayStart = new Date(date); dayStart.setHours(0,0,0,0)
      const dayEnd   = new Date(date); dayEnd.setHours(23,59,59,999)
      const params = new URLSearchParams({
        salonId: salon.id,
        employeeId: selEmp!.id,
        from: dayStart.toISOString(),
        to:   dayEnd.toISOString(),
      })
      const res = await fetch(`/api/book/slots?${params}`)
      const json = res.ok ? await res.json() : { takenTimes: [] }
      setSlots(ALL_SLOTS.map(sl=>({ sl, taken: (json.takenTimes||[]).includes(sl) })))
    }
    loadSlots()
  }, [selEmp, selDate, salon])

  const confirm = async () => {
    if (!salon || !selSvc) return
    setSubmitting(true)
    try {
      const date = mounted ? addDays(new Date(), selDate+1) : new Date()
      const dateStr = format(date, 'yyyy-MM-dd', {locale:fr})
      const res = await fetch('/api/book', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          salonId: salon.id,
          serviceId: selSvc.id,
          employeeId: selEmp?.id || null,
          date: dateStr,
          time: selSlot,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email || clientUser?.email || '',
          note: form.note,
        })
      })
      const data = await res.json()
      if (data.success) {
        setStep(5)
        // Lier le compte si connecté
        if (clientUser && form.phone) {
          const { data: { session } } = await sb.auth.getSession()
          if (session) {
            const r = await fetch('/api/client/me', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
              body: JSON.stringify({ action: 'link_account', phone: form.phone, salonId: salon.id, name: `${form.firstName} ${form.lastName}`.trim() }),
            })
            if (r.ok) { const j = await r.json(); setClientRecord(j.client); fetchClientData(session.access_token) }
          }
        }
      } else alert(data.error || 'Erreur lors de la réservation')
    } finally { setSubmitting(false) }
  }

  const reset = () => {
    setStep(1); setSelSvc(null); setSelEmp(null); setSelSlot(null)
    setForm({firstName:'',lastName:'',phone:'',email:'',note:''})
  }

  const dates = mounted ? Array.from({length:7},(_,i)=>{
    const d = addDays(new Date(),i+1)
    return { d, short: format(d,'EEE d',{locale:fr}), full: format(d,'EEEE d MMMM',{locale:fr}) }
  }) : Array.from({length:7},(_,i)=>({ d:new Date(), short:`J+${i+1}`, full:`Jour ${i+1}` }))

  const cats = [...new Set(services.map(s=>s.category))]
  const T = salon?.primary_color || '#1a1a1a'
  const A = salon?.accent_color || '#c8a96e'

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <div style={{textAlign:'center',color:'#aaa'}}>
        <div style={{fontSize:32,marginBottom:12}}>✂</div>
        <div>Chargement…</div>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",textAlign:'center',padding:24}}>
      <div>
        <div style={{fontSize:48,marginBottom:16}}>✂</div>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:8}}>Salon introuvable</h1>
        <p style={{color:'#888',fontSize:14}}>Ce lien de réservation n'existe pas ou a été modifié.</p>
      </div>
    </div>
  )

  if (!salon) return null

  /* ══ AUTH MODAL ══ */
  const AuthModal = authView ? (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:380,fontFamily:"'Outfit',system-ui,sans-serif",boxShadow:'0 12px 40px rgba(0,0,0,.15)'}}>
        {authView === 'choice' && <>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:28,marginBottom:8}}>👤</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:6}}>Votre espace client</div>
            <div style={{fontSize:13,color:'#888',lineHeight:1.5}}>Connectez-vous pour retrouver vos anciens RDV et réserver plus vite.</div>
          </div>
          <button onClick={()=>setAuthView('otp')}
            style={{width:'100%',background:T,color:'#fff',border:'none',borderRadius:11,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>
            Se connecter / Créer un compte
          </button>
          <button onClick={()=>setAuthView(null)}
            style={{width:'100%',background:'#f5f5f5',color:'#555',border:'none',borderRadius:11,padding:'13px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            Continuer sans compte
          </button>
        </>}
        {authView === 'otp' && <>
          <button onClick={()=>setAuthView('choice')} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
          <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>Votre email</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Nous vous enverrons un code à 6 chiffres par email.</div>
          <input value={otpEmail} onChange={e=>{setOtpEmail(e.target.value);setOtpError('')}}
            placeholder="votre@email.fr" type="email" autoComplete="email"
            style={{width:'100%',border:'1.5px solid #e8e8e8',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',outline:'none',marginBottom:10}}
            onKeyDown={e=>e.key==='Enter'&&sendOtp()}
          />
          {otpError&&<div style={{fontSize:11,color:'#e53e3e',marginBottom:8}}>{otpError}</div>}
          <button onClick={sendOtp} disabled={otpSending}
            style={{width:'100%',background:T,color:'#fff',border:'none',borderRadius:11,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:otpSending?.6:1}}>
            {otpSending ? 'Envoi…' : 'Envoyer le code →'}
          </button>
        </>}
        {authView === 'verify' && <>
          <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Entrez votre code</div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Code à 6 chiffres envoyé à <strong>{otpEmail}</strong></div>
          <input value={otpCode} onChange={e=>{setOtpCode(e.target.value.replace(/\D/g,'').slice(0,6));setOtpError('')}}
            placeholder="123456" type="text" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
            style={{width:'100%',border:'1.5px solid #e8e8e8',borderRadius:10,padding:'14px',fontSize:28,fontFamily:'monospace',outline:'none',marginBottom:10,textAlign:'center' as const,letterSpacing:'0.4em'}}
            onKeyDown={e=>e.key==='Enter'&&verifyOtp()}
          />
          {otpError&&<div style={{fontSize:11,color:'#e53e3e',marginBottom:8}}>{otpError}</div>}
          <button onClick={verifyOtp} disabled={otpSending||otpCode.length<6}
            style={{width:'100%',background:T,color:'#fff',border:'none',borderRadius:11,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:(otpSending||otpCode.length<6)?.5:1,marginBottom:10}}>
            {otpSending ? 'Vérification…' : 'Confirmer →'}
          </button>
          <button onClick={()=>{setOtpCode('');sendOtp()}} style={{width:'100%',background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit'}}>
            Renvoyer le code
          </button>
        </>}
      </div>
    </div>
  ) : null

  /* ══ COMPTE CLIENT ══ */
  if (view === 'account') {
    const upcoming = clientAppts.filter(a => new Date(a.scheduled_at) > new Date() && a.status !== 'cancelled')
    const past = clientAppts.filter(a => new Date(a.scheduled_at) <= new Date() || a.status === 'cancelled')
    return (
      <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Outfit',system-ui,sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
        {AuthModal}
        <div style={{position:'sticky',top:0,zIndex:50,background:'#fff',borderBottom:'1px solid #f0f0f0',height:54,display:'flex',alignItems:'center',padding:'0 20px',gap:12}}>
          <button onClick={()=>setView('page')} style={{background:'none',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'inherit'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>Retour
          </button>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,flex:1,textAlign:'center'}}>Mon espace</div>
          <button onClick={signOut} style={{background:'none',border:'1px solid #f0f0f0',borderRadius:8,padding:'5px 10px',fontSize:11,cursor:'pointer',color:'#888',fontFamily:'inherit'}}>Déconnexion</button>
        </div>
        <div style={{maxWidth:560,margin:'0 auto',padding:'24px 20px 60px'}}>
          <div style={{background:`${T}08`,border:`1px solid ${T}22`,borderRadius:12,padding:'14px 16px',marginBottom:24,display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:T,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>
              {(clientRecord?.name||clientUser?.email||'?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>{clientRecord?.name||'Mon compte'}</div>
              <div style={{fontSize:11,color:'#888'}}>{clientUser?.email}</div>
            </div>
          </div>

          {/* Prochain RDV */}
          {upcoming.length > 0 && (
            <div style={{marginBottom:24}}>
              <div style={{fontSize:11,fontWeight:700,color:'#bbb',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:10}}>Prochains rendez-vous</div>
              {upcoming.map((a:any) => {
                const d = new Date(a.scheduled_at)
                const canCancel = d.getTime() - Date.now() > 2*3600*1000
                return (
                  <div key={a.id} style={{border:'1.5px solid '+T,borderRadius:12,padding:'14px 16px',marginBottom:8,background:`${T}04`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                      <div style={{fontSize:14,fontWeight:600}}>{a.service?.name||'RDV'}</div>
                      <div style={{fontSize:13,fontWeight:700,color:T}}>{a.service?.price_cents?(a.service.price_cents/100).toFixed(0)+'€':''}</div>
                    </div>
                    <div style={{fontSize:12,color:'#666',marginBottom:2}}>📅 {d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} à {d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                    {a.employee&&<div style={{fontSize:12,color:'#888',marginBottom:8}}>✂ avec {a.employee.name}</div>}
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>{
                        if(a.service){setSelSvc(a.service)}
                        if(a.employee){setSelEmp(a.employee)}
                        setStep(3); setView('booking')
                      }} style={{flex:1,background:T,color:'#fff',border:'none',borderRadius:9,padding:'9px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                        🔄 Reprendre ce RDV
                      </button>
                      {canCancel&&<button onClick={()=>{if(window.confirm('Annuler ce RDV ?'))cancelAppt(a.id)}}
                        style={{padding:'9px 14px',background:'#fff',color:'#e53e3e',border:'1px solid #fed7d7',borderRadius:9,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                        Annuler
                      </button>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Historique */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#bbb',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:10}}>Historique</div>
            {past.length === 0
              ? <div style={{textAlign:'center',padding:'28px 0',color:'#ccc',fontSize:13}}>Aucun RDV passé</div>
              : past.map((a:any) => {
                  const d = new Date(a.scheduled_at)
                  const cancelled = a.status === 'cancelled'
                  return (
                    <div key={a.id} style={{border:'1px solid #f0f0f0',borderRadius:11,padding:'12px 14px',marginBottom:7,opacity:cancelled?.5:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <div style={{fontSize:13,fontWeight:500}}>{a.service?.name||'RDV'}</div>
                        {cancelled
                          ? <span style={{fontSize:10,padding:'2px 8px',background:'#fff0f0',color:'#e53e3e',borderRadius:20}}>Annulé</span>
                          : <span style={{fontSize:10,padding:'2px 8px',background:'#e8f7ee',color:'#1a9648',borderRadius:20}}>Terminé</span>}
                      </div>
                      <div style={{fontSize:11,color:'#aaa',marginBottom:cancelled?0:8}}>
                        {d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} · {a.employee?.name||''}
                      </div>
                      {!cancelled&&<button onClick={()=>{
                        if(a.service)setSelSvc(a.service)
                        if(a.employee)setSelEmp(a.employee)
                        setStep(3); setView('booking')
                      }} style={{fontSize:11,color:T,background:'none',border:`1px solid ${T}44`,borderRadius:8,padding:'5px 10px',cursor:'pointer',fontFamily:'inherit'}}>
                        🔄 Reprendre ce RDV
                      </button>}
                    </div>
                  )
                })
            }
          </div>

          <button onClick={()=>{setStep(1);setView('booking')}}
            style={{width:'100%',background:T,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginTop:20}}>
            + Nouveau RDV →
          </button>
        </div>
      </div>
    )
  }

  /* ══ BOOKING FLOW ══ */
  if (view === 'booking') return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .slot:hover:not(:disabled){border-color:${T}!important;color:${T}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease both}
        @keyframes check{to{stroke-dashoffset:0}}
      `}</style>
      {AuthModal}

      {/* Nav */}
      <div style={{position:'sticky',top:0,zIndex:50,background:'#fff',borderBottom:'1px solid #f0f0f0',height:54,display:'flex',alignItems:'center',padding:'0 20px',gap:12}}>
        <button onClick={()=>{setView('page');reset()}} style={{background:'none',border:'none',cursor:'pointer',color:'#888',display:'flex',alignItems:'center',gap:6,fontSize:13,fontFamily:'inherit'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Retour
        </button>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,flex:1,textAlign:'center'}}>✂ {salon.name}</div>
        {clientUser
          ? <button onClick={()=>setView('account')} style={{background:`${T}15`,color:T,border:'none',borderRadius:8,padding:'5px 10px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>👤 Mon compte</button>
          : <button onClick={()=>setAuthView('choice')} style={{background:'none',border:'1px solid #e8e8e8',borderRadius:8,padding:'5px 10px',fontSize:11,cursor:'pointer',color:'#666',fontFamily:'inherit'}}>Connexion</button>
        }
      </div>

      <div style={{maxWidth:640,margin:'0 auto',padding:'24px 20px 60px'}}>

        {/* Steps */}
        {step<5&&(
          <div style={{display:'flex',alignItems:'center',marginBottom:24}} className="fu">
            {['Service','Coiffeur','Date','Infos'].map((l,i)=>{
              const s=i+1,done=s<step,active=s===step
              return (
                <div key={l} style={{display:'flex',alignItems:'center',flex:i<3?1:0}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:done?'pointer':'default'}} onClick={()=>done&&setStep(s)}>
                    <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,background:done||active?T:'#f0f0f0',color:done||active?'#fff':'#aaa',boxShadow:active?`0 0 0 4px ${T}22`:undefined}}>
                      {done?'✓':s}
                    </div>
                    <span style={{fontSize:10,color:active?T:'#ccc',fontWeight:active?600:400,whiteSpace:'nowrap'}}>{l}</span>
                  </div>
                  {i<3&&<div style={{flex:1,height:1,background:done?T:'#e8e8e8',margin:'0 6px',marginBottom:16}} />}
                </div>
              )
            })}
          </div>
        )}

        {/* Step 1: Service */}
        {step===1&&(
          <div className="fu">
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Quelle prestation ?</h2>
            {cats.map(cat=>(
              <div key={cat} style={{marginBottom:16}}>
                <div style={{fontSize:10,fontWeight:700,color:'#ccc',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                  {cat}<div style={{flex:1,height:1,background:'#f0f0f0'}}/>
                </div>
                {services.filter(s=>s.category===cat).map(s=>(
                  <div key={s.id} onClick={()=>{setSelSvc(s);setStep(2)}}
                    style={{display:'flex',alignItems:'center',padding:'13px 15px',border:`1.5px solid ${selSvc?.id===s.id?T:'#f0f0f0'}`,borderRadius:11,cursor:'pointer',marginBottom:7,background:selSvc?.id===s.id?`${T}06`:'#fff',transition:'all .15s'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:500,marginBottom:2}}>{s.name}</div>
                      <div style={{fontSize:11,color:'#aaa'}}>{s.description||''} · {fmtDur(s.duration_minutes)}</div>
                    </div>
                    <div style={{fontSize:19,fontWeight:700,color:A}}>{fmtPrice(s.price_cents)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Employee */}
        {step===2&&(
          <div className="fu">
            <button onClick={()=>setStep(1)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
            {selSvc&&<div style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:10,padding:'10px 14px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><div style={{fontSize:13,fontWeight:500}}>{selSvc.name}</div><div style={{fontSize:11,color:'#aaa'}}>{fmtDur(selSvc.duration_minutes)}</div></div>
              <div style={{fontSize:17,fontWeight:700,color:A}}>{fmtPrice(selSvc.price_cents)}</div>
            </div>}
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Avec qui ?</h2>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {/* Option "Premier disponible" */}
              <div onClick={()=>{setSelEmp(null);setStep(3)}}
                style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:'1.5px solid #f0f0f0',borderRadius:12,cursor:'pointer',background:'#e8f7ee',transition:'all .15s'}}>
                <div style={{width:46,height:46,borderRadius:'50%',background:'#3dba6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>★</div>
                <div>
                  <div style={{fontSize:14,fontWeight:600}}>Premier disponible</div>
                  <div style={{fontSize:11,color:'#1a9648'}}>Meilleur créneau parmi toute l'équipe</div>
                </div>
              </div>
              {employees.map(e=>(
                <div key={e.id} onClick={()=>{setSelEmp(e);setStep(3)}}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:`1.5px solid ${selEmp?.id===e.id?T:'#f0f0f0'}`,borderRadius:12,cursor:'pointer',transition:'all .15s',background:selEmp?.id===e.id?`${T}06`:'#fff'}}>
                  <div style={{width:46,height:46,borderRadius:'50%',background:(e.color||'#c8a96e')+'20',color:e.color||'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>{ini(e.name)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{e.name}</div>
                    <div style={{fontSize:11,color:'#aaa',marginBottom:4}}>{e.role}</div>
                    {e.rating>0&&<div style={{display:'flex',alignItems:'center',gap:4}}><Stars n={e.rating} size={11}/><span style={{fontSize:11,color:'#555',fontWeight:600}}>{e.rating}</span><span style={{fontSize:10,color:'#bbb'}}>({e.review_count})</span></div>}
                    {e.specialties?.length>0&&<div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap' as const}}>
                      {e.specialties.slice(0,3).map(sp=><span key={sp} style={{fontSize:9,padding:'2px 7px',background:(e.color||'#c8a96e')+'15',borderRadius:20,color:e.color||'#c8a96e'}}>{sp}</span>)}
                    </div>}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date + Time */}
        {step===3&&(
          <div className="fu">
            <button onClick={()=>setStep(2)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
            <div style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:11,padding:'11px 14px',marginBottom:20,display:'flex',gap:10,alignItems:'center'}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:(selEmp?.color||'#3dba6f')+'20',color:selEmp?.color||'#3dba6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{selEmp?ini(selEmp.name):'★'}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{selSvc?.name}</div><div style={{fontSize:11,color:'#aaa'}}>avec {selEmp?.name||'Premier disponible'}</div></div>
              <div style={{fontSize:16,fontWeight:700,color:A}}>{selSvc&&fmtPrice(selSvc.price_cents)}</div>
            </div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Quand ?</h2>
            <div style={{display:'flex',gap:6,marginBottom:18,overflowX:'auto' as const,paddingBottom:4}}>
              {dates.map((d,i)=>(
                <div key={i} onClick={()=>{setSelDate(i);setSelSlot(null)}}
                  style={{flexShrink:0,width:64,borderRadius:11,border:`1.5px solid ${i===selDate?T:'#f0f0f0'}`,background:i===selDate?T:'#fff',cursor:'pointer',padding:'9px 5px',textAlign:'center' as const,transition:'all .15s'}}>
                  <div style={{fontSize:10,color:i===selDate?'rgba(255,255,255,.6)':'#bbb',textTransform:'capitalize' as const,marginBottom:2}}>{d.short.split(' ')[0]}</div>
                  <div style={{fontSize:19,fontWeight:700,color:i===selDate?'#fff':T,lineHeight:1}}>{d.short.split(' ')[1]}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:20}}>
              {slots.map(({sl,taken})=>(
                <button key={sl} disabled={taken} className="slot"
                  onClick={()=>!taken&&setSelSlot(sl)}
                  style={{padding:'11px 4px',textAlign:'center' as const,fontSize:13,fontWeight:selSlot===sl?600:400,borderRadius:10,border:`1.5px solid ${selSlot===sl?T:taken?'#f5f5f5':'#f0f0f0'}`,background:selSlot===sl?T:taken?'#fafafa':'#fff',color:selSlot===sl?'#fff':taken?'#ddd':T,cursor:taken?'not-allowed':'pointer',opacity:taken?.5:1,transition:'all .12s'}}>
                  {sl}
                </button>
              ))}
              {slots.length===0&&ALL_SLOTS.map(sl=>(
                <button key={sl} className="slot"
                  onClick={()=>setSelSlot(sl)}
                  style={{padding:'11px 4px',textAlign:'center' as const,fontSize:13,fontWeight:selSlot===sl?600:400,borderRadius:10,border:`1.5px solid ${selSlot===sl?T:'#f0f0f0'}`,background:selSlot===sl?T:'#fff',color:selSlot===sl?'#fff':T,cursor:'pointer',transition:'all .12s'}}>
                  {sl}
                </button>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              {selSlot
                ? <button onClick={()=>setStep(4)} style={{background:T,color:'#fff',border:'none',borderRadius:10,padding:'13px 28px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Continuer →</button>
                : <div style={{background:'#f0f0f0',color:'#ccc',borderRadius:10,padding:'13px 28px',fontSize:14,fontWeight:600}}>Choisissez un horaire</div>
              }
            </div>
          </div>
        )}

        {/* Step 4: Info */}
        {step===4&&(
          <div className="fu">
            <button onClick={()=>setStep(3)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Vos informations</h2>
            {/* Bandeau compte connecté */}
            {clientUser && clientRecord && (
              <div style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:18}}>✅</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#1a6640'}}>Connecté en tant que {clientRecord.name}</div>
                  <div style={{fontSize:11,color:'#2d7a4e'}}>Vos infos sont pré-remplies · <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>{
                    const parts = (clientRecord.name||'').split(' ')
                    setForm(f=>({...f, firstName:parts[0]||f.firstName, lastName:parts.slice(1).join(' ')||f.lastName, phone:clientRecord.phone||f.phone, email:clientUser.email||f.email}))
                  }}>Remplir auto</span></div>
                </div>
              </div>
            )}
            {!clientUser && (
              <div style={{background:'#fffbf0',border:'1px solid #e8d898',borderRadius:10,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:16}}>👤</div>
                <div style={{flex:1,fontSize:12,color:'#886600'}}>
                  <span style={{fontWeight:600}}>Vous avez déjà réservé ?</span> <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>setAuthView('choice')}>Connectez-vous</span> pour pré-remplir vos infos.
                </div>
              </div>
            )}
            <div style={{background:`${T}06`,border:`1px solid ${T}22`,borderRadius:11,padding:'12px 14px',marginBottom:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {[['📅 Date',dates[selDate]?.full],['⏰ Heure',selSlot],['✂ Prestation',selSvc?.name],['👤 Avec',selEmp?.name||'Premier disponible']].map(([l,v])=>(
                  <div key={l} style={{padding:'8px 10px',background:'#fff',borderRadius:8}}>
                    <div style={{fontSize:9,color:'#bbb',marginBottom:2}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {([['Prénom *','Marie','firstName'],['Nom *','Dupont','lastName']] as const).map(([l,p,k])=>(
                  <div key={k}>
                    <label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>{l}</label>
                    <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}
                      style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'inherit',color:'#111',outline:'none'}}
                      onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Téléphone * (rappel SMS)</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06 12 34 56 78" type="tel"
                  style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'inherit',color:'#111',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Email (confirmation)</label>
                <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="marie@exemple.fr" type="email"
                  style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:10,padding:'11px 14px',fontSize:14,fontFamily:'inherit',color:'#111',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Note pour le coiffeur (optionnel)</label>
                <textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Instructions spéciales…" rows={2}
                  style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:10,padding:'11px 14px',fontSize:13,fontFamily:'inherit',color:'#111',outline:'none',resize:'none' as const}}
                  onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'} />
              </div>
            </div>
            <button onClick={confirm} disabled={submitting||!form.firstName||!form.phone}
              style={{width:'100%',background:form.firstName&&form.phone?T:'#f0f0f0',color:form.firstName&&form.phone?'#fff':'#ccc',border:'none',borderRadius:12,padding:'15px',fontSize:15,fontWeight:700,cursor:form.firstName&&form.phone?'pointer':'not-allowed',marginTop:18,fontFamily:'inherit',transition:'all .2s'}}>
              {submitting?'Confirmation…':'Confirmer mon RDV →'}
            </button>
            <p style={{textAlign:'center',fontSize:11,color:'#ccc',marginTop:8}}>Annulation gratuite jusqu'à 24h avant</p>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step===5&&(
          <div className="fu" style={{textAlign:'center',maxWidth:460,margin:'0 auto',paddingTop:10}}>
            <svg viewBox="0 0 80 80" width="72" height="72" style={{margin:'0 auto 20px',display:'block'}}>
              <circle cx="40" cy="40" r="36" fill="#e8f7ee" stroke="#1a9648" strokeWidth="2"/>
              <polyline points="24,42 34,52 56,28" fill="none" stroke="#1a9648" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,marginBottom:8}}>C'est confirmé !</h2>
            <p style={{fontSize:14,color:'#888',lineHeight:1.7,marginBottom:20}}>
              {form.firstName}, votre RDV est enregistré.<br/>Un SMS de confirmation vous a été envoyé.
            </p>
            <div style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:14,padding:'16px',marginBottom:14,textAlign:'left' as const}}>
              {[['Prestation',selSvc?.name],['Date',dates[selDate]?.full],['Heure',selSlot],['Avec',selEmp?.name||'Premier disponible'],['Salon',salon.name]].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                  <span style={{color:'#888'}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
            {salon.google_link&&(
              <div style={{background:'#fffbf0',border:'1px solid #eed898',borderRadius:11,padding:'12px 14px',marginBottom:16}}>
                <div style={{fontSize:12,color:'#886600',marginBottom:6}}>⭐ Après votre visite, un message vous sera envoyé pour laisser un avis Google.</div>
                <a href={salon.google_link} target="_blank" rel="noopener" style={{fontSize:12,color:'#886600',fontWeight:600}}>Laisser un avis maintenant →</a>
              </div>
            )}
            {!clientUser && (
              <div style={{background:'#f8f8f8',border:'1px solid #e8e8e8',borderRadius:11,padding:'12px 14px',marginBottom:14,textAlign:'left' as const}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>💡 Créez votre espace client</div>
                <div style={{fontSize:11,color:'#888',marginBottom:8}}>Retrouvez tous vos RDV, annulez ou reprenez en 1 clic.</div>
                <button onClick={()=>setAuthView('otp')} style={{fontSize:12,color:T,background:'none',border:`1px solid ${T}`,borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:'inherit',fontWeight:600}}>
                  Créer mon espace →
                </button>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'center'}}>
              <button onClick={()=>{reset();setView('page')}} style={{background:'#fff',color:'#555',border:'1px solid #e8e8e8',borderRadius:10,padding:'11px 18px',fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Retour au salon</button>
              {clientUser
                ? <button onClick={()=>setView('account')} style={{background:T,color:'#fff',border:'none',borderRadius:10,padding:'11px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Mon compte →</button>
                : <button onClick={()=>{reset();setStep(1)}} style={{background:T,color:'#fff',border:'none',borderRadius:10,padding:'11px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Nouveau RDV →</button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )

  /* ══ PAGE PUBLIQUE ══ */
  return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}
        .svc:hover{box-shadow:0 4px 14px rgba(0,0,0,.07)!important;transform:translateY(-1px)}
        .emp-card:hover{box-shadow:0 6px 24px rgba(0,0,0,.08)!important;transform:translateY(-2px)}
        .rev-card:hover{transform:translateY(-2px)}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fi{animation:fi .5s ease both}
        @media(prefers-color-scheme:dark){.salon-logo{filter:brightness(0) invert(1)}}
      `}</style>
      {AuthModal}

      {/* Nav */}
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #f0f0f0',height:58,display:'flex',alignItems:'center',padding:'0 24px',gap:16}}>
        {(salon as any).logo_url
          ? <img src={(salon as any).logo_url} alt={salon.name} style={{height:32,maxWidth:100,objectFit:'contain'}} className="salon-logo" />
          : <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:700}}>✂ {salon.name}</div>
        }
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {salon.phone&&<a href={`tel:${salon.phone}`} style={{fontSize:12,color:'#666',padding:'6px 12px',border:'1px solid #f0f0f0',borderRadius:8}}>Appeler</a>}
          {clientUser
            ? <button onClick={()=>setView('account')} style={{background:`${T}15`,color:T,border:'none',borderRadius:9,padding:'8px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>👤 Mon compte</button>
            : <button onClick={()=>setAuthView('choice')} style={{background:'#f5f5f5',color:'#555',border:'none',borderRadius:9,padding:'8px 14px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Connexion</button>
          }
          <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Prendre RDV</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{background:'linear-gradient(180deg,#fafafa 0%,#fff 100%)',borderBottom:'1px solid #f0f0f0',padding:'52px 24px 44px'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr auto',gap:40,alignItems:'start',flexWrap:'wrap' as const}}>
          <div className="fi">
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,6vw,60px)',fontWeight:700,lineHeight:1,letterSpacing:'-.02em',marginBottom:14}}>{salon.name}</h1>
            {salon.description&&<p style={{fontSize:15,color:'#666',lineHeight:1.7,maxWidth:500,marginBottom:20}}>{salon.description}</p>}
            <div style={{display:'flex',gap:8,flexWrap:'wrap' as const,marginBottom:24}}>
              {salon.address&&<span style={{fontSize:12,background:'#fff',border:'1px solid #f0f0f0',borderRadius:100,padding:'6px 12px',color:'#666'}}>📍 {salon.address}, {salon.city}</span>}
              {employees.length>0&&<span style={{fontSize:12,background:'#fff',border:'1px solid #f0f0f0',borderRadius:100,padding:'6px 12px',color:'#666'}}>{employees.length} coiffeur{employees.length>1?'s':''}</span>}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:11,padding:'13px 26px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Réserver un créneau →</button>
              {salon.phone&&<a href={`tel:${salon.phone}`} style={{display:'flex',alignItems:'center',padding:'12px 18px',background:'#fff',border:'1px solid #e8e8e8',borderRadius:11,fontSize:13,fontWeight:500,color:'#333'}}>📞</a>}
            </div>
          </div>
          {/* Horaires */}
          {hours.length>0&&(
            <div style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'18px 20px',minWidth:200,boxShadow:'0 4px 20px rgba(0,0,0,.05)',flexShrink:0}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.08em',color:'#bbb',marginBottom:12}}>Horaires</div>
              {hours.map((h,i)=>(
                <div key={h.day_name} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:i<hours.length-1?'1px solid #f5f5f5':undefined,fontSize:12}}>
                  <span style={{color:'#666'}}>{h.day_name}</span>
                  <span style={{color:h.is_open?'#333':'#ccc'}}>{h.is_open?`${h.open_time}–${h.close_time}`:'Fermé'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photos */}
      {photos.length>0&&(
        <div style={{padding:'40px 24px',maxWidth:960,margin:'0 auto'}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,marginBottom:16}}>Notre salon</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            {photos.map(p=>(
              <div key={p.id} style={{borderRadius:10,overflow:'hidden',aspectRatio:'1',background:'#f5f5f5'}}>
                <img src={p.url} alt={p.alt||salon.name} style={{width:'100%',height:'100%',objectFit:'cover' as const}} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Équipe */}
      {employees.length>0&&(
        <div style={{background:'#fafafa',borderTop:'1px solid #f0f0f0',padding:'48px 24px'}}>
          <div style={{maxWidth:960,margin:'0 auto'}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,marginBottom:8}}>Notre équipe</h2>
            <p style={{fontSize:14,color:'#888',marginBottom:20}}>Choisissez votre coiffeur lors de la réservation</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
              {employees.map(e=>(
                <div key={e.id} className="emp-card" onClick={()=>{setSelEmp(e);setView('booking')}}
                  style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'20px',cursor:'pointer',transition:'all .2s'}}>
                  <div style={{width:48,height:48,borderRadius:'50%',background:(e.color||'#c8a96e')+'18',color:e.color||'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,marginBottom:12}}>{ini(e.name)}</div>
                  <div style={{fontSize:15,fontWeight:600,marginBottom:2}}>{e.name}</div>
                  <div style={{fontSize:12,color:'#aaa',marginBottom:6}}>{e.role}</div>
                  {e.rating>0&&<div style={{display:'flex',alignItems:'center',gap:4,marginBottom:8}}><Stars n={e.rating} size={11}/><span style={{fontSize:11,fontWeight:600}}>{e.rating}</span><span style={{fontSize:10,color:'#bbb'}}>({e.review_count})</span></div>}
                  {e.bio&&<p style={{fontSize:11,color:'#888',lineHeight:1.5,marginBottom:10}}>{e.bio}</p>}
                  <div style={{fontSize:12,fontWeight:600,color:T}}>Réserver avec {e.name.split(' ')[0]} →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <div style={{padding:'48px 24px',background:'#fff',borderTop:'1px solid #f0f0f0'}}>
        <div style={{maxWidth:960,margin:'0 auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:24,flexWrap:'wrap' as const,gap:12}}>
            <div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,marginBottom:4}}>Nos prestations</h2>
              <p style={{fontSize:13,color:'#888'}}>{services.length} prestations disponibles</p>
            </div>
            <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Réserver →</button>
          </div>
          {cats.map(cat=>(
            <div key={cat} style={{marginBottom:24}}>
              <div style={{fontSize:10,fontWeight:700,color:'#ccc',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
                {cat}<div style={{flex:1,height:1,background:'#f5f5f5'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:8}}>
                {services.filter(s=>s.category===cat).map(s=>(
                  <div key={s.id} className="svc" onClick={()=>{setSelSvc(s);setView('booking')}}
                    style={{display:'flex',alignItems:'center',padding:'13px 15px',background:'#fff',border:'1px solid #f0f0f0',borderRadius:11,cursor:'pointer',transition:'all .15s',gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{s.name}</div>
                      <div style={{fontSize:11,color:'#bbb'}}>{s.description||''} · {fmtDur(s.duration_minutes)}</div>
                    </div>
                    <div style={{textAlign:'right' as const,flexShrink:0}}>
                      <div style={{fontSize:17,fontWeight:700,color:A}}>{fmtPrice(s.price_cents)}</div>
                      <div style={{fontSize:10,color:'#ccc',marginTop:1}}>Réserver →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Infos */}
      <div style={{borderTop:'1px solid #f0f0f0'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:300}}>
          <div style={{background:'#f5f5f5',overflow:'hidden',minHeight:300}}>
            {salon.google_maps_embed
              ? <iframe src={salon.google_maps_embed} style={{width:'100%',height:'100%',minHeight:300,border:'none',display:'block'}} allowFullScreen loading="lazy" />
              : <div style={{width:'100%',height:'100%',minHeight:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#ccc',gap:8}}>
                  <div style={{fontSize:32}}>📍</div>
                  {salon.address&&<div style={{fontSize:13}}>{salon.address}, {salon.city}</div>}
                </div>
            }
          </div>
          <div style={{padding:'32px 28px',display:'flex',flexDirection:'column',justifyContent:'center',gap:12,background:'#fafafa'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700}}>{salon.name}</h3>
            {[
              salon.address&&{ic:'📍',v:`${salon.address}, ${salon.city}`},
              salon.phone&&{ic:'📞',v:salon.phone,href:`tel:${salon.phone}`},
              salon.email&&{ic:'✉',v:salon.email,href:`mailto:${salon.email}`},
              salon.instagram&&{ic:'📸',v:salon.instagram},
            ].filter(Boolean).map((r:any,i)=>(
              <div key={i} style={{display:'flex',gap:8,fontSize:13,color:'#555'}}>
                <span>{r.ic}</span>
                {r.href?<a href={r.href} style={{color:'#555'}}>{r.v}</a>:<span>{r.v}</span>}
              </div>
            ))}
            <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'11px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',marginTop:4,width:'fit-content'}}>
              Réserver en ligne →
            </button>
          </div>
        </div>
      </div>

      {/* Avis */}
      {reviews.length>0&&(
        <div style={{background:'#fafafa',borderTop:'1px solid #f0f0f0',padding:'48px 24px'}}>
          <div style={{maxWidth:960,margin:'0 auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20,flexWrap:'wrap' as const,gap:12}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700}}>Avis clients</h2>
              {salon.google_link&&<a href={salon.google_link} target="_blank" rel="noopener" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'#fff',border:'1px solid #f0f0f0',borderRadius:9,fontSize:12,fontWeight:500}}>⭐ Laisser un avis →</a>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
              {reviews.map(r=>(
                <div key={r.id} className="rev-card" style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:12,padding:'16px',transition:'all .2s',cursor:'default'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{(r.client as any)?.name||'Client'}</div>
                      {(r.employee as any)?.name&&<div style={{fontSize:10,color:'#bbb'}}>avec {(r.employee as any).name}</div>}
                    </div>
                    <span style={{fontSize:10,color:'#bbb'}}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <Stars n={r.rating} size={12}/>
                  {r.comment&&<p style={{fontSize:12,color:'#666',lineHeight:1.6,marginTop:8}}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{background:T,padding:'44px 24px',textAlign:'center' as const}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,color:'#fff',marginBottom:10}}>Prêt(e) à réserver ?</h2>
        <p style={{fontSize:14,color:'rgba(255,255,255,.6)',marginBottom:22}}>Disponible 24h/24 · Confirmation SMS immédiate</p>
        <button onClick={()=>setView('booking')} style={{background:'#fff',color:T,border:'none',borderRadius:11,padding:'14px 32px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
          Choisir mon créneau →
        </button>
      </div>

      {/* Footer */}
      <footer style={{background:'#fafafa',borderTop:'1px solid #f0f0f0',padding:'32px 24px 20px'}}>
        <div style={{maxWidth:960,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap' as const,gap:20}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700,marginBottom:8}}>✂ {salon.name}</div>
            <div style={{fontSize:12,color:'#888',lineHeight:2}}>
              {salon.address&&<div>{salon.address}, {salon.city}</div>}
              {salon.phone&&<a href={`tel:${salon.phone}`} style={{display:'block',color:'#888'}}>{salon.phone}</a>}
              {salon.email&&<a href={`mailto:${salon.email}`} style={{display:'block',color:'#888'}}>{salon.email}</a>}
            </div>
          </div>
          <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'11px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit',alignSelf:'center'}}>
            Prendre RDV en ligne →
          </button>
        </div>
        <div style={{maxWidth:960,margin:'16px auto 0',paddingTop:14,borderTop:'1px solid #f0f0f0',display:'flex',justifyContent:'space-between',fontSize:11,color:'#bbb',flexWrap:'wrap' as const,gap:4}}>
          <span>© {new Date().getFullYear()} {salon.name} — Propulsé par <strong>CoiffPro</strong></span>
        </div>
      </footer>
    </div>
  )
}
