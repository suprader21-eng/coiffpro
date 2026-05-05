'use client'
import { useState, useEffect, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
type Salon = { id:string; name:string; slug:string; email:string; phone:string; address:string; city:string; description:string; instagram:string; google_link:string; google_maps_embed:string; primary_color:string; accent_color:string; status:string; plan_price:number; trial_ends_at:string; sumup_merchant_code:string; sumup_access_token:string }
type Employee = { id:string; name:string; role:string; color:string; is_active:boolean }
type Service = { id:string; name:string; category:string; duration_minutes:number; price_cents:number; is_active:boolean }
type Client = { id:string; name:string; phone:string; email:string; visit_count:number; total_spent_cents:number; loyalty_points:number; gift_available:boolean; last_visit_at:string; notes:string }
type Appointment = { id:string; scheduled_at:string; status:string; price_cents:number; final_price_cents:number; paid:boolean; payment_method:string; client:Client|null; service:Service|null; employee:Employee|null }

/* ─── Helpers ─── */
const ini = (n:string) => n?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?'
const fmt = (c:number) => ((c||0)/100).toFixed(0)+'€'
const fmtDur = (m:number) => m<60?`${m}min`:`${Math.floor(m/60)}h${m%60?m%60+'min':''}`

function SC({label,value,sub,up=false}:{label:string;value:any;sub?:string;up?:boolean}) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{sub&&<div className={`stat-sub${up?' up':''}`}>{sub}</div>}</div>
}
function Card({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties}) {
  return <div className="card" style={style}>{children}</div>
}
function CardHd({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}) {
  return <div className="card-hd"><span className="card-ttl">{title}</span>{action&&<span className="card-lnk" onClick={onAction}>{action}</span>}</div>
}
function Btn({children,ghost=false,danger=false,onClick,style={},disabled=false}:{children:React.ReactNode;ghost?:boolean;danger?:boolean;onClick?:()=>void;style?:React.CSSProperties;disabled?:boolean}) {
  return <button disabled={disabled} onClick={onClick} className={danger?'btn-danger':ghost?'btn-g':'btn-p'} style={{opacity:disabled?.5:1,...style}}>{children}</button>
}
function Inp({placeholder,type='text',value,onChange,style={}}:{placeholder?:string;type?:string;value?:string;onChange?:(v:string)=>void;style?:React.CSSProperties}) {
  return <input type={type} placeholder={placeholder} value={value||''} onChange={e=>onChange?.(e.target.value)} className="input" style={style} />
}
function Tgl({on,onChange}:{on:boolean;onChange?:(v:boolean)=>void}) {
  return <div className={`tgl${on?' on':''}`} onClick={()=>onChange?.(!on)} />
}
function FRow({label,children}:{label:string;children:React.ReactNode}) {
  return <div style={{marginBottom:10}}><label style={{fontSize:10,color:'var(--t2)',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:4}}>{label}</label>{children}</div>
}
function Bge({status}:{status:string}) {
  const m:{[k:string]:{l:string;c:string}}={confirmed:{l:'Confirmé',c:'badge-ok'},pending:{l:'En attente',c:'badge-wait'},completed:{l:'Terminé',c:'badge-done'},cancelled:{l:'Annulé',c:'badge-done'},no_show:{l:'Absent',c:'badge-wait'}}
  const s=m[status]||m.pending
  return <span className={`badge ${s.c}`}>{s.l}</span>
}

/* ─── NAV ─── */
const NAV_GROUPS = [
  { label:'PRINCIPAL', items:[
    {id:'dashboard',label:'Tableau de bord',icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'},
    {id:'agenda',label:'Agenda',icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z'},
  ]},
  { label:'CLIENTS', items:[
    {id:'clients',label:'Clients (CRM)',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'},
    {id:'fidelite',label:'Fidélité & Remises',icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'},
    {id:'marketing',label:'Campagnes SMS',icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'},
  ]},
  { label:'SALON', items:[
    {id:'equipe',label:'Équipe',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87'},
    {id:'services',label:'Services & Tarifs',icon:'M4 6h16M4 10h16M4 14h16M4 18h16'},
    {id:'paiements',label:'Paiements SumUp',icon:'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0-2-2z M1 10h22'},
    {id:'avis',label:'Avis Google',icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'},
    {id:'rappels',label:'Rappels auto',icon:'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z'},
  ]},
  { label:'MON SALON', items:[
    {id:'ma-page',label:'Ma page client',icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'},
    {id:'parametres',label:'Paramètres',icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33'},
  ]},
]

const PAGE_TITLES:Record<string,string> = {
  dashboard:'Tableau de bord',agenda:'Agenda',clients:'Clients & CRM',fidelite:'Fidélité & Remises',
  marketing:'Campagnes SMS',equipe:'Équipe',services:'Services & Tarifs',paiements:'Paiements SumUp',
  avis:'Avis Google',rappels:'Rappels automatiques','ma-page':'Ma page client',parametres:'Paramètres',
}

const MOBILE_NAV = [
  {id:'dashboard',label:'Accueil',icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'},
  {id:'agenda',label:'Agenda',icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z'},
  {id:'clients',label:'Clients',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'},
  {id:'ma-page',label:'Ma page',icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'},
  {id:'parametres',label:'Réglages',icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83'},
]

/* ══════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter()
  const sb = getBrowserClient()

  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [salon, setSalon] = useState<Salon|null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState('light')

  const addToast = useCallback((msg:string) => {
    setToast(msg)
    setTimeout(()=>setToast(''),3000)
  }, [])

  const nav = (p:string) => { setPage(p); setSidebarOpen(false) }

  // Load data
  useEffect(()=>{
    async function load() {
      // getSession() lit localStorage sans appel réseau - plus fiable que getUser()
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.user) { router.push('/login'); return }

      const userEmail = session.user.email
      const { data: salonData, error: salonErr } = await sb.from('salons').select('*').eq('email', userEmail).single()
      
      if (salonErr || !salonData) {
        console.error('Salon not found for email:', userEmail, salonErr)
        // Attendre 1s et réessayer une fois (session parfois en cours d'initialisation)
        await new Promise(r => setTimeout(r, 1000))
        const { data: retry } = await sb.from('salons').select('*').eq('email', userEmail).single()
        if (!retry) { router.push('/login'); return }
        setSalon(retry)
      } else {
        setSalon(salonData)
      }
      setSalon(salonData)

      const [emps, svcs, cls, appts] = await Promise.all([
        sb.from('employees').select('*').eq('salon_id', salonData.id).order('sort_order'),
        sb.from('services').select('*').eq('salon_id', salonData.id).order('sort_order'),
        sb.from('clients').select('*').eq('salon_id', salonData.id).order('created_at', {ascending:false}),
        sb.from('appointments').select('*, client:clients(name,phone), service:services(name,price_cents), employee:employees(name,color)')
          .eq('salon_id', salonData.id).order('scheduled_at', {ascending:false}).limit(50)
      ])
      setEmployees(emps.data || [])
      setServices(svcs.data || [])
      setClients(cls.data || [])
      setAppointments(appts.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const todayAppts = appointments.filter(a => {
    const d = new Date(a.scheduled_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const caToday = todayAppts.filter(a=>a.paid).reduce((s,a)=>s+a.price_cents,0)
  const unpaid = todayAppts.filter(a=>!a.paid&&a.status==='confirmed')
  const gifts = clients.filter(c=>c.gift_available).length

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",background:'#fafafa'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>✂</div>
        <div style={{fontSize:14,color:'#888'}}>Chargement de votre espace…</div>
      </div>
    </div>
  )

  /* ── PAGE RENDERERS ── */

  function PageDashboard() {
    return <>
      <div className="stat-grid">
        <SC label="RDV aujourd'hui" value={todayAppts.length} sub={`${unpaid.length} non encaissés`} />
        <SC label="CA du jour" value={fmt(caToday)} sub="encaissé" up />
        <SC label="Total clients" value={clients.length} sub="dans votre CRM" up />
        <SC label="Cadeaux fidélité" value={gifts} sub="à remettre" up={gifts>0} />
      </div>

      {unpaid.length>0&&<div onClick={()=>nav('agenda')} style={{background:'#fdf6e6',border:'1px solid #eed898',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
        <span>💰</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--gold)'}}>{unpaid.length} RDV non encaissés</div><div style={{fontSize:11,color:'var(--gold)',opacity:.7}}>Voir dans l'agenda →</div></div>
      </div>}

      {gifts>0&&<div onClick={()=>nav('fidelite')} style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
        <span>🎁</span><div style={{fontSize:13,fontWeight:600,color:'var(--green)'}}>{gifts} client{gifts>1?'s':''} — produit offert à remettre !</div>
      </div>}

      <div className="g2">
        <Card>
          <CardHd title={`RDV du jour (${todayAppts.length})`} action="Agenda →" onAction={()=>nav('agenda')} />
          {todayAppts.length===0 ? (
            <div style={{textAlign:'center',padding:'20px 0',fontSize:13,color:'var(--t3)'}}>Aucun RDV aujourd'hui</div>
          ) : todayAppts.map(a=>(
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--b1)'}}>
              <span style={{fontSize:11,color:'var(--t2)',width:38,fontWeight:500}}>
                {new Date(a.scheduled_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
              </span>
              <div style={{width:26,height:26,borderRadius:'50%',background:'#c8a96e22',color:'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>
                {ini(a.client?.name||'?')}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.client?.name||'Client'}</div>
                <div style={{fontSize:10,color:'var(--t3)'}}>{a.service?.name||'Prestation'}</div>
              </div>
              <Bge status={a.status} />
            </div>
          ))}
          <div style={{marginTop:10}}>
            <Btn onClick={()=>nav('agenda')} style={{width:'100%'}}>+ Nouveau RDV</Btn>
          </div>
        </Card>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Votre page publique" />
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>Lien de réservation client</div>
              <div style={{fontSize:12,fontWeight:600,wordBreak:'break-all' as const}}>
                {process.env.NEXT_PUBLIC_APP_URL || 'coiffpro.fr'}/book/{salon?.slug}
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn ghost onClick={()=>{navigator.clipboard?.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/book/${salon?.slug}`).catch(()=>{});addToast('📋 Lien copié !')}}>Copier</Btn>
              <Btn onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ma page ↗</Btn>
              <Btn ghost onClick={()=>nav('ma-page')}>✏ Modifier</Btn>
            </div>
          </Card>

          <Card>
            <CardHd title="Abonnement" />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
              <span style={{color:'var(--t2)'}}>Plan</span><span style={{fontWeight:600}}>CoiffPro Pro</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
              <span style={{color:'var(--t2)'}}>Statut</span>
              <span className="badge badge-ok">{salon?.status==='trial'?'Essai gratuit':'Actif'}</span>
            </div>
            {salon?.status==='trial'&&<div style={{fontSize:12,color:'var(--t3)',marginTop:6}}>
              Essai jusqu'au {new Date(salon.trial_ends_at).toLocaleDateString('fr-FR')}
            </div>}
          </Card>
        </div>
      </div>
    </>
  }

  function PageAgenda() {
    const [modal, setModal] = useState(false)
    const [appts, setAppts] = useState(todayAppts)
    return <>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:12}}>
        <Btn ghost onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ma page ↗</Btn>
        <Btn onClick={()=>setModal(true)}>+ Nouveau RDV</Btn>
      </div>
      <Card>
        <CardHd title={`Aujourd'hui — ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}`} />
        {appts.length===0 ? (
          <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:14}}>
            <div style={{fontSize:32,marginBottom:8}}>📅</div>
            Aucun RDV aujourd'hui.<br/>
            <span onClick={()=>setModal(true)} style={{color:'var(--t1)',fontWeight:600,cursor:'pointer',textDecoration:'underline'}}>Ajouter un RDV manuellement</span>
          </div>
        ) : appts.map(a=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
            <span style={{fontSize:11,color:'var(--t2)',width:38,fontWeight:500,flexShrink:0}}>
              {new Date(a.scheduled_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
            </span>
            <div style={{width:28,height:28,borderRadius:'50%',background:'#c8a96e22',color:'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>
              {ini(a.client?.name||'?')}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:500}}>{a.client?.name||'Client'}</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>{a.service?.name||'Prestation'} · {a.employee?.name||''}</div>
            </div>
            <span style={{fontSize:12,fontWeight:700}}>{fmt(a.final_price_cents||a.price_cents)}</span>
            {a.paid ? <span className="badge badge-ok">Payé ✓</span> : <Btn onClick={()=>addToast('💰 Modal paiement — voir onglet Paiements')} style={{fontSize:9,padding:'3px 8px',background:'var(--green)'}}>💰 Encaisser</Btn>}
            <Bge status={a.status} />
          </div>
        ))}
      </Card>
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau rendez-vous</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FRow label="Client"><Inp placeholder="Nom du client" /></FRow>
          <FRow label="Téléphone"><Inp placeholder="06 12 34 56 78" type="tel" /></FRow>
          <FRow label="Prestation">
            <select className="input">
              <option>Sélectionner…</option>
              {services.map(s=><option key={s.id}>{s.name}</option>)}
            </select>
          </FRow>
          <FRow label="Collaborateur">
            <select className="input">
              <option>Sélectionner…</option>
              {employees.filter(e=>e.is_active).map(e=><option key={e.id}>{e.name}</option>)}
            </select>
          </FRow>
          <FRow label="Date"><input type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} /></FRow>
          <FRow label="Heure"><input type="time" className="input" defaultValue="10:00" /></FRow>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={()=>{setModal(false);addToast('📅 RDV enregistré ! SMS de confirmation envoyé.')}}>Enregistrer</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageClients() {
    const [search, setSearch] = useState('')
    const [sel, setSel] = useState<Client|null>(null)
    const filtered = clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search))

    if (sel) return <>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <Btn ghost onClick={()=>setSel(null)}>← Retour</Btn>
        <div style={{fontWeight:600,fontSize:15}}>{sel.name}</div>
        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
          <Btn ghost onClick={()=>addToast(`📲 SMS envoyé à ${sel.name}`)}>SMS</Btn>
          <Btn ghost danger onClick={()=>addToast('✅ Archivé (RGPD)')}>Archiver</Btn>
        </div>
      </div>
      <div className="g2">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Informations" />
            {[['Téléphone',sel.phone||'-'],['Email',sel.email||'-'],['Visites',sel.visit_count],['CA total',fmt(sel.total_spent_cents)]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
                <span style={{color:'var(--t2)'}}>{l}</span><span style={{fontWeight:500}}>{String(v)}</span>
              </div>
            ))}
          </Card>
          <Card>
            <CardHd title="Fidélité" />
            <div style={{display:'flex',gap:4,flexWrap:'wrap' as const,marginBottom:8}}>
              {Array.from({length:10},(_,i)=>(
                <div key={i} style={{width:19,height:19,borderRadius:'50%',border:`1.5px solid ${i<(sel.loyalty_points||0)?'var(--gold)':'var(--b2)'}`,background:i<(sel.loyalty_points||0)?'var(--gold)':'transparent'}} />
              ))}
            </div>
            <div style={{fontSize:12,color:sel.gift_available?'var(--green)':'var(--t2)'}}>
              {sel.gift_available?'🎁 Cadeau disponible !':`${Math.max(0,10-(sel.loyalty_points||0))} visite${10-(sel.loyalty_points||0)>1?'s':''} pour un cadeau`}
            </div>
          </Card>
        </div>
        <Card>
          <CardHd title="Notes internes" />
          <textarea defaultValue={sel.notes||''} className="input" style={{height:100,resize:'none' as const,lineHeight:1.5}} />
          <Btn onClick={()=>addToast('✅ Note sauvegardée')} style={{marginTop:8,width:'100%'}}>Sauvegarder</Btn>
        </Card>
      </div>
    </>

    return <>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <Inp placeholder="Rechercher un client…" value={search} onChange={setSearch} style={{maxWidth:260}} />
        <Btn onClick={()=>addToast('+ Nouveau client')} style={{marginLeft:'auto'}}>+ Ajouter</Btn>
      </div>
      <Card>
        {clients.length===0 ? (
          <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}>
            <div style={{fontSize:32,marginBottom:8}}>👥</div>
            Vos clients apparaîtront ici après leur première réservation.
          </div>
        ) : (
        <div style={{overflowX:'auto' as const}}>
          <table className="table">
            <thead><tr><th>Client</th><th>Téléphone</th><th>Visites</th><th className="mob-hide">CA total</th><th className="mob-hide">Fidélité</th></tr></thead>
            <tbody>{filtered.map(c=>(
              <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSel(c)}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:26,height:26,borderRadius:'50%',background:'#c8a96e22',color:'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>{ini(c.name)}</div>
                  <span style={{fontWeight:500}}>{c.name}{c.gift_available&&<span style={{display:'inline-flex',background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:5,padding:'1px 5px',fontSize:9,color:'var(--green)',fontWeight:600,marginLeft:5}}>🎁</span>}</span>
                </div></td>
                <td style={{color:'var(--t2)'}}>{c.phone}</td>
                <td style={{fontWeight:600}}>{c.visit_count}</td>
                <td className="mob-hide" style={{fontWeight:600}}>{fmt(c.total_spent_cents)}</td>
                <td className="mob-hide">
                  <div style={{display:'flex',gap:3}}>
                    {Array.from({length:10},(_,i)=>(
                      <div key={i} style={{width:9,height:9,borderRadius:'50%',background:i<(c.loyalty_points||0)?'var(--gold)':'var(--b1)'}} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        )}
      </Card>
    </>
  }

  function PageEquipe() {
    const [modal, setModal] = useState(false)
    return <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <Btn onClick={()=>setModal(true)}>+ Ajouter un collaborateur</Btn>
      </div>
      {employees.length===0 ? (
        <Card><div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}>
          <div style={{fontSize:32,marginBottom:8}}>👥</div>
          Ajoutez vos collaborateurs pour qu'ils apparaissent sur votre page client.
        </div></Card>
      ) : (
      <div className="g2">
        {employees.map(e=>(
          <Card key={e.id}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:(e.color||'#c8a96e')+'22',color:e.color||'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>{ini(e.name)}</div>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{e.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{e.role}</div></div>
              <Tgl on={e.is_active} onChange={()=>addToast('✅ Statut mis à jour')} />
            </div>
            <Btn ghost style={{width:'100%'}} onClick={()=>addToast('✏ Modifier le collaborateur')}>Modifier</Btn>
          </Card>
        ))}
      </div>
      )}
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau collaborateur</div>
        <FRow label="Nom complet"><Inp placeholder="Prénom Nom" /></FRow>
        <FRow label="Rôle / Spécialité"><Inp placeholder="Coiffeur(se), Barbier…" /></FRow>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={()=>{setModal(false);addToast('✅ Collaborateur ajouté !')}}>Ajouter</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageServices() {
    const [modal, setModal] = useState(false)
    return <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <Btn onClick={()=>setModal(true)}>+ Ajouter un service</Btn>
      </div>
      <Card>
        {services.length===0 ? (
          <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}>
            <div style={{fontSize:32,marginBottom:8}}>✂</div>Ajoutez vos prestations.
          </div>
        ) : (
        <table className="table">
          <thead><tr><th>Prestation</th><th>Catégorie</th><th>Durée</th><th>Prix</th><th>Actif</th><th></th></tr></thead>
          <tbody>{services.map(s=>(
            <tr key={s.id}>
              <td style={{fontWeight:500}}>{s.name}</td>
              <td style={{color:'var(--t2)'}}>{s.category}</td>
              <td style={{color:'var(--t2)'}}>{fmtDur(s.duration_minutes)}</td>
              <td style={{fontWeight:700}}>{fmt(s.price_cents)}</td>
              <td><Tgl on={s.is_active} onChange={()=>addToast('✅ Statut mis à jour')} /></td>
              <td><Btn ghost onClick={()=>addToast(`✏ Modifier ${s.name}`)}>✏</Btn></td>
            </tr>
          ))}</tbody>
        </table>
        )}
      </Card>
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau service</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FRow label="Nom"><Inp placeholder="Ex: Coupe Homme" /></FRow>
          <FRow label="Catégorie">
            <select className="input"><option>Coupes</option><option>Barbier</option><option>Couleurs</option><option>Soins</option></select>
          </FRow>
          <FRow label="Durée (min)"><Inp type="number" placeholder="30" /></FRow>
          <FRow label="Prix (€)"><Inp type="number" placeholder="20" /></FRow>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={()=>{setModal(false);addToast('✅ Service ajouté !')}}>Ajouter</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageMaPage() {
    const [f, setF] = useState({
      name: salon?.name||'', tagline:'', description: salon?.description||'',
      address: salon?.address||'', city: salon?.city||'', phone: salon?.phone||'',
      instagram: salon?.instagram||'', google_link: salon?.google_link||'',
      google_maps_embed: salon?.google_maps_embed||'',
      primary_color: salon?.primary_color||'#1a1a1a',
      accent_color: salon?.accent_color||'#c8a96e',
    })
    const up = (k:keyof typeof f, v:string) => setF(p=>({...p,[k]:v}))
    const [saving, setSaving] = useState(false)

    const save = async () => {
      setSaving(true)
      const sb2 = getBrowserClient()
      await sb2.from('salons').update({
        name: f.name, description: f.description, address: f.address,
        city: f.city, phone: f.phone, instagram: f.instagram,
        google_link: f.google_link, google_maps_embed: f.google_maps_embed,
        primary_color: f.primary_color, accent_color: f.accent_color,
      }).eq('id', salon?.id)
      setSaving(false)
      addToast('✅ Page mise à jour ! Visible sur coiffpro.fr/book/'+salon?.slug)
    }

    return <>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:12}}>
        <Btn ghost onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ma page ↗</Btn>
        <Btn onClick={save} disabled={saving}>{saving?'Sauvegarde…':'✅ Sauvegarder les modifications'}</Btn>
      </div>

      <div className="g2">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Informations affichées" />
            <FRow label="Nom du salon"><Inp value={f.name} onChange={v=>up('name',v)} placeholder="Mon Salon" /></FRow>
            <FRow label="Description (affichée sur votre page)">
              <textarea value={f.description} onChange={e=>up('description',e.target.value)} className="input" style={{height:80,resize:'none' as const,lineHeight:1.5}} placeholder="Présentez votre salon…" />
            </FRow>
            <FRow label="Adresse"><Inp value={f.address} onChange={v=>up('address',v)} placeholder="12 rue Foch" /></FRow>
            <FRow label="Ville"><Inp value={f.city} onChange={v=>up('city',v)} placeholder="Montpellier" /></FRow>
            <FRow label="Téléphone"><Inp value={f.phone} onChange={v=>up('phone',v)} placeholder="04 67 00 00 00" /></FRow>
            <FRow label="Instagram"><Inp value={f.instagram} onChange={v=>up('instagram',v)} placeholder="@monsalon" /></FRow>
            <FRow label="Lien Google Avis"><Inp value={f.google_link} onChange={v=>up('google_link',v)} placeholder="https://g.page/..." /></FRow>
          </Card>
          <Card>
            <CardHd title="Carte Google Maps" />
            <div style={{fontSize:12,color:'var(--t3)',marginBottom:8}}>
              Google Maps → Partager → Intégrer → copier le <strong>src</strong> de l'iframe
            </div>
            <textarea value={f.google_maps_embed} onChange={e=>up('google_maps_embed',e.target.value)}
              className="input" style={{height:60,resize:'none' as const,fontSize:11,lineHeight:1.4}}
              placeholder="https://www.google.com/maps/embed?pb=..." />
            {f.google_maps_embed && (
              <div style={{marginTop:8,borderRadius:8,overflow:'hidden',height:160}}>
                <iframe src={f.google_maps_embed} style={{width:'100%',height:'100%',border:'none'}} loading="lazy" />
              </div>
            )}
          </Card>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Couleurs & branding" />
            <FRow label="Couleur principale">
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="color" value={f.primary_color} onChange={e=>up('primary_color',e.target.value)} style={{width:36,height:36,border:'1px solid var(--b1)',borderRadius:8,cursor:'pointer',padding:2}} />
                <Inp value={f.primary_color} onChange={v=>up('primary_color',v)} />
              </div>
            </FRow>
            <FRow label="Couleur accent (boutons, prix)">
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="color" value={f.accent_color} onChange={e=>up('accent_color',e.target.value)} style={{width:36,height:36,border:'1px solid var(--b1)',borderRadius:8,cursor:'pointer',padding:2}} />
                <Inp value={f.accent_color} onChange={v=>up('accent_color',v)} />
              </div>
            </FRow>
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:12,marginTop:8}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>Aperçu</div>
              <button style={{background:f.primary_color,color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:600,width:'100%',marginBottom:6}}>Réserver en ligne →</button>
              <div style={{color:f.accent_color,fontSize:14}}>★★★★★ <span style={{fontSize:12,color:'var(--t1)'}}>4.9</span></div>
            </div>
          </Card>
          <Card>
            <CardHd title="Votre lien de réservation" />
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:'10px 12px',marginBottom:12}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>À partager sur Instagram, WhatsApp, carte de visite…</div>
              <div style={{fontSize:13,fontWeight:600,wordBreak:'break-all' as const}}>
                {typeof window!=='undefined'?window.location.origin:''}/book/{salon?.slug}
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn ghost onClick={()=>{navigator.clipboard?.writeText(`${typeof window!=='undefined'?window.location.origin:''}/book/${salon?.slug}`).catch(()=>{});addToast('📋 Lien copié !')}}>Copier</Btn>
              <Btn onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir la page ↗</Btn>
            </div>
          </Card>
          <Card>
            <CardHd title="Photos du salon" />
            <div style={{fontSize:12,color:'var(--t3)',marginBottom:10}}>Ajoutez des photos de votre salon par URL</div>
            <div style={{display:'flex',gap:6}}>
              <input id="photo-url" placeholder="https://…" className="input" style={{flex:1}} />
              <Btn onClick={()=>addToast('📸 Photo ajoutée !')}>+</Btn>
            </div>
            <div style={{fontSize:11,color:'var(--t3)',marginTop:6}}>Les photos s'affichent sur votre page de réservation</div>
          </Card>
        </div>
      </div>
    </>
  }

  function PageParametres() {
    const [f, setF] = useState({
      name: salon?.name||'', email: salon?.email||'', phone: salon?.phone||''
    })
    const [saving, setSaving] = useState(false)
    const logout = async () => {
      await getBrowserClient().auth.signOut()
      router.push('/login')
    }
    return <>
      <div className="g2">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Informations du compte" />
            <FRow label="Nom du salon"><Inp value={f.name} onChange={v=>setF(p=>({...p,name:v}))} /></FRow>
            <FRow label="Email"><Inp value={f.email} onChange={v=>setF(p=>({...p,email:v}))} type="email" /></FRow>
            <FRow label="Téléphone"><Inp value={f.phone} onChange={v=>setF(p=>({...p,phone:v}))} /></FRow>
            <Btn onClick={()=>addToast('✅ Informations sauvegardées')} style={{marginTop:4}}>Sauvegarder</Btn>
          </Card>
          <Card>
            <CardHd title="Abonnement" />
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Plan</span><span style={{fontWeight:600}}>CoiffPro Pro</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Tarif</span><span style={{fontWeight:700}}>50€/mois</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--t2)'}}>Statut</span><span className="badge badge-ok">{salon?.status==='trial'?'Essai gratuit':'Actif'}</span></div>
              {salon?.status==='trial'&&<div style={{fontSize:11,color:'var(--t3)',marginTop:6}}>Essai jusqu'au {new Date(salon.trial_ends_at||'').toLocaleDateString('fr-FR')}</div>}
            </div>
            <Btn onClick={()=>addToast('💳 Portail Stripe ouvert')}>Gérer mon abonnement →</Btn>
          </Card>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Connexion SumUp" />
            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>SumUp — Paiements clients</div>
              <div style={{fontSize:12,color:'#555',lineHeight:1.6,marginBottom:12}}>
                Connectez votre compte SumUp pour encaisser directement depuis l'agenda. L'argent va sur votre compte SumUp.
              </div>
              {salon?.sumup_merchant_code ? (
                <div style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:8,padding:'8px 12px',fontSize:12,color:'var(--green)'}}>
                  ✅ SumUp connecté — Merchant: {salon.sumup_merchant_code}
                </div>
              ) : (
                <a href={`/api/sumup/connect?salonId=${salon?.id}`} style={{display:'block',background:'#1a4fa0',color:'#fff',borderRadius:8,padding:'10px',textAlign:'center' as const,fontSize:13,fontWeight:600}}>
                  🔵 Connecter mon compte SumUp →
                </a>
              )}
            </div>
          </Card>
          <Card>
            <CardHd title="Danger zone" />
            <Btn ghost danger onClick={logout} style={{width:'100%'}}>Se déconnecter</Btn>
          </Card>
        </div>
      </div>
    </>
  }

  function PageFidelite() {
    return <>
      <div className="g2" style={{marginBottom:12}}>
        <SC label="Clients fidèles ≥7/10" value={clients.filter(c=>(c.loyalty_points||0)>=7).length} />
        <SC label="Cadeaux disponibles" value={gifts} sub="à remettre" up={gifts>0} />
      </div>
      <Card>
        <CardHd title="Programme fidélité — 10 visites = 1 cadeau" />
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b1)'}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Activer le programme</div><div style={{fontSize:11,color:'var(--t3)'}}>SMS automatique à la 10ème visite</div></div>
          <Tgl on={true} onChange={()=>addToast('✅ Programme mis à jour')} />
        </div>
        {clients.filter(c=>(c.loyalty_points||0)>=10).length>0&&<>
          <div style={{fontSize:11,fontWeight:600,color:'var(--t2)',marginTop:12,marginBottom:8}}>CLIENTS À RÉCOMPENSER</div>
          {clients.filter(c=>c.gift_available).map(c=>(
            <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--b1)'}}>
              <span style={{flex:1,fontSize:12,fontWeight:500}}>{c.name}</span>
              <span style={{fontSize:10,color:'var(--green)',fontWeight:600}}>🎁 10ème visite</span>
              <Btn ghost onClick={()=>addToast(`📲 SMS cadeau envoyé à ${c.name}`)}>SMS →</Btn>
            </div>
          ))}
        </>}
      </Card>
    </>
  }

  function PageRappels() {
    const items = [
      {l:'SMS 24h avant le RDV',d:'Votre nom affiché comme expéditeur',on:true},
      {l:'Confirmation immédiate',d:'Envoyé dès la réservation en ligne',on:true},
      {l:'Lien avis Google post-RDV',d:'2h après chaque RDV terminé',on:true},
      {l:'SMS fidélité 10ème visite',d:'🎁 Produit offert automatique',on:true},
      {l:'Relance clients inactifs 30j',d:'Vous nous manquez !',on:false},
    ]
    return <Card style={{maxWidth:540}}>
      <CardHd title="Automatisations SMS" />
      {items.map((it,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--b1)'}}>
          <div><div style={{fontSize:13,fontWeight:500}}>{it.l}</div><div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{it.d}</div></div>
          <Tgl on={it.on} onChange={()=>addToast('✅ Automatisation mise à jour')} />
        </div>
      ))}
    </Card>
  }

  function PageAvis() {
    return <div className="g2">
      <Card>
        <CardHd title="Message post-RDV automatique" />
        <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:8,padding:12,fontSize:12,color:'var(--green)',lineHeight:1.7,marginBottom:12}}>
          "Merci pour votre visite chez {salon?.name} 🙏<br/>Laissez-nous un avis : {salon?.google_link||'g.page/votre-salon'}"
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:11,color:'var(--t2)'}}>Envoi automatique 2h après RDV terminé</span>
          <Tgl on={true} />
        </div>
      </Card>
      <Card>
        <CardHd title="Lien Google My Business" />
        <FRow label="URL de votre page Google">
          <Inp value={salon?.google_link||''} onChange={()=>{}} placeholder="https://g.page/..." />
        </FRow>
        <Btn onClick={()=>addToast('✅ Lien sauvegardé')}>Sauvegarder</Btn>
        {salon?.google_link&&<a href={salon.google_link} target="_blank" rel="noopener" style={{display:'block',marginTop:8,fontSize:12,color:'var(--t2)',textDecoration:'underline'}}>Voir ma page Google →</a>}
      </Card>
    </div>
  }

  function PageMarketing() {
    return <>
      <div className="g3" style={{marginBottom:12}}>
        <SC label="Clients SMS" value={clients.length} sub="actifs" />
        <SC label="SMS ce mois" value="0" sub="automatiques" />
        <SC label="Taux ouverture" value="91%" sub="SMS France" />
      </div>
      <Card>
        <CardHd title="Campagnes SMS" action="+ Nouvelle campagne" onAction={()=>addToast('📨 Ouvrir le créateur de campagne')} />
        <div style={{textAlign:'center',padding:'24px 0',color:'var(--t3)',fontSize:13}}>
          <div style={{fontSize:32,marginBottom:8}}>📨</div>
          Vos campagnes SMS apparaîtront ici.<br/>
          Ciblez vos clients inactifs, les proches de la fidélité, etc.
        </div>
      </Card>
    </>
  }

  function PagePaiements() {
    return <>
      <div className="g2" style={{marginBottom:12}}>
        <Card>
          <CardHd title="Connexion SumUp" />
          {salon?.sumup_merchant_code ? (
            <div style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:14}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:4}}>✅ SumUp connecté</div>
              <div style={{fontSize:11,color:'var(--t3)'}}>Merchant: {salon.sumup_merchant_code}</div>
              <div style={{fontSize:12,color:'#555',marginTop:8,lineHeight:1.6}}>Les paiements vont directement sur votre compte SumUp.</div>
            </div>
          ) : (
            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Connecter votre compte SumUp</div>
              <div style={{fontSize:12,color:'#555',lineHeight:1.6,marginBottom:12}}>L'argent va directement sur votre compte SumUp — CoiffPro ne touche rien.</div>
              <a href={`/api/sumup/connect?salonId=${salon?.id}`} style={{display:'block',background:'#1a4fa0',color:'#fff',borderRadius:8,padding:'10px',textAlign:'center' as const,fontSize:13,fontWeight:600,textDecoration:'none'}}>
                🔵 Connecter mon compte SumUp →
              </a>
            </div>
          )}
        </Card>
        <Card>
          <CardHd title="CA ce mois" />
          <div style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,marginBottom:4}}>
            {fmt(appointments.filter(a=>a.paid&&new Date(a.scheduled_at).getMonth()===new Date().getMonth()).reduce((s,a)=>s+a.price_cents,0))}
          </div>
          <div style={{fontSize:12,color:'var(--t3)'}}>Encaissé ce mois</div>
        </Card>
      </div>
    </>
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard':  return <PageDashboard />
      case 'agenda':     return <PageAgenda />
      case 'clients':    return <PageClients />
      case 'equipe':     return <PageEquipe />
      case 'services':   return <PageServices />
      case 'fidelite':   return <PageFidelite />
      case 'marketing':  return <PageMarketing />
      case 'paiements':  return <PagePaiements />
      case 'avis':       return <PageAvis />
      case 'rappels':    return <PageRappels />
      case 'ma-page':    return <PageMaPage />
      case 'parametres': return <PageParametres />
      default: return null
    }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100dvh',fontFamily:"'Outfit',system-ui,sans-serif"}} data-theme={theme}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box}
        :root{--bg:#fff;--s1:#fafafa;--s2:#f4f4f4;--b1:#e8e8e8;--b2:#d0d0d0;--t1:#111;--t2:#666;--t3:#bbb;--gold:#b8922a;--green:#1a9648;--red:#d04040}
        [data-theme="dark"]{--bg:#080808;--s1:#0e0e0e;--s2:#161616;--b1:#1e1e1e;--b2:#2c2c2c;--t1:#f2f2f2;--t2:#888;--t3:#333;--gold:#c8a96e;--green:#3dba6f}
        body{background:var(--bg);color:var(--t1)}
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .stat-card{background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:13px}
        .stat-label{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
        .stat-value{font-size:22px;font-weight:600;line-height:1}
        .stat-sub{font-size:10px;color:var(--t3);margin-top:4px}
        .stat-sub.up{color:var(--green)}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .card{background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:14px 16px}
        .card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .card-ttl{font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.07em}
        .card-lnk{font-size:11px;color:var(--t2);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
        .btn-p{background:var(--t1);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity .12s}
        .btn-p:hover{opacity:.8}
        .btn-g{background:var(--bg);color:var(--t1);border:1px solid var(--b2);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
        .btn-danger{background:var(--bg);color:var(--red);border:1px solid var(--red);border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit}
        .input{background:var(--bg);border:1px solid var(--b2);border-radius:8px;padding:8px 11px;font-size:12px;color:var(--t1);width:100%;font-family:inherit;outline:none}
        .input:focus{border-color:var(--b2)}
        .input::placeholder{color:var(--t3)}
        textarea.input{resize:none}
        .badge{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:600}
        .badge-ok{background:#e8f7ee;color:#1a9648;border:1px solid #b8dfc6}
        .badge-wait{background:#fdf6e6;color:#b8922a;border:1px solid #eed898}
        .badge-done{background:var(--s2);color:var(--t3);border:1px solid var(--b1)}
        .tgl{width:34px;height:19px;background:var(--b2);border-radius:10px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
        .tgl.on{background:var(--t1)}
        .tgl::after{content:'';position:absolute;width:13px;height:13px;background:#fff;border-radius:50%;top:3px;left:3px;transition:left .2s}
        .tgl.on::after{left:18px}
        .table{width:100%;border-collapse:collapse}
        .table th{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding:0 8px 9px;text-align:left;border-bottom:1px solid var(--b1);font-weight:500}
        .table td{padding:9px 8px;border-bottom:1px solid var(--b1);font-size:12px;vertical-align:middle}
        .overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px}
        .modal{background:var(--bg);border:1px solid var(--b1);border-radius:14px;padding:22px;width:100%;max-width:480px;max-height:90dvh;overflow-y:auto}
        .modal-ttl{font-size:15px;font-weight:600;margin-bottom:16px}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
        @media(max-width:768px){
          .stat-grid{grid-template-columns:1fr 1fr!important}
          .g2{grid-template-columns:1fr!important}
          .g3{grid-template-columns:1fr 1fr!important}
          .mob-hide{display:none!important}
          .sidebar{position:fixed;top:48px;left:0;bottom:60px;z-index:50;transform:translateX(-100%);width:220px!important}
          .sidebar.open{transform:translateX(0);box-shadow:4px 0 20px rgba(0,0,0,.1)}
          .mob-nav{display:flex!important}
          .hamburger{display:flex!important}
          .app-layout{height:calc(100dvh - 48px - 60px)!important}
        }
        @media(min-width:769px){.mob-nav{display:none!important}.hamburger{display:none!important}}
        .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:60px;background:var(--bg);border-top:1px solid var(--b1);z-index:60;align-items:center;justify-content:space-around}
        .mob-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 12px;cursor:pointer;color:var(--t2);font-size:9px;font-weight:500;flex:1}
        .mob-btn.active{color:var(--t1)}
        .mob-btn svg{width:20px;height:20px}
      `}</style>

      {/* TOPBAR */}
      <nav style={{height:48,background:'var(--bg)',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,position:'sticky',top:0,zIndex:60}}>
        <button className="hamburger" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{display:'none',background:'none',border:'none',cursor:'pointer',padding:6,color:'var(--t1)',flexDirection:'column' as const,gap:4,alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen?<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>:<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
        <span style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700}}>✂ CoiffPro</span>
        <span style={{fontSize:11,color:'var(--t2)'}}>{salon?.name}</span>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:7,padding:'5px 9px',fontSize:11,cursor:'pointer',color:'var(--t1)'}}>
            {theme==='dark'?'☀':'🌙'}
          </button>
          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--t1)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer'}} onClick={()=>nav('parametres')}>
            {ini(salon?.name||'?')}
          </div>
        </div>
      </nav>

      <div className="app-layout" style={{display:'flex',height:'calc(100dvh - 48px)',overflow:'hidden'}}>
        {/* Overlay mobile */}
        {sidebarOpen&&<div style={{position:'fixed',top:48,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',zIndex:49}} onClick={()=>setSidebarOpen(false)} />}

        {/* SIDEBAR */}
        <aside className={`sidebar${sidebarOpen?' open':''}`} style={{width:200,background:'var(--bg)',borderRight:'1px solid var(--b1)',display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto',transition:'transform .25s'}}>
          {NAV_GROUPS.map(group=>(
            <div key={group.label}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--t3)',textTransform:'uppercase' as const,letterSpacing:'.08em',padding:'14px 14px 4px'}}>{group.label}</div>
              {group.items.map(it=>(
                <div key={it.id} onClick={()=>nav(it.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',cursor:'pointer',fontSize:13,color:page===it.id?'var(--t1)':'var(--t2)',background:page===it.id?'var(--s2)':'transparent',borderLeft:`2px solid ${page===it.id?'var(--t1)':'transparent'}`,fontWeight:page===it.id?500:400,transition:'all .12s'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{opacity:page===it.id?1:.5}}>
                    {it.icon.split(' ').map((d,i)=><path key={i} d={d} />)}
                  </svg>
                  <span style={{flex:1}}>{it.label}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{marginTop:'auto',padding:'12px 14px',borderTop:'1px solid var(--b1)'}}>
            <div style={{background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:8,padding:'9px 11px'}}>
              <div style={{fontSize:10,fontWeight:600,textTransform:'uppercase' as const,letterSpacing:'.06em'}}>CoiffPro Pro</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>50€ / mois</div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{flex:1,background:'var(--s1)',display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <div style={{height:46,background:'var(--bg)',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:14,fontWeight:600}}>{PAGE_TITLES[page]||page}</span>
            <div style={{display:'flex',gap:8}}>
              {page==='agenda'&&<Btn onClick={()=>nav('agenda')}>+ RDV</Btn>}
              {page==='ma-page'&&<Btn onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ma page ↗</Btn>}
            </div>
          </div>
          <div style={{flex:1,padding:'14px 16px',overflowY:'auto'}}>
            {renderPage()}
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <nav className="mob-nav">
        {MOBILE_NAV.map(it=>(
          <div key={it.id} className={`mob-btn${page===it.id?' active':''}`} onClick={()=>nav(it.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page===it.id?2:1.5}>
              {it.icon.split(' ').map((d,i)=><path key={i} d={d} />)}
            </svg>
            {it.label}
          </div>
        ))}
      </nav>

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',bottom:16,right:16,background:'var(--t1)',color:'#fff',borderRadius:10,padding:'10px 14px',fontSize:12,zIndex:999,maxWidth:300,lineHeight:1.5,animation:'fadeIn .25s ease'}}>
        {toast}
      </div>}
    </div>
  )
}
