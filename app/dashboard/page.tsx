'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
type Salon = { id:string; name:string; slug:string; email:string; phone:string; address:string; city:string; description:string; instagram:string; google_link:string; google_maps_embed:string; primary_color:string; accent_color:string; status:string; plan_price:number; trial_ends_at:string; sumup_merchant_code:string; sumup_access_token:string; admin_message:string; custom_domain:string; logo_url:string; notification_settings:Record<string,boolean>|null; stripe_customer_id:string }
type Employee = { id:string; name:string; role:string; color:string; is_active:boolean; sort_order:number }
type Service = { id:string; name:string; category:string; duration_minutes:number; price_cents:number; is_active:boolean }
type Client = { id:string; name:string; phone:string; email:string; visit_count:number; total_spent_cents:number; loyalty_points:number; gift_available:boolean; last_visit_at:string; notes:string }
type Appointment = { id:string; client_id:string; scheduled_at:string; status:string; price_cents:number; final_price_cents:number; paid:boolean; payment_method:string; duration_minutes:number; source:string; client_note:string|null; client:Client|null; service:Service|null; employee:Employee|null }
type Product = { id:string; salon_id:string; reference:string; name:string; brand:string; category:string; stock_quantity:number; stock_alert:number; purchase_price_cents:number; sale_price_cents:number; is_active:boolean }
type Campaign = { id:string; name:string; message:string; status:string; recipients_count:number|null; sent_at:string|null; created_at:string }

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
    {id:'stock',label:'Stock produits',icon:'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M12 12v.01'},
    {id:'paiements',label:'Paiements SumUp',icon:'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0-2-2z M1 10h22'},
    {id:'support',label:'Support CoiffPro',icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'},
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
  marketing:'Campagnes SMS',equipe:'Équipe',services:'Services & Tarifs',stock:'Stock produits',
  paiements:'Paiements SumUp',avis:'Avis Google',rappels:'Rappels automatiques',
  support:'Support CoiffPro',
  'ma-page':'Ma page client',parametres:'Paramètres',
}

const MOBILE_NAV = [
  {id:'dashboard',label:'Accueil',icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'},
  {id:'agenda',label:'Agenda',icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z'},
  {id:'clients',label:'Clients',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'},
  {id:'stock',label:'Stock',icon:'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'},
  {id:'parametres',label:'Réglages',icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83'},
]

/* ══════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter()
  const sb = getBrowserClient()
  const tokenRef = useRef<string|null>(null)

  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [salon, setSalon] = useState<Salon|null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [payModal, setPayModal] = useState<Appointment|null>(null)
  const [supportMsgs, setSupportMsgs] = useState<{id:string;from_admin:boolean;message:string;created_at:string;read_at:string|null}[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [theme, setTheme] = useState('light')

  const addToast = useCallback((msg:string) => {
    setToast(msg); setTimeout(()=>setToast(''),3500)
  }, [])

  /* ─── Appel API dashboard avec service role ─── */
  const write = useCallback(async (action:string, payload:{data?:any;id?:string}) => {
    const res = await fetch('/api/dashboard', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${tokenRef.current}` },
      body: JSON.stringify({ action, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erreur serveur')
    return json
  }, [])

  const nav = (p:string) => { setPage(p); setSidebarOpen(false) }

  useEffect(()=>{
    async function load() {
      const { data: { session } } = await sb.auth.getSession()
      if (!session?.user) { router.push('/login'); return }
      tokenRef.current = session.access_token

      const userEmail = session.user.email

      // Si retour OAuth SumUp, attendre que le callback ait sauvegardé en base
      const urlParams = new URLSearchParams(window.location.search)
      const sumupStatus = urlParams.get('sumup')
      if (sumupStatus === 'connected') {
        await new Promise(r => setTimeout(r, 1500))
        setPage('paiements')
        // Nettoyer l'URL sans recharger
        window.history.replaceState({}, '', '/dashboard')
      } else if (sumupStatus === 'error') {
        addToast('❌ Erreur de connexion SumUp')
        window.history.replaceState({}, '', '/dashboard')
      }

      let { data: salonData } = await sb.from('salons').select('*').eq('email', userEmail).single()

      if (!salonData) {
        await new Promise(r => setTimeout(r, 1000))
        const { data: retry } = await sb.from('salons').select('*').eq('email', userEmail).single()
        if (!retry) { router.push('/login'); return }
        salonData = retry
      }
      setSalon(salonData)

      // Afficher toast de succès SumUp après chargement
      if (sumupStatus === 'connected') {
        setTimeout(() => addToast('✅ SumUp connecté avec succès !'), 500)
      }

      const [emps, svcs, cls, appts, prods, cmpgns] = await Promise.all([
        sb.from('employees').select('*').eq('salon_id', salonData!.id).order('sort_order'),
        sb.from('services').select('*').eq('salon_id', salonData!.id).order('sort_order'),
        sb.from('clients').select('*').eq('salon_id', salonData!.id).order('created_at',{ascending:false}),
        sb.from('appointments').select('*, client:clients(name,phone,id), service:services(name,price_cents,duration_minutes), employee:employees(name,color)')
          .eq('salon_id', salonData!.id).order('scheduled_at',{ascending:true}).limit(500),
        sb.from('products').select('*').eq('salon_id', salonData!.id).order('created_at',{ascending:false}).then(r=>r),
        sb.from('sms_campaigns').select('*').eq('salon_id', salonData!.id).order('created_at',{ascending:false}),
      ])
      setEmployees(emps.data || [])
      setServices(svcs.data || [])
      setClients(cls.data || [])
      setAppointments(appts.data || [])
      setProducts(prods.data || [])
      setCampaigns(cmpgns.data || [])
      // Load support messages
      fetch('/api/support', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(r => r.json()).then(j => setSupportMsgs(j.messages || [])).catch(()=>{})
      setLoading(false)
    }
    load()
  }, [])

  const todayAppts = appointments.filter(a=>{
    const d = new Date(a.scheduled_at), now = new Date()
    return d.toDateString()===now.toDateString()
  })
  const caToday = todayAppts.filter(a=>a.paid).reduce((s,a)=>s+a.price_cents,0)
  const unpaid = todayAppts.filter(a=>!a.paid&&a.status==='confirmed')
  const gifts = clients.filter(c=>c.gift_available).length
  const lowStock = products.filter(p=>p.is_active&&p.stock_quantity<=p.stock_alert)

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",background:'#fafafa'}}>
      <div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:12}}>✂</div><div style={{fontSize:14,color:'#888'}}>Chargement…</div></div>
    </div>
  )

  /* ══ PAGES ══ */

  function PageDashboard() {
    return <>
      <div className="stat-grid">
        <SC label="RDV aujourd'hui" value={todayAppts.length} sub={`${unpaid.length} non encaissés`} />
        <SC label="CA du jour" value={fmt(caToday)} sub="encaissé" up />
        <SC label="Total clients" value={clients.length} sub="dans votre CRM" up />
        <SC label="Cadeaux fidélité" value={gifts} sub="à remettre" up={gifts>0} />
      </div>
      {salon?.admin_message&&<div style={{background:'#ede9fe',border:'1px solid #c4b5fd',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
        <span>📣</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'#7c3aed'}}>Message de CoiffPro</div><div style={{fontSize:12,color:'#5b21b6',marginTop:2}}>{salon.admin_message}</div></div>
      </div>}
      {unpaid.length>0&&<div onClick={()=>nav('agenda')} style={{background:'#fdf6e6',border:'1px solid #eed898',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
        <span>💰</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--gold)'}}>{unpaid.length} RDV non encaissés</div><div style={{fontSize:11,color:'var(--gold)',opacity:.7}}>Voir agenda →</div></div>
      </div>}
      {lowStock.length>0&&<div onClick={()=>nav('stock')} style={{background:'#fff5f5',border:'1px solid #fbbfbf',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
        <span>📦</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:'var(--red)'}}>{lowStock.length} produit{lowStock.length>1?'s':''} en stock faible</div><div style={{fontSize:11,color:'var(--red)',opacity:.7}}>Voir le stock →</div></div>
      </div>}
      {gifts>0&&<div onClick={()=>nav('fidelite')} style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:'10px 14px',marginBottom:12,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
        <span>🎁</span><div style={{fontSize:13,fontWeight:600,color:'var(--green)'}}>{gifts} client{gifts>1?'s':''} — cadeau à remettre !</div>
      </div>}
      <div className="g2">
        <Card>
          <CardHd title={`RDV du jour (${todayAppts.length})`} action="Agenda →" onAction={()=>nav('agenda')} />
          {todayAppts.length===0
            ? <div style={{textAlign:'center',padding:'20px 0',fontSize:13,color:'var(--t3)'}}>Aucun RDV aujourd'hui</div>
            : todayAppts.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--b1)'}}>
                <span style={{fontSize:11,color:'var(--t2)',width:38,fontWeight:500}}>{new Date(a.scheduled_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span>
                <div style={{width:26,height:26,borderRadius:'50%',background:'#c8a96e22',color:'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>{ini(a.client?.name||'?')}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.client?.name||'Client'}</div>
                  <div style={{fontSize:10,color:'var(--t3)'}}>{a.service?.name||'Prestation'}</div>
                </div>
                <Bge status={a.status} />
              </div>
            ))
          }
          <div style={{marginTop:10}}><Btn onClick={()=>nav('agenda')} style={{width:'100%'}}>+ Nouveau RDV</Btn></div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Votre page publique" />
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:4}}>Lien de réservation client</div>
              <div style={{fontSize:12,fontWeight:600,wordBreak:'break-all' as const}}>{process.env.NEXT_PUBLIC_APP_URL||'coiffpro.fr'}/book/{salon?.slug}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <Btn ghost onClick={()=>{navigator.clipboard?.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/book/${salon?.slug}`).catch(()=>{});addToast('📋 Lien copié !')}}>Copier</Btn>
              <Btn onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ↗</Btn>
              <Btn ghost onClick={()=>nav('ma-page')}>✏ Modifier</Btn>
            </div>
          </Card>
          <Card>
            <CardHd title="Abonnement" />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Plan</span><span style={{fontWeight:600}}>CoiffPro Pro</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Statut</span><span className="badge badge-ok">{salon?.status==='trial'?'Essai gratuit':'Actif'}</span></div>
            {salon?.status==='trial'&&<div style={{fontSize:12,color:'var(--t3)',marginTop:6}}>Essai jusqu'au {new Date(salon.trial_ends_at).toLocaleDateString('fr-FR')}</div>}
          </Card>
        </div>
      </div>
    </>
  }

  function PageAgenda() {
    const HOUR_H = 64
    const H_START = 8
    const H_END = 21
    const TIME_W = 46
    const HOURS = Array.from({length: H_END - H_START}, (_, i) => H_START + i)

    const [viewDate, setViewDate] = useState(() => new Date())
    const [modal, setModal] = useState(false)
    const [selAppt, setSelAppt] = useState<Appointment|null>(null)
    const [saving, setSaving] = useState(false)
    const [apptForm, setApptForm] = useState({
      clientName:'', phone:'', email:'', serviceId:'', employeeId:'',
      date: new Date().toISOString().split('T')[0], time:'10:00', note:''
    })

    // ── Drag via Pointer Events (mouse + touch unifié, pointer capture) ──
    const dragRef = useRef<{id:string; offsetY:number}|null>(null)
    const dragJustEnded = useRef(false)
    const [dragId, setDragId] = useState<string|null>(null)
    const [dragTop, setDragTop] = useState(0)
    const colsRef = useRef<HTMLDivElement>(null) // conteneur des colonnes (référence Y)

    const [filterEmp, setFilterEmp] = useState<string|null>(null) // null = tous

    const isToday = viewDate.toDateString() === new Date().toDateString()
    const cols = employees.filter(e => e.is_active).sort((a,b) => a.sort_order - b.sort_order)
    const dayAppts = appointments.filter(a =>
      new Date(a.scheduled_at).toDateString() === viewDate.toDateString() && a.status !== 'cancelled'
    )

    // Colonnes affichées selon le filtre
    const displayCols = (() => {
      if (cols.length === 0) return [{ id:'__none__', name:'', color:'#2196f3', is_active:true, role:'', sort_order:0 }]
      if (filterEmp) return cols.filter(c => c.id === filterEmp)
      return cols // tous = multi-colonnes
    })()

    const getColAppts = (empId: string) => dayAppts.filter(a =>
      empId === '__none__' ? true : a.employee?.id === empId
    )

    const timeToY = (d: Date) => ((d.getHours() - H_START) + d.getMinutes() / 60) * HOUR_H
    const yToDate = (y: number): Date => {
      const snapped = Math.round(Math.max(0, y / HOUR_H * 60) / 15) * 15
      const h = H_START + Math.floor(snapped / 60)
      const m = snapped % 60
      const d = new Date(viewDate)
      d.setHours(Math.min(h, H_END - 1), m, 0, 0)
      return d
    }
    const yToTimeStr = (y: number) => {
      const d = yToDate(y)
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    }

    // Pointer capture : smooth drag sans perte même en sortant de l'élément
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>, a: Appointment) => {
      if (a.paid) return
      e.preventDefault()
      e.stopPropagation()
      const el = e.currentTarget
      el.setPointerCapture(e.pointerId)
      const containerTop = colsRef.current!.getBoundingClientRect().top
      const offsetY = e.clientY - containerTop - timeToY(new Date(a.scheduled_at))
      dragRef.current = { id: a.id, offsetY }
      setDragId(a.id)
      setDragTop(timeToY(new Date(a.scheduled_at)))
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      e.preventDefault()
      const containerTop = colsRef.current!.getBoundingClientRect().top
      const top = Math.max(0, Math.min(
        e.clientY - containerTop - dragRef.current.offsetY,
        (H_END - H_START - 0.25) * HOUR_H
      ))
      setDragTop(top)
    }
    const onPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      e.currentTarget.releasePointerCapture(e.pointerId)
      const { id } = dragRef.current
      dragRef.current = null
      dragJustEnded.current = true
      setTimeout(() => { dragJustEnded.current = false }, 200)
      setDragId(null)
      const newDate = yToDate(dragTop)
      const orig = appointments.find(a => a.id === id)
      if (!orig) return
      if (Math.abs(newDate.getTime() - new Date(orig.scheduled_at).getTime()) < 60000) return
      try {
        await write('update_appointment', { id, data: { scheduled_at: newDate.toISOString() } })
        setAppointments(prev => prev.map(a => a.id === id ? {...a, scheduled_at: newDate.toISOString()} : a))
        addToast('✅ RDV déplacé')
      } catch(err:any) { addToast('❌ '+err.message) }
    }

    // Clic sur zone vide → pré-remplir heure + coiffeur et ouvrir modal
    const onColClick = (e: React.MouseEvent<HTMLDivElement>, empId: string) => {
      if (dragJustEnded.current) return
      const rect = colsRef.current!.getBoundingClientRect()
      const y = e.clientY - rect.top
      const time = yToTimeStr(y)
      setApptForm(f => ({...f, date: viewDate.toISOString().split('T')[0], time, employeeId: empId === '__none__' ? '' : empId}))
      setModal(true)
    }

    const saveRDV = async () => {
      if (!apptForm.clientName || !apptForm.phone || !apptForm.serviceId) {
        addToast('⚠ Remplissez le client, téléphone et prestation'); return
      }
      setSaving(true)
      try {
        const { data: appt } = await write('add_appointment', { data: {
          clientName: apptForm.clientName, phone: apptForm.phone, email: apptForm.email,
          serviceId: apptForm.serviceId, employeeId: apptForm.employeeId || null,
          date: apptForm.date, time: apptForm.time, note: apptForm.note,
        }})
        setAppointments(a => [...a, appt])
        setModal(false)
        setApptForm({ clientName:'', phone:'', email:'', serviceId:'', employeeId:'', date: viewDate.toISOString().split('T')[0], time:'10:00', note:'' })
        addToast('✅ RDV enregistré !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const cancelAppt = async (id: string) => {
      if (!confirm('Annuler ce RDV ?')) return
      try {
        await write('cancel_appointment', { id, data: {} })
        setAppointments(prev => prev.map(a => a.id === id ? {...a, status:'cancelled'} : a))
        setSelAppt(null); addToast('✅ RDV annulé')
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    const prevDay = () => { const d = new Date(viewDate); d.setDate(d.getDate()-1); setViewDate(d) }
    const nextDay = () => { const d = new Date(viewDate); d.setDate(d.getDate()+1); setViewDate(d) }
    const dayLabel = viewDate.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'2-digit'}).replace(/^\w/,c=>c.toUpperCase())

    return (
      <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 56px)',margin:'-18px',overflow:'hidden',background:'var(--bg)'}}>

        {/* ── Header jour ── */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderBottom:'1px solid var(--b1)',flexShrink:0}}>
          <button onClick={prevDay} style={{background:'none',border:'none',fontSize:26,cursor:'pointer',color:'var(--t1)',lineHeight:1,padding:'4px 10px'}}>‹</button>
          <div style={{textAlign:'center'}}>
            <div style={{fontWeight:700,fontSize:14,textTransform:'capitalize'}}>{dayLabel}</div>
            <div style={{fontSize:11,color:'#2196f3'}}>{salon?.name}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <button onClick={nextDay} style={{background:'none',border:'none',fontSize:26,cursor:'pointer',color:'var(--t1)',lineHeight:1,padding:'4px 10px'}}>›</button>
            <button onClick={()=>{setApptForm(f=>({...f,date:viewDate.toISOString().split('T')[0],time:'10:00',employeeId:''}));setModal(true)}} style={{width:34,height:34,borderRadius:'50%',background:'var(--green)',border:'none',color:'#fff',fontSize:22,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
          </div>
        </div>

        {/* ── Filtre coiffeurs ── */}
        {cols.length > 0 && (
          <div style={{display:'flex',gap:6,padding:'7px 10px',borderBottom:'1px solid var(--b1)',flexShrink:0,overflowX:'auto',background:'var(--bg)'}}>
            <button
              onClick={()=>setFilterEmp(null)}
              style={{flexShrink:0,padding:'4px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
                background: filterEmp===null?'var(--t1)':'transparent',
                color: filterEmp===null?'var(--bg)':'var(--t2)',
                borderColor: filterEmp===null?'var(--t1)':'var(--b2)',
              }}>Tous</button>
            {cols.map(emp => (
              <button key={emp.id}
                onClick={()=>setFilterEmp(emp.id)}
                style={{flexShrink:0,padding:'4px 12px',borderRadius:20,border:'1.5px solid',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,
                  background: filterEmp===emp.id ? emp.color||'#2196f3' : 'transparent',
                  color: filterEmp===emp.id ? '#fff' : 'var(--t2)',
                  borderColor: filterEmp===emp.id ? emp.color||'#2196f3' : 'var(--b2)',
                }}>
                <div style={{width:7,height:7,borderRadius:'50%',background: filterEmp===emp.id?'#fff':(emp.color||'#2196f3'),flexShrink:0}} />
                {emp.name}
              </button>
            ))}
          </div>
        )}

        {/* ── En-têtes colonnes (uniquement vue "Tous" multi-colonnes) ── */}
        {cols.length > 0 && !filterEmp && (
          <div style={{display:'flex',flexShrink:0,borderBottom:'1px solid var(--b1)',background:'var(--s1)'}}>
            <div style={{width:TIME_W,flexShrink:0}} />
            {displayCols.map((emp,i) => (
              <div key={emp.id} style={{flex:1,textAlign:'center',padding:'5px 4px',borderLeft:i>0?'1px solid var(--b1)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:emp.color||'#c8a96e',flexShrink:0}} />
                <span style={{fontSize:11,fontWeight:600,color:'var(--t2)'}}>{emp.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline scrollable ── */}
        <div style={{flex:1,overflowY:'auto',overflowX:'hidden',position:'relative'}}>
          <div style={{display:'flex',height:(H_END-H_START)*HOUR_H+'px'}}>

            {/* Axe horaire */}
            <div style={{width:TIME_W,flexShrink:0,position:'relative'}}>
              {HOURS.map(h => (
                <div key={h} style={{position:'absolute',top:(h-H_START)*HOUR_H-8,right:6,fontSize:10,color:'var(--t3)',fontVariantNumeric:'tabular-nums',userSelect:'none'}}>
                  {String(h).padStart(2,'0')}:00
                </div>
              ))}
            </div>

            {/* Colonnes */}
            <div ref={colsRef} style={{flex:1,display:'flex',position:'relative'}}>

              {/* Grille horaire (derrière tout) */}
              <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0}}>
                {HOURS.map(h => (
                  <div key={h} style={{position:'absolute',top:(h-H_START)*HOUR_H,left:0,right:0,borderTop:'1px solid var(--b1)'}} />
                ))}
                {HOURS.map(h => (
                  <div key={`m${h}`} style={{position:'absolute',top:(h-H_START)*HOUR_H+HOUR_H/2,left:0,right:0,borderTop:'1px dashed var(--b1)',opacity:.4}} />
                ))}
                {isToday && (()=>{
                  const top = timeToY(new Date())
                  return <div style={{position:'absolute',left:0,right:0,top,zIndex:5}}>
                    <div style={{height:2,background:'#f44336',boxShadow:'0 0 4px #f4433688'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:'#f44336',position:'absolute',left:-4,top:-3}} />
                    </div>
                  </div>
                })()}
              </div>

              {/* Une colonne par coiffeur */}
              {displayCols.map((emp, ci) => {
                const empAppts = getColAppts(emp.id)
                return (
                  <div key={emp.id} style={{flex:1,position:'relative',borderLeft: ci>0?'1px solid var(--b1)':'none',cursor:'cell'}}
                    onClick={e => onColClick(e, emp.id)}
                  >
                    {empAppts.map(a => {
                      const isDragging = dragId === a.id
                      const start = new Date(a.scheduled_at)
                      const dur = a.duration_minutes || a.service?.duration_minutes || 30
                      const top = isDragging ? dragTop : timeToY(start)
                      const height = Math.max(26, (dur/60)*HOUR_H - 3)
                      const end = new Date(start.getTime() + dur*60000)
                      const bg = a.paid ? '#4caf50' : (emp.color || '#2196f3')
                      return (
                        <div key={a.id}
                          style={{
                            position:'absolute', left:3, right:3, top, height,
                            background: bg,
                            borderRadius:7, padding:'3px 7px',
                            cursor: a.paid ? 'pointer' : isDragging ? 'grabbing' : 'grab',
                            userSelect:'none', touchAction:'none',
                            opacity: isDragging ? 0.82 : 1,
                            boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.28)' : '0 1px 4px rgba(0,0,0,.18)',
                            zIndex: isDragging ? 200 : 3,
                            overflow:'hidden',
                            transition: isDragging ? 'none' : 'box-shadow .15s',
                            willChange: isDragging ? 'top' : 'auto',
                          }}
                          onPointerDown={e => onPointerDown(e, a)}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                          onClick={e => { e.stopPropagation(); if(!dragJustEnded.current) setSelAppt(a) }}
                        >
                          <div style={{fontSize:10,fontWeight:700,color:'#fff',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {a.source==='online'&&<span style={{opacity:.85}}>@ </span>}
                            {a.paid&&<span>🔒 </span>}
                            {start.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}–{end.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} {a.client?.name||''}{a.service?.name?' · '+a.service.name:''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>


        {/* ── Modal détail RDV ── */}
        {selAppt&&<div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setSelAppt(null)}}>
          <div className="modal">
            <div className="modal-ttl">{selAppt.client?.name||'Client'}</div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:14}}>
              {new Date(selAppt.scheduled_at).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})} · {new Date(selAppt.scheduled_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} · {selAppt.duration_minutes||selAppt.service?.duration_minutes||30}min
            </div>
            {[
              ['Prestation', selAppt.service?.name||'-'],
              ['Coiffeur', selAppt.employee?.name||'Non assigné'],
              ['Téléphone', selAppt.client?.phone||'-'],
              ['Prix', fmt(selAppt.final_price_cents||selAppt.price_cents)],
              ['Source', selAppt.source==='online'?'🌐 En ligne':'✏ Manuel'],
              ...(selAppt.client_note ? [['Note', selAppt.client_note]] : []),
            ].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--b1)',fontSize:13}}>
                <span style={{color:'var(--t2)'}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap' as const}}>
              {!selAppt.paid&&<Btn onClick={()=>{setPayModal(selAppt);setSelAppt(null)}} style={{background:'var(--green)'}}>💰 Encaisser</Btn>}
              {!selAppt.paid&&<Btn ghost danger onClick={()=>cancelAppt(selAppt.id)}>Annuler le RDV</Btn>}
              <Btn ghost onClick={()=>setSelAppt(null)}>Fermer</Btn>
            </div>
          </div>
        </div>}

        {/* ── Modal nouveau RDV ── */}
        {modal&&<div className="overlay"><div className="modal">
          <div className="modal-ttl">+ Nouveau rendez-vous</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <FRow label="Nom du client *"><Inp placeholder="Marie Dupont" value={apptForm.clientName} onChange={v=>setApptForm(f=>({...f,clientName:v}))} /></FRow>
            <FRow label="Téléphone *"><Inp placeholder="06 12 34 56 78" type="tel" value={apptForm.phone} onChange={v=>setApptForm(f=>({...f,phone:v}))} /></FRow>
            <FRow label="Prestation *">
              <select className="input" value={apptForm.serviceId} onChange={e=>setApptForm(f=>({...f,serviceId:e.target.value}))}>
                <option value="">Sélectionner…</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name} — {fmt(s.price_cents)}</option>)}
              </select>
            </FRow>
            <FRow label="Collaborateur">
              <select className="input" value={apptForm.employeeId} onChange={e=>setApptForm(f=>({...f,employeeId:e.target.value}))}>
                <option value="">Non assigné</option>
                {employees.filter(e=>e.is_active).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </FRow>
            <FRow label="Date"><input type="date" className="input" value={apptForm.date} onChange={e=>setApptForm(f=>({...f,date:e.target.value}))} /></FRow>
            <FRow label="Heure"><input type="time" className="input" value={apptForm.time} onChange={e=>setApptForm(f=>({...f,time:e.target.value}))} /></FRow>
          </div>
          <FRow label="Note (optionnel)"><Inp placeholder="Instructions…" value={apptForm.note} onChange={v=>setApptForm(f=>({...f,note:v}))} /></FRow>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
            <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
            <Btn onClick={saveRDV} disabled={saving||!apptForm.clientName||!apptForm.phone||!apptForm.serviceId}>
              {saving?'Enregistrement…':'Enregistrer le RDV'}
            </Btn>
          </div>
        </div></div>}
      </div>
    )
  }

  function PageClients() {
    const [search, setSearch] = useState('')
    const [sel, setSel] = useState<Client|null>(null)
    const [note, setNote] = useState('')
    const [modal, setModal] = useState(false)
    const [clientForm, setClientForm] = useState({ name:'', phone:'', email:'' })
    const [saving, setSaving] = useState(false)
    const filtered = clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search))

    const saveNote = async (clientId:string) => {
      setSaving(true)
      try {
        await write('update_client_notes', { id: clientId, data: { notes: note } })
        setClients(c=>c.map(x=>x.id===clientId?{...x,notes:note}:x))
        addToast('✅ Note sauvegardée')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const addClient = async () => {
      if (!clientForm.name || !clientForm.phone) { addToast('⚠ Nom et téléphone requis'); return }
      setSaving(true)
      try {
        const { data } = await write('add_client', { data: { name: clientForm.name, phone: clientForm.phone, email: clientForm.email } })
        setClients(c=>[data,...c])
        setClientForm({ name:'', phone:'', email:'' })
        setModal(false)
        addToast('✅ Client ajouté !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

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
              <div key={l as string} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
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
          <textarea value={note} onChange={e=>setNote(e.target.value)} onFocus={()=>{ if(!note) setNote(sel.notes||'') }}
            className="input" style={{height:100,resize:'none' as const,lineHeight:1.5}} placeholder="Notes internes sur ce client…" />
          <Btn onClick={()=>saveNote(sel.id)} disabled={saving} style={{marginTop:8,width:'100%'}}>
            {saving?'Sauvegarde…':'Sauvegarder'}
          </Btn>
        </Card>
      </div>
    </>

    return <>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <Inp placeholder="Rechercher un client…" value={search} onChange={setSearch} style={{maxWidth:260}} />
        <Btn onClick={()=>setModal(true)} style={{marginLeft:'auto'}}>+ Ajouter un client</Btn>
      </div>
      <Card>
        {clients.length===0
          ? <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>👥</div>Vos clients apparaîtront ici.</div>
          : <div style={{overflowX:'auto' as const}}>
              <table className="table">
                <thead><tr><th>Client</th><th>Téléphone</th><th>Visites</th><th className="mob-hide">CA total</th><th className="mob-hide">Fidélité</th></tr></thead>
                <tbody>{filtered.map(c=>(
                  <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>{setSel(c);setNote(c.notes||'')}}>
                    <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:'#c8a96e22',color:'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,flexShrink:0}}>{ini(c.name)}</div>
                      <span style={{fontWeight:500}}>{c.name}{c.gift_available&&<span style={{display:'inline-flex',background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:5,padding:'1px 5px',fontSize:9,color:'var(--green)',fontWeight:600,marginLeft:5}}>🎁</span>}</span>
                    </div></td>
                    <td style={{color:'var(--t2)'}}>{c.phone}</td>
                    <td style={{fontWeight:600}}>{c.visit_count}</td>
                    <td className="mob-hide" style={{fontWeight:600}}>{fmt(c.total_spent_cents)}</td>
                    <td className="mob-hide"><div style={{display:'flex',gap:3}}>{Array.from({length:10},(_,i)=><div key={i} style={{width:9,height:9,borderRadius:'50%',background:i<(c.loyalty_points||0)?'var(--gold)':'var(--b1)'}}/>)}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
        }
      </Card>
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau client</div>
        <FRow label="Nom complet *"><Inp placeholder="Marie Dupont" value={clientForm.name} onChange={v=>setClientForm(f=>({...f,name:v}))} /></FRow>
        <FRow label="Téléphone *"><Inp placeholder="06 12 34 56 78" type="tel" value={clientForm.phone} onChange={v=>setClientForm(f=>({...f,phone:v}))} /></FRow>
        <FRow label="Email"><Inp placeholder="marie@exemple.fr" type="email" value={clientForm.email} onChange={v=>setClientForm(f=>({...f,email:v}))} /></FRow>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={addClient} disabled={saving||!clientForm.name||!clientForm.phone}>
            {saving?'Ajout…':'Ajouter le client'}
          </Btn>
        </div>
      </div></div>}
    </>
  }

  function PageEquipe() {
    const [modal, setModal] = useState(false)
    const [empForm, setEmpForm] = useState({ name:'', role:'Coiffeur(se)' })
    const [saving, setSaving] = useState(false)

    const addEmp = async () => {
      if (!empForm.name.trim()) return
      setSaving(true)
      try {
        const { data } = await write('add_employee', { data: { name: empForm.name.trim(), role: empForm.role, is_active: true, sort_order: employees.length, color: '#c8a96e' } })
        setEmployees(e=>[...e,data])
        setEmpForm({ name:'', role:'Coiffeur(se)' })
        setModal(false)
        addToast('✅ Collaborateur ajouté !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const toggleEmp = async (emp:Employee) => {
      try {
        await write('toggle_employee', { id: emp.id, data: { is_active: !emp.is_active } })
        setEmployees(e=>e.map(x=>x.id===emp.id?{...x,is_active:!x.is_active}:x))
        addToast('✅ Statut mis à jour')
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    return <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <Btn onClick={()=>setModal(true)}>+ Ajouter un collaborateur</Btn>
      </div>
      {employees.length===0
        ? <Card><div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>👥</div>Ajoutez vos collaborateurs.</div></Card>
        : <div className="g2">{employees.map(e=>(
            <Card key={e.id}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:40,height:40,borderRadius:'50%',background:(e.color||'#c8a96e')+'22',color:e.color||'#c8a96e',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>{ini(e.name)}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{e.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{e.role}</div></div>
                <Tgl on={e.is_active} onChange={()=>toggleEmp(e)} />
              </div>
              <div style={{fontSize:11,color:'var(--t3)'}}>{e.is_active?'🟢 Actif':'⚫ Inactif'}</div>
            </Card>
          ))}</div>
      }
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau collaborateur</div>
        <FRow label="Nom complet *"><Inp placeholder="Prénom Nom" value={empForm.name} onChange={v=>setEmpForm(f=>({...f,name:v}))} /></FRow>
        <FRow label="Rôle / Spécialité"><Inp placeholder="Coiffeur(se), Barbier…" value={empForm.role} onChange={v=>setEmpForm(f=>({...f,role:v}))} /></FRow>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={addEmp} disabled={saving||!empForm.name.trim()}>{saving?'Ajout…':'Ajouter'}</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageServices() {
    const [modal, setModal] = useState(false)
    const [svcForm, setSvcForm] = useState({ name:'', category:'Coupes', duration_minutes:30, price:20 })
    const [saving, setSaving] = useState(false)

    const addSvc = async () => {
      if (!svcForm.name.trim()) return
      setSaving(true)
      try {
        const { data } = await write('add_service', { data: {
          name: svcForm.name.trim(), category: svcForm.category,
          duration_minutes: svcForm.duration_minutes,
          price_cents: Math.round(svcForm.price * 100),
          sort_order: services.length, is_active: true
        }})
        setServices(s=>[...s,data])
        setSvcForm({ name:'', category:'Coupes', duration_minutes:30, price:20 })
        setModal(false)
        addToast('✅ Service ajouté !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const toggleSvc = async (svc:Service) => {
      try {
        await write('toggle_service', { id: svc.id, data: { is_active: !svc.is_active } })
        setServices(s=>s.map(x=>x.id===svc.id?{...x,is_active:!x.is_active}:x))
        addToast('✅ Statut mis à jour')
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    return <>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <Btn onClick={()=>setModal(true)}>+ Ajouter un service</Btn>
      </div>
      <Card>
        {services.length===0
          ? <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>✂</div>Ajoutez vos prestations.</div>
          : <table className="table">
              <thead><tr><th>Prestation</th><th>Catégorie</th><th>Durée</th><th>Prix</th><th>Actif</th></tr></thead>
              <tbody>{services.map(s=>(
                <tr key={s.id}>
                  <td style={{fontWeight:500}}>{s.name}</td>
                  <td style={{color:'var(--t2)'}}>{s.category}</td>
                  <td style={{color:'var(--t2)'}}>{fmtDur(s.duration_minutes)}</td>
                  <td style={{fontWeight:700}}>{fmt(s.price_cents)}</td>
                  <td><Tgl on={s.is_active} onChange={()=>toggleSvc(s)} /></td>
                </tr>
              ))}</tbody>
            </table>
        }
      </Card>
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau service</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FRow label="Nom *"><Inp placeholder="Coupe Homme" value={svcForm.name} onChange={v=>setSvcForm(f=>({...f,name:v}))} /></FRow>
          <FRow label="Catégorie">
            <select className="input" value={svcForm.category} onChange={e=>setSvcForm(f=>({...f,category:e.target.value}))}>
              <option>Coupes</option><option>Barbier</option><option>Couleurs</option><option>Soins</option><option>Forfaits</option>
            </select>
          </FRow>
          <FRow label="Durée (min)"><Inp type="number" placeholder="30" value={String(svcForm.duration_minutes)} onChange={v=>setSvcForm(f=>({...f,duration_minutes:Number(v)}))} /></FRow>
          <FRow label="Prix (€)"><Inp type="number" placeholder="20" value={String(svcForm.price)} onChange={v=>setSvcForm(f=>({...f,price:Number(v)}))} /></FRow>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={addSvc} disabled={saving||!svcForm.name.trim()}>{saving?'Ajout…':'Ajouter'}</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageStock() {
    const [modal, setModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ reference:'', name:'', brand:'', category:'Soins', stock_quantity:0, stock_alert:5, purchase_price_cents:0, sale_price_cents:0 })

    const addProduct = async () => {
      if (!form.name.trim()||!form.reference.trim()) { addToast('⚠ Référence et nom requis'); return }
      setSaving(true)
      try {
        const { data } = await write('add_product', { data: { ...form, is_active: true } })
        setProducts(p=>[data,...p])
        setForm({ reference:'', name:'', brand:'', category:'Soins', stock_quantity:0, stock_alert:5, purchase_price_cents:0, sale_price_cents:0 })
        setModal(false)
        addToast('✅ Produit ajouté !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const adjustStock = async (prod:Product, delta:number) => {
      const qty = Math.max(0, prod.stock_quantity+delta)
      try {
        await write('update_product_stock', { id: prod.id, data: { stock_quantity: qty } })
        setProducts(p=>p.map(x=>x.id===prod.id?{...x,stock_quantity:qty}:x))
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    const setStockDirect = async (prod:Product, qty:number) => {
      const newQty = Math.max(0, qty)
      try {
        await write('update_product_stock', { id: prod.id, data: { stock_quantity: newQty } })
        setProducts(p=>p.map(x=>x.id===prod.id?{...x,stock_quantity:newQty}:x))
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    const deleteProduct = async (prod:Product) => {
      if (!confirm(`Supprimer "${prod.name}" ?`)) return
      try {
        await write('delete_product', { id: prod.id, data: {} })
        setProducts(p=>p.filter(x=>x.id!==prod.id))
        addToast('🗑 Produit supprimé')
      } catch(e:any) { addToast('❌ '+e.message) }
    }

    const totalStock = products.filter(p=>p.is_active).reduce((s,p)=>s+p.stock_quantity,0)
    const stockValue = products.filter(p=>p.is_active).reduce((s,p)=>s+(p.stock_quantity*p.purchase_price_cents),0)

    return <>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:12}}>
        <Btn onClick={()=>setModal(true)}>+ Ajouter un produit</Btn>
      </div>
      <div className="g3" style={{marginBottom:12}}>
        <SC label="Produits référencés" value={products.filter(p=>p.is_active).length} />
        <SC label="Unités en stock" value={totalStock} />
        <SC label="Valeur du stock" value={fmt(stockValue)} up />
      </div>
      {lowStock.length>0&&<div style={{background:'#fff5f5',border:'1px solid #fbbfbf',borderRadius:10,padding:'10px 14px',marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--red)',marginBottom:6}}>⚠ Stock faible — {lowStock.length} produit{lowStock.length>1?'s':''} à réapprovisionner</div>
        {lowStock.map(p=><div key={p.id} style={{fontSize:11,color:'var(--red)',marginBottom:2}}>• {p.name} ({p.reference}) — {p.stock_quantity} unité{p.stock_quantity!==1?'s':''}</div>)}
      </div>}
      <Card>
        {products.length===0
          ? <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}><div style={{fontSize:32,marginBottom:8}}>📦</div>Ajoutez vos produits pour gérer votre stock.</div>
          : <div style={{overflowX:'auto' as const}}>
              <table className="table">
                <thead><tr><th>Réf.</th><th>Produit</th><th className="mob-hide">Marque</th><th className="mob-hide">Catégorie</th><th>Stock</th><th className="mob-hide">P.A.</th><th className="mob-hide">P.V.</th><th></th></tr></thead>
                <tbody>{products.map(p=>{
                  const alert=p.stock_quantity<=p.stock_alert
                  return <tr key={p.id} style={{opacity:p.is_active?1:.5}}>
                    <td style={{fontFamily:'monospace',fontSize:11,color:'var(--t2)',whiteSpace:'nowrap'}}>{p.reference}</td>
                    <td><div style={{fontWeight:500,fontSize:12}}>{p.name}</div>{alert&&<div style={{fontSize:9,color:'var(--red)',fontWeight:600}}>⚠ STOCK FAIBLE</div>}</td>
                    <td className="mob-hide" style={{color:'var(--t2)',fontSize:11}}>{p.brand||'—'}</td>
                    <td className="mob-hide" style={{color:'var(--t2)',fontSize:11}}>{p.category}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <button onClick={()=>adjustStock(p,-1)} style={{width:20,height:20,borderRadius:4,border:'1px solid var(--b2)',background:'var(--bg)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t1)'}}>−</button>
                        <input type="number" min="0" value={p.stock_quantity}
                          onChange={e=>setStockDirect(p,Number(e.target.value))}
                          style={{width:44,textAlign:'center' as const,border:'1px solid var(--b2)',borderRadius:5,padding:'2px 4px',fontSize:12,background:'var(--bg)',color:alert?'var(--red)':'var(--t1)',fontWeight:alert?700:400}} />
                        <button onClick={()=>adjustStock(p,+1)} style={{width:20,height:20,borderRadius:4,border:'1px solid var(--b2)',background:'var(--bg)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t1)'}}>+</button>
                      </div>
                    </td>
                    <td className="mob-hide" style={{fontSize:11,color:'var(--t2)'}}>{p.purchase_price_cents?fmt(p.purchase_price_cents):'—'}</td>
                    <td className="mob-hide" style={{fontSize:11,fontWeight:600}}>{p.sale_price_cents?fmt(p.sale_price_cents):'—'}</td>
                    <td><button onClick={()=>deleteProduct(p)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:14,padding:'2px 6px'}} title="Supprimer">✕</button></td>
                  </tr>
                })}</tbody>
              </table>
            </div>
        }
      </Card>
      {modal&&<div className="overlay"><div className="modal">
        <div className="modal-ttl">+ Nouveau produit</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <FRow label="Référence / N° produit *"><Inp placeholder="KERA-001" value={form.reference} onChange={v=>setForm(f=>({...f,reference:v}))} /></FRow>
          <FRow label="Nom du produit *"><Inp placeholder="Shampoing Bain Satin" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} /></FRow>
          <FRow label="Marque"><Inp placeholder="Kérastase…" value={form.brand} onChange={v=>setForm(f=>({...f,brand:v}))} /></FRow>
          <FRow label="Catégorie">
            <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              <option>Soins</option><option>Colorations</option><option>Styling</option><option>Outillage</option><option>Accessoires</option><option>Autre</option>
            </select>
          </FRow>
          <FRow label="Stock initial"><Inp type="number" placeholder="0" value={String(form.stock_quantity)} onChange={v=>setForm(f=>({...f,stock_quantity:Number(v)}))} /></FRow>
          <FRow label="Seuil alerte"><Inp type="number" placeholder="5" value={String(form.stock_alert)} onChange={v=>setForm(f=>({...f,stock_alert:Number(v)}))} /></FRow>
          <FRow label="Prix d'achat (€)"><Inp type="number" placeholder="0" value={String(form.purchase_price_cents/100||'')} onChange={v=>setForm(f=>({...f,purchase_price_cents:Math.round(Number(v)*100)}))} /></FRow>
          <FRow label="Prix de vente (€)"><Inp type="number" placeholder="0" value={String(form.sale_price_cents/100||'')} onChange={v=>setForm(f=>({...f,sale_price_cents:Math.round(Number(v)*100)}))} /></FRow>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setModal(false)}>Annuler</Btn>
          <Btn onClick={addProduct} disabled={saving||!form.name.trim()||!form.reference.trim()}>{saving?'Ajout…':'Ajouter le produit'}</Btn>
        </div>
      </div></div>}
    </>
  }

  function PageMaPage() {
    const [f, setF] = useState({
      name:salon?.name||'', description:salon?.description||'', address:salon?.address||'',
      city:salon?.city||'', phone:salon?.phone||'', instagram:salon?.instagram||'',
      google_link:salon?.google_link||'', google_maps_embed:salon?.google_maps_embed||'',
      primary_color:salon?.primary_color||'#1a1a1a', accent_color:salon?.accent_color||'#c8a96e',
    })
    const up = (k:keyof typeof f, v:string) => setF(p=>({...p,[k]:v}))
    const [saving, setSaving] = useState(false)

    const save = async () => {
      setSaving(true)
      try {
        await write('update_salon', { data: f })
        setSalon(s=>s?{...s,...f}:s)
        addToast('✅ Page mise à jour !')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    return <>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginBottom:12}}>
        <Btn ghost onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir ma page ↗</Btn>
        <Btn onClick={save} disabled={saving}>{saving?'Sauvegarde…':'✅ Sauvegarder'}</Btn>
      </div>
      <div className="g2">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Informations affichées" />
            <FRow label="Nom du salon"><Inp value={f.name} onChange={v=>up('name',v)} placeholder="Mon Salon" /></FRow>
            <FRow label="Description">
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
            <textarea value={f.google_maps_embed} onChange={e=>up('google_maps_embed',e.target.value)} className="input" style={{height:60,resize:'none' as const,fontSize:11}} placeholder="https://www.google.com/maps/embed?pb=..." />
            {f.google_maps_embed && (
              f.google_maps_embed.includes('maps/embed') || f.google_maps_embed.includes('maps.google.com/maps?')
                ? <div style={{marginTop:8,borderRadius:8,overflow:'hidden',height:160}}><iframe src={f.google_maps_embed} style={{width:'100%',height:'100%',border:'none'}} loading="lazy" /></div>
                : <div style={{marginTop:8,padding:'10px 12px',background:'#fdf6e6',border:'1px solid #eed898',borderRadius:8,fontSize:12,color:'#92400e',lineHeight:1.6}}>
                    ⚠ Cette URL ne peut pas s'afficher dans une carte intégrée.<br/>
                    <strong>Comment obtenir la bonne URL :</strong><br/>
                    1. Ouvre <strong>Google Maps</strong> sur ton adresse<br/>
                    2. Clique <strong>Partager</strong> → <strong>Intégrer une carte</strong><br/>
                    3. Copie uniquement l'URL à l'intérieur de <code>src="..."</code><br/>
                    Elle commence par <code>https://www.google.com/maps/embed?pb=</code>
                  </div>
            )}
          </Card>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Logo & couleurs" />
            <FRow label="Logo du salon">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                {salon?.logo_url
                  ? <img src={salon.logo_url} alt="logo" style={{width:48,height:48,objectFit:'contain',borderRadius:8,border:'1px solid var(--b1)',background:'#fff',filter:theme==='dark'?'brightness(0) invert(1)':'none'}} />
                  : <div style={{width:48,height:48,borderRadius:8,background:'var(--s1)',border:'1px solid var(--b1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>✂</div>
                }
                <label style={{cursor:'pointer',flex:1}}>
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{
                    const file=e.target.files?.[0]; if(!file) return
                    const fd=new FormData(); fd.append('file',file); fd.append('type','logo')
                    addToast('⏳ Upload en cours…')
                    const res=await fetch('/api/storage/upload',{method:'POST',headers:{Authorization:`Bearer ${tokenRef.current}`},body:fd})
                    const j=await res.json()
                    if(res.ok){setSalon(s=>s?{...s,logo_url:j.url}:s);addToast('✅ Logo mis à jour !')}
                    else addToast('❌ '+j.error+' — Créez le bucket "salon-photos" dans Supabase Storage')
                  }} />
                  <div style={{background:'var(--s1)',border:'1px solid var(--b2)',borderRadius:8,padding:'8px 12px',fontSize:12,textAlign:'center' as const}}>
                    📷 Changer le logo
                  </div>
                </label>
              </div>
              <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>PNG/JPG recommandé. Le logo s'adapte automatiquement au mode sombre.</div>
            </FRow>
            <FRow label="Couleur principale"><div style={{display:'flex',gap:8,alignItems:'center'}}><input type="color" value={f.primary_color} onChange={e=>up('primary_color',e.target.value)} style={{width:36,height:36,border:'1px solid var(--b1)',borderRadius:8,cursor:'pointer',padding:2}} /><Inp value={f.primary_color} onChange={v=>up('primary_color',v)} /></div></FRow>
            <FRow label="Couleur accent"><div style={{display:'flex',gap:8,alignItems:'center'}}><input type="color" value={f.accent_color} onChange={e=>up('accent_color',e.target.value)} style={{width:36,height:36,border:'1px solid var(--b1)',borderRadius:8,cursor:'pointer',padding:2}} /><Inp value={f.accent_color} onChange={v=>up('accent_color',v)} /></div></FRow>
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:12,marginTop:8}}>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>Aperçu</div>
              <button style={{background:f.primary_color,color:'#fff',border:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:600,width:'100%',marginBottom:6}}>Réserver en ligne →</button>
              <div style={{color:f.accent_color,fontSize:14}}>★★★★★ <span style={{fontSize:12,color:'var(--t1)'}}>4.9</span></div>
            </div>
          </Card>
          <Card>
            <CardHd title="Photos de la galerie" action="+ Ajouter" onAction={()=>document.getElementById('photo-upload-input')?.click()} />
            <input id="photo-upload-input" type="file" accept="image/*" multiple style={{display:'none'}} onChange={async e=>{
              const files=Array.from(e.target.files||[])
              for(const file of files){
                const fd=new FormData(); fd.append('file',file); fd.append('type','photo')
                const res=await fetch('/api/storage/upload',{method:'POST',headers:{Authorization:`Bearer ${tokenRef.current}`},body:fd})
                if(!res.ok){const j=await res.json();addToast('❌ '+j.error+' — Créez le bucket "salon-photos" dans Supabase Storage');break}
              }
              addToast(`✅ ${files.length} photo${files.length>1?'s':''} ajoutée${files.length>1?'s':''}`)
              e.target.value=''
            }} />
            <div style={{fontSize:12,color:'var(--t3)',textAlign:'center' as const,padding:'16px 0'}}>
              Photos visibles sur votre page de réservation.<br/>
              <span style={{fontSize:11}}>Cliquez "+ Ajouter" pour uploader.</span>
            </div>
          </Card>
          <Card>
            <CardHd title="Votre lien de réservation" />
            {(() => {
              const base = salon?.custom_domain ? `https://${salon.custom_domain}` : (process.env.NEXT_PUBLIC_APP_URL||'https://coiffpro.fr')
              const fullUrl = `${base}/book/${salon?.slug}`
              const display = `coiffpro.fr/${salon?.slug}`
              return <>
                <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:'10px 14px',marginBottom:12}}>
                  <div style={{fontSize:11,color:'var(--t3)',marginBottom:3}}>Votre lien de réservation</div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--t1)'}}>coiffpro.fr/<span style={{color:'var(--gold)'}}>{salon?.slug}</span></div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <Btn ghost onClick={()=>{navigator.clipboard?.writeText(fullUrl).catch(()=>{});addToast('📋 Lien copié !')}}>Copier</Btn>
                  <Btn onClick={()=>window.open(`/book/${salon?.slug}`,'_blank')}>Voir la page ↗</Btn>
                </div>
              </>
            })()}
          </Card>
        </div>
      </div>
    </>
  }

  function PageParametres() {
    const [f, setF] = useState({ name:salon?.name||'', email:salon?.email||'', phone:salon?.phone||'' })
    const [saving, setSaving] = useState(false)
    const [emailModal, setEmailModal] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [emailSaving, setEmailSaving] = useState(false)

    const save = async () => {
      setSaving(true)
      try {
        await write('update_salon', { data: { name: f.name, phone: f.phone } })
        setSalon(s=>s?{...s,name:f.name,phone:f.phone}:s)
        addToast('✅ Informations sauvegardées')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    const changeEmail = async () => {
      if (!newEmail || !newEmail.includes('@')) { addToast('⚠ Email invalide'); return }
      setEmailSaving(true)
      try {
        // Mettre à jour l'email dans Supabase Auth
        const { error } = await sb.auth.updateUser({ email: newEmail })
        if (error) throw error
        // Mettre à jour l'email dans la table salons immédiatement
        await write('update_salon', { data: { email: newEmail } })
        setSalon(s=>s?{...s,email:newEmail}:s)
        setF(p=>({...p,email:newEmail}))
        setEmailModal(false)
        setNewEmail('')
        addToast('📬 Confirme le changement depuis tes deux boîtes mail')
      } catch(e:any) { addToast('❌ '+(e.message||'Erreur')) }
      setEmailSaving(false)
    }

    return <>
      <div className="g2">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Informations du compte" />
            <FRow label="Nom du salon"><Inp value={f.name} onChange={v=>setF(p=>({...p,name:v}))} /></FRow>
            <FRow label="Email">
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <Inp value={f.email} type="email" onChange={()=>{}} style={{flex:1,background:'var(--s1)',color:'var(--t2)'}} />
                <Btn ghost onClick={()=>{setNewEmail('');setEmailModal(true)}} style={{flexShrink:0,fontSize:11}}>Modifier</Btn>
              </div>
            </FRow>
            <FRow label="Téléphone"><Inp value={f.phone} onChange={v=>setF(p=>({...p,phone:v}))} /></FRow>
            <Btn onClick={save} disabled={saving} style={{marginTop:4}}>{saving?'Sauvegarde…':'Sauvegarder'}</Btn>
          </Card>
          {emailModal&&<div className="overlay"><div className="modal">
            <div className="modal-ttl">Changer l'adresse email</div>
            <div style={{fontSize:12,color:'var(--t3)',marginBottom:12}}>Un email de confirmation sera envoyé à la nouvelle adresse. Tu devras confirmer depuis les deux boîtes mail.</div>
            <FRow label="Nouvelle adresse email"><Inp type="email" placeholder="nouveau@email.fr" value={newEmail} onChange={setNewEmail} /></FRow>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
              <Btn ghost onClick={()=>setEmailModal(false)}>Annuler</Btn>
              <Btn onClick={changeEmail} disabled={emailSaving||!newEmail}>{emailSaving?'Envoi…':'Confirmer'}</Btn>
            </div>
          </div></div>}

          <Card>
            <CardHd title="Abonnement" />
            <div style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:9,padding:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Plan</span><span style={{fontWeight:600}}>CoiffPro Pro</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}><span style={{color:'var(--t2)'}}>Tarif</span><span style={{fontWeight:700}}>50€/mois</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--t2)'}}>Statut</span><span className="badge badge-ok">{salon?.status==='trial'?'Essai gratuit':'Actif'}</span></div>
              {salon?.status==='trial'&&<div style={{fontSize:11,color:'var(--t3)',marginTop:6}}>Essai jusqu'au {new Date(salon.trial_ends_at||'').toLocaleDateString('fr-FR')}</div>}
            </div>
            <Btn onClick={async ()=>{
              if(!salon?.stripe_customer_id){addToast('⚠ Aucun abonnement Stripe actif');return}
              addToast('⏳ Ouverture du portail…')
              const res=await fetch('/api/stripe/portal',{method:'POST',headers:{Authorization:`Bearer ${tokenRef.current}`}})
              const j=await res.json()
              if(j.url) window.open(j.url,'_blank')
              else addToast('❌ '+j.error)
            }}>Gérer mon abonnement →</Btn>
          </Card>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card>
            <CardHd title="Connexion SumUp" />
            {salon?.sumup_merchant_code
              ? <div style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:14}}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:4}}>✅ SumUp connecté</div>
                  <div style={{fontSize:11,color:'var(--t3)'}}>Merchant: {salon.sumup_merchant_code}</div>
                </div>
              : <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:14}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Connecter votre compte SumUp</div>
                  <a href={`/api/sumup/connect?salonId=${salon?.id}`} style={{display:'block',background:'#1a4fa0',color:'#fff',borderRadius:8,padding:'10px',textAlign:'center' as const,fontSize:13,fontWeight:600,textDecoration:'none'}}>🔵 Connecter →</a>
                </div>
            }
          </Card>
          <Card>
            <CardHd title="Sécurité" />
            <Btn ghost onClick={async()=>{
              const sb = getBrowserClient()
              const { data: { session } } = await sb.auth.getSession()
              if (!session?.user?.email) return
              await sb.auth.resetPasswordForEmail(session.user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
              })
              addToast('📬 Lien envoyé à votre email')
            }} style={{width:'100%',marginBottom:8}}>Changer mon mot de passe</Btn>
            <Btn ghost danger onClick={async()=>{await getBrowserClient().auth.signOut();router.push('/login')}} style={{width:'100%'}}>Se déconnecter</Btn>
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
          <Tgl on={true} />
        </div>
        {clients.filter(c=>c.gift_available).map(c=>(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid var(--b1)'}}>
            <span style={{flex:1,fontSize:12,fontWeight:500}}>{c.name}</span>
            <span style={{fontSize:10,color:'var(--green)',fontWeight:600}}>🎁 10ème visite</span>
            <Btn ghost onClick={()=>addToast(`📲 SMS envoyé à ${c.name}`)}>SMS →</Btn>
          </div>
        ))}
      </Card>
    </>
  }

  function PageRappels() {
    const defaults = {reminder_24h:true,confirmation:true,review_request:true,loyalty:true,reactivation:false}
    const [settings, setSettings] = useState<Record<string,boolean>>(salon?.notification_settings||defaults)
    const [saving, setSaving] = useState<string|null>(null)

    const toggle = async (key: string) => {
      const next = {...settings,[key]:!settings[key]}
      setSettings(next)
      setSaving(key)
      try {
        await write('update_salon',{data:{notification_settings:next}})
        setSalon(s=>s?{...s,notification_settings:next}:s)
        addToast(`✅ ${next[key]?'Activé':'Désactivé'}`)
      } catch(e:any){ addToast('❌ '+e.message); setSettings(settings) }
      setSaving(null)
    }

    const items=[
      {key:'reminder_24h',l:'Rappel SMS 24h avant le RDV',d:'Envoyé automatiquement la veille'},
      {key:'confirmation',l:'Confirmation de réservation',d:'Dès la réservation en ligne'},
      {key:'review_request',l:'Demande d\'avis Google',d:'2h après RDV terminé'},
      {key:'loyalty',l:'SMS fidélité 10ème visite',d:'🎁 Cadeau offert automatiquement'},
      {key:'reactivation',l:'Relance clients inactifs 30j',d:'"Vous nous manquez !" automatique'},
    ]
    return <>
      <Card style={{maxWidth:540}}>
        <CardHd title="Automatisations SMS" />
        {items.map(it=>(
          <div key={it.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--b1)'}}>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{it.l}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{it.d}</div>
            </div>
            <Tgl on={!!settings[it.key]} onChange={()=>toggle(it.key)} />
          </div>
        ))}
      </Card>
      <div style={{marginTop:10,fontSize:11,color:'var(--t3)',maxWidth:540}}>
        Les SMS sont envoyés via votre passerelle Android SMS Gateway configurée dans les paramètres serveur.
      </div>
    </>
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
        <FRow label="URL de votre page Google"><Inp value={salon?.google_link||''} onChange={()=>{}} placeholder="https://g.page/..." /></FRow>
        {salon?.google_link&&<a href={salon.google_link} target="_blank" rel="noopener" style={{display:'block',marginTop:8,fontSize:12,color:'var(--t2)',textDecoration:'underline'}}>Voir ma page Google →</a>}
      </Card>
    </div>
  }

  function PageMarketing() {
    const [showModal, setShowModal] = useState(false)
    const [campName, setCampName] = useState('')
    const [campMsg, setCampMsg] = useState('')
    const [sending, setSending] = useState(false)
    const [sendingId, setSendingId] = useState<string|null>(null)

    const SMS_MAX = 160
    const charCount = campMsg.length
    const smsCount = Math.ceil(charCount / SMS_MAX) || 1
    const costEur = (clients.length * smsCount * 0.06).toFixed(2)

    function insertVar(v:string) { setCampMsg(m => m + v) }

    async function createCampaign() {
      if (!campName.trim() || !campMsg.trim()) { addToast('⚠️ Remplissez le nom et le message'); return }
      setSending(true)
      try {
        const res = await write('create_campaign', { data: { name: campName.trim(), message: campMsg.trim() } })
        const newCamp = res.data as Campaign
        setCampaigns(prev => [newCamp, ...prev])
        setCampName(''); setCampMsg(''); setShowModal(false)
        addToast('✅ Campagne créée !')
      } catch(e:any) { addToast('❌ ' + e.message) }
      setSending(false)
    }

    async function sendCampaign(c: Campaign) {
      if (!confirm(`Envoyer "${c.name}" à ${clients.length} clients ? Coût estimé : ~${(clients.length * 0.06).toFixed(2)}€`)) return
      setSendingId(c.id)
      try {
        const res = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ type: 'campaign', campaignId: c.id }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erreur')
        setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'sent', sent_at: new Date().toISOString(), recipients_count: json.sent } : x))
        addToast(`✅ ${json.sent} SMS envoyés !`)
      } catch(e:any) { addToast('❌ ' + e.message) }
      setSendingId(null)
    }

    async function deleteCampaign(c: Campaign) {
      if (!confirm(`Supprimer la campagne "${c.name}" ?`)) return
      try {
        await write('delete_campaign', { id: c.id })
        setCampaigns(prev => prev.filter(x => x.id !== c.id))
        addToast('🗑️ Campagne supprimée')
      } catch(e:any) { addToast('❌ ' + e.message) }
    }

    const sentThisMonth = campaigns.filter(c => c.sent_at && new Date(c.sent_at).getMonth() === new Date().getMonth())
    const smsSentMonth = sentThisMonth.reduce((s,c) => s + (c.recipients_count || 0), 0)

    return <>
      <div className="g3" style={{marginBottom:12}}>
        <SC label="Clients SMS" value={clients.length} sub="dans votre base" />
        <SC label="SMS ce mois" value={smsSentMonth} sub="envoyés" />
        <SC label="Campagnes" value={campaigns.length} sub="créées" />
      </div>

      <Card>
        <CardHd title="Campagnes SMS" action="+ Nouvelle campagne" onAction={()=>setShowModal(true)} />
        {campaigns.length === 0
          ? <div style={{textAlign:'center',padding:'32px 0',color:'var(--t3)',fontSize:13}}>
              <div style={{fontSize:36,marginBottom:8}}>📨</div>
              <div style={{marginBottom:12}}>Aucune campagne pour l'instant.</div>
              <Btn onClick={()=>setShowModal(true)}>+ Créer une campagne</Btn>
            </div>
          : <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              {campaigns.map(c => (
                <div key={c.id} style={{border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{c.name}</div>
                    <div style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.message}</div>
                    <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>
                      {c.status === 'sent'
                        ? `✅ Envoyée le ${new Date(c.sent_at!).toLocaleDateString('fr-FR')} · ${c.recipients_count} destinataires`
                        : '⏳ Brouillon'}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {c.status !== 'sent' && (
                      <Btn onClick={()=>sendCampaign(c)} disabled={sendingId===c.id} style={{fontSize:11,padding:'5px 10px'}}>
                        {sendingId===c.id ? '…' : '▶ Envoyer'}
                      </Btn>
                    )}
                    <Btn ghost danger onClick={()=>deleteCampaign(c)} style={{fontSize:11,padding:'5px 10px'}}>🗑</Btn>
                  </div>
                </div>
              ))}
            </div>
        }
      </Card>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:'var(--card)',borderRadius:16,padding:24,width:'100%',maxWidth:480,boxShadow:'0 8px 40px rgba(0,0,0,.18)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:16}}>📨 Nouvelle campagne SMS</div>
              <span onClick={()=>setShowModal(false)} style={{cursor:'pointer',fontSize:20,color:'var(--t3)'}}>✕</span>
            </div>

            <FRow label="Nom de la campagne">
              <Inp placeholder="Ex : Promo été 2025" value={campName} onChange={setCampName} />
            </FRow>

            <FRow label="Message SMS">
              <div style={{marginBottom:6,display:'flex',gap:6,flexWrap:'wrap' as const}}>
                {['{prénom}','{salon}'].map(v => (
                  <span key={v} onClick={()=>insertVar(v)} style={{fontSize:10,padding:'2px 8px',border:'1px solid var(--accent)',borderRadius:20,color:'var(--accent)',cursor:'pointer'}}>{v}</span>
                ))}
              </div>
              <textarea
                value={campMsg}
                onChange={e=>setCampMsg(e.target.value)}
                placeholder="Bonjour {prénom}, profitez de -20% ce mois-ci chez {salon} ! À bientôt 🎉"
                rows={4}
                className="input"
                style={{resize:'vertical',minHeight:90,fontFamily:'inherit',fontSize:13}}
              />
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:charCount>SMS_MAX*smsCount?'var(--red)':'var(--t3)',marginTop:4}}>
                <span>{charCount} caractères · {smsCount} SMS</span>
                <span>~{costEur}€ pour {clients.length} clients</span>
              </div>
            </FRow>

            <div style={{background:'var(--bg)',border:'1px solid var(--bd)',borderRadius:10,padding:10,marginBottom:16,fontSize:11,color:'var(--t2)'}}>
              💡 <strong>{clients.length} clients</strong> recevront ce SMS. Les variables <code>{'{prénom}'}</code> et <code>{'{salon}'}</code> seront remplacées automatiquement.
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn ghost onClick={()=>setShowModal(false)}>Annuler</Btn>
              <Btn onClick={createCampaign} disabled={sending}>
                {sending ? 'Création…' : 'Créer la campagne'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  }

  function PagePaiements() {
    const paidThisMonth = appointments.filter(a=>a.paid&&new Date(a.scheduled_at).getMonth()===new Date().getMonth())
    const caMonth = paidThisMonth.reduce((s,a)=>s+(a.final_price_cents||a.price_cents),0)
    const byCash  = paidThisMonth.filter(a=>a.payment_method==='cash').reduce((s,a)=>s+(a.final_price_cents||a.price_cents),0)
    const byCard  = paidThisMonth.filter(a=>a.payment_method==='card').reduce((s,a)=>s+(a.final_price_cents||a.price_cents),0)
    const bySumup = paidThisMonth.filter(a=>a.payment_method==='sumup').reduce((s,a)=>s+(a.final_price_cents||a.price_cents),0)

    return <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div className="g2">
        <Card>
          <CardHd title="CA encaissé ce mois" />
          <div style={{fontFamily:'Georgia,serif',fontSize:36,fontWeight:700,marginBottom:4}}>{fmt(caMonth)}</div>
          <div style={{fontSize:11,color:'var(--t3)'}}>{paidThisMonth.length} paiements</div>
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
            {[['💵 Espèces',byCash],['💳 Carte',byCard],['🔵 SumUp',bySumup]].map(([l,v])=>(
              <div key={l as string} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                <span style={{color:'var(--t2)'}}>{l}</span>
                <span style={{fontWeight:600}}>{fmt(v as number)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHd title="Connexion SumUp" />
          {salon?.sumup_merchant_code
            ? <div style={{background:'#e8f7ee',border:'1px solid #b8dfc6',borderRadius:10,padding:14}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--green)',marginBottom:4}}>✅ SumUp connecté</div>
                <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>Merchant code : {salon.sumup_merchant_code}</div>
                <div style={{fontSize:12,color:'var(--t2)'}}>Vous pouvez maintenant encaisser via SumUp depuis l'agenda (bouton 💰 Encaisser).</div>
              </div>
            : <>
                <div style={{fontSize:12,color:'var(--t2)',marginBottom:12,lineHeight:1.6}}>
                  Connectez votre compte SumUp pour encaisser par carte directement depuis l'agenda.<br/>
                  <span style={{fontSize:11,color:'var(--t3)'}}>Vous serez redirigé vers SumUp pour autoriser la connexion.</span>
                </div>
                <a href={`/api/sumup/connect?salonId=${salon?.id}`}
                  style={{display:'block',background:'#1a4fa0',color:'#fff',borderRadius:8,padding:'11px',textAlign:'center' as const,fontSize:13,fontWeight:600,textDecoration:'none'}}>
                  🔵 Connecter mon compte SumUp →
                </a>
                <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
                  Sans SumUp vous pouvez quand même encaisser en espèces ou carte (sans terminal connecté).
                </div>
              </>
          }
        </Card>
      </div>

      <Card>
        <CardHd title="Derniers paiements" />
        {appointments.filter(a=>a.paid).slice(0,10).map(a=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 0',borderBottom:'1px solid var(--b1)'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{a.client?.name||'Client'}</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>{a.service?.name} · {new Date(a.scheduled_at).toLocaleDateString('fr-FR')}</div>
            </div>
            <span style={{fontSize:12,fontWeight:700}}>{fmt(a.final_price_cents||a.price_cents)}</span>
            <span style={{fontSize:10,padding:'2px 7px',borderRadius:10,background:'var(--s1)',border:'1px solid var(--b1)',color:'var(--t2)'}}>
              {a.payment_method==='cash'?'💵':a.payment_method==='card'?'💳':'🔵'} {a.payment_method||'—'}
            </span>
          </div>
        ))}
        {appointments.filter(a=>a.paid).length===0&&<div style={{textAlign:'center',padding:'20px',color:'var(--t3)',fontSize:13}}>Aucun paiement enregistré</div>}
      </Card>
    </div>
  }

  /* ── MODAL PAIEMENT ── */
  function PayModal() {
    const a = payModal!
    const [method, setMethod] = useState<'cash'|'card'|'sumup'>('cash')
    const [discType, setDiscType] = useState<''|'percent'|'fixed'>('')
    const [discVal, setDiscVal] = useState(0)
    const [saving, setSaving] = useState(false)
    const base = a.price_cents
    const finalPrice = discType==='percent'
      ? Math.round(base*(1-discVal/100))
      : discType==='fixed'
      ? Math.max(0, base - discVal*100)
      : base
    const hasSumUp = !!(salon?.sumup_merchant_code && salon?.sumup_access_token)

    const pay = async () => {
      setSaving(true)
      try {
        const res = await fetch('/api/payment', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            appointmentId: a.id,
            salonId: salon!.id,
            method,
            discountType: discType||null,
            discountValue: discType==='percent' ? discVal : discVal*100,
          })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error||'Erreur')

        // Mettre à jour le RDV localement
        setAppointments(prev=>prev.map(x=>x.id===a.id?{...x,paid:true,payment_method:method,final_price_cents:finalPrice,status:'completed'}:x))

        // Recharger le client depuis la base pour avoir visit_count/total_spent à jour
        if (a.client_id) {
          const { data: updatedClient } = await sb.from('clients').select('*').eq('id', a.client_id).single()
          if (updatedClient) {
            setClients(prev => prev.map(c => c.id === a.client_id ? updatedClient : c))
          }
        }

        addToast('✅ Paiement enregistré !')
        setPayModal(null)
      } catch(e:any) { addToast('❌ '+e.message) }
      setSaving(false)
    }

    return <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setPayModal(null)}}>
      <div className="modal">
        <div className="modal-ttl">💰 Encaisser — {a.client?.name||'Client'}</div>
        <div style={{fontSize:11,color:'var(--t3)',marginBottom:14}}>{a.service?.name} · {new Date(a.scheduled_at).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>

        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'var(--s1)',borderRadius:8,marginBottom:14}}>
          <span style={{fontSize:13,color:'var(--t2)'}}>Prix de base</span>
          <span style={{fontSize:14,fontWeight:600}}>{fmt(base)}</span>
        </div>

        <FRow label="Remise (optionnel)">
          <div style={{display:'flex',gap:8}}>
            <select className="input" value={discType} onChange={e=>setDiscType(e.target.value as any)} style={{flex:1}}>
              <option value="">Aucune remise</option>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (€)</option>
            </select>
            {discType&&<Inp type="number" placeholder={discType==='percent'?'10':'5'} value={String(discVal||'')} onChange={v=>setDiscVal(Number(v)||0)} style={{width:80}} />}
          </div>
        </FRow>

        {discType&&discVal>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'6px 12px',background:'#fff5f5',borderRadius:8,marginBottom:10,fontSize:12}}>
          <span style={{color:'var(--red)'}}>Remise appliquée</span>
          <span style={{color:'var(--red)',fontWeight:600}}>-{discType==='percent'?`${discVal}%`:fmt(discVal*100)}</span>
        </div>}

        <div style={{display:'flex',justifyContent:'space-between',padding:'12px 14px',background:finalPrice<base?'#e8f7ee':'var(--s1)',borderRadius:10,marginBottom:16,border:`1px solid ${finalPrice<base?'#b8dfc6':'var(--b1)'}`}}>
          <span style={{fontSize:15,fontWeight:600}}>Total à encaisser</span>
          <span style={{fontSize:20,fontWeight:700,color:'var(--green)'}}>{fmt(finalPrice)}</span>
        </div>

        <FRow label="Mode de paiement">
          <div style={{display:'flex',gap:8}}>
            {(['cash','card','sumup'] as const).map(m=>(
              <button key={m} onClick={()=>setMethod(m)} style={{flex:1,padding:'9px 4px',borderRadius:8,border:`2px solid ${method===m?'var(--t1)':'var(--b1)'}`,background:method===m?'var(--t1)':'var(--bg)',color:method===m?'var(--bg)':'var(--t2)',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all .12s'}}>
                {m==='cash'?'💵 Espèces':m==='card'?'💳 Carte':'🔵 SumUp'}
              </button>
            ))}
          </div>
        </FRow>

        {method==='sumup'&&!hasSumUp&&<div style={{marginTop:8,padding:'8px 12px',background:'#fdf6e6',border:'1px solid #eed898',borderRadius:8,fontSize:12,color:'#92400e'}}>
          ⚠ SumUp non connecté. <a href={`/api/sumup/connect?salonId=${salon?.id}`} style={{color:'#92400e',fontWeight:600}}>Connecter mon compte →</a>
        </div>}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:14}}>
          <Btn ghost onClick={()=>setPayModal(null)}>Annuler</Btn>
          <Btn onClick={pay} disabled={saving||(method==='sumup'&&!hasSumUp)}>
            {saving?'Traitement…':`Encaisser ${fmt(finalPrice)}`}
          </Btn>
        </div>
      </div>
    </div>
  }

  /* ── SUPPORT CHAT ── */
  function PageSupport() {
    const [msg, setMsg] = useState('')
    const [sending, setSending] = useState(false)
    const unread = supportMsgs.filter(m=>m.from_admin&&!m['read_at']).length

    const send = async () => {
      if (!msg.trim()) return
      setSending(true)
      try {
        const res = await fetch('/api/support', {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${tokenRef.current}`},
          body: JSON.stringify({ message: msg.trim() })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setSupportMsgs(prev=>[...prev, json.message])
        setMsg('')
        addToast('✅ Message envoyé à CoiffPro')
      } catch(e:any) { addToast('❌ '+e.message) }
      setSending(false)
    }

    return <>
      <Card style={{marginBottom:12,background:'#ede9fe',border:'1px solid #c4b5fd'}}>
        <div style={{fontSize:13,fontWeight:600,color:'#7c3aed',marginBottom:4}}>💬 Support CoiffPro</div>
        <div style={{fontSize:12,color:'#5b21b6'}}>Posez vos questions ici — nous répondons généralement dans l'heure.</div>
      </Card>

      <Card>
        <div style={{minHeight:320,maxHeight:420,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,marginBottom:14,padding:'4px 0'}}>
          {supportMsgs.length===0
            ? <div style={{textAlign:'center',padding:'40px 0',color:'var(--t3)',fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>💬</div>
                Aucun message pour l'instant.<br/>Posez votre première question ci-dessous.
              </div>
            : supportMsgs.map(m=>(
              <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:m.from_admin?'flex-start':'flex-end'}}>
                <div style={{maxWidth:'80%',padding:'9px 13px',borderRadius:m.from_admin?'4px 14px 14px 14px':'14px 4px 14px 14px',background:m.from_admin?'var(--s1)':'var(--t1)',color:m.from_admin?'var(--t1)':'var(--bg)',fontSize:13,lineHeight:1.5}}>
                  {m.message}
                </div>
                <div style={{fontSize:10,color:'var(--t3)',marginTop:3,padding:'0 4px'}}>
                  {m.from_admin?'CoiffPro':'Vous'} · {new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            ))
          }
        </div>
        <div style={{display:'flex',gap:8,borderTop:'1px solid var(--b1)',paddingTop:12}}>
          <textarea className="input" value={msg} onChange={e=>setMsg(e.target.value)}
            placeholder="Votre message…" rows={2}
            style={{flex:1,resize:'none',borderRadius:8,fontFamily:'inherit',fontSize:13}}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} />
          <Btn onClick={send} disabled={sending||!msg.trim()} style={{alignSelf:'flex-end',padding:'9px 16px'}}>
            {sending?'…':'Envoyer'}
          </Btn>
        </div>
        <div style={{fontSize:10,color:'var(--t3)',marginTop:6}}>Entrée pour envoyer · Maj+Entrée pour sauter une ligne</div>
      </Card>
    </>
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard':  return <PageDashboard />
      case 'agenda':     return <PageAgenda />
      case 'clients':    return <PageClients />
      case 'equipe':     return <PageEquipe />
      case 'services':   return <PageServices />
      case 'stock':      return <PageStock />
      case 'fidelite':   return <PageFidelite />
      case 'marketing':  return <PageMarketing />
      case 'paiements':  return <PagePaiements />
      case 'avis':       return <PageAvis />
      case 'rappels':    return <PageRappels />
      case 'ma-page':    return <PageMaPage />
      case 'parametres': return <PageParametres />
      case 'support':    return <PageSupport />
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
        .input:focus{border-color:var(--t2)}
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
        .mob-btn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 12px;cursor:pointer;color:var(--t2);font-size:9px;font-weight:500;flex:1;position:relative}
        .mob-btn.active{color:var(--t1)}
        .mob-btn svg{width:20px;height:20px}
      `}</style>

      <nav style={{height:48,background:'var(--bg)',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,position:'sticky',top:0,zIndex:60}}>
        <button className="hamburger" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{display:'none',background:'none',border:'none',cursor:'pointer',padding:6,color:'var(--t1)',flexDirection:'column' as const,gap:4,alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen?<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>:<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
        {salon?.logo_url
          ? <img src={salon.logo_url} alt="logo" style={{height:28,maxWidth:80,objectFit:'contain',filter:theme==='dark'?'brightness(0) invert(1)':'none'}} />
          : <span style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700}}>✂ CoiffPro</span>
        }
        <span style={{fontSize:11,color:'var(--t2)'}}>{salon?.name}</span>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:7,padding:'5px 9px',fontSize:11,cursor:'pointer',color:'var(--t1)'}}>{theme==='dark'?'☀':'🌙'}</button>
          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--t1)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,cursor:'pointer'}} onClick={()=>nav('parametres')}>{ini(salon?.name||'?')}</div>
        </div>
      </nav>

      <div className="app-layout" style={{display:'flex',height:'calc(100dvh - 48px)',overflow:'hidden'}}>
        {sidebarOpen&&<div style={{position:'fixed',top:48,left:0,right:0,bottom:0,background:'rgba(0,0,0,.4)',zIndex:49}} onClick={()=>setSidebarOpen(false)} />}

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
                  {it.id==='stock'&&lowStock.length>0&&<span style={{fontSize:9,background:'var(--red)',color:'#fff',borderRadius:8,padding:'1px 5px',fontWeight:700}}>{lowStock.length}</span>}
                  {it.id==='support'&&supportMsgs.filter(m=>m.from_admin&&!m.read_at).length>0&&<span style={{fontSize:9,background:'var(--purple)',color:'#fff',borderRadius:8,padding:'1px 5px',fontWeight:700}}>{supportMsgs.filter(m=>m.from_admin&&!m.read_at).length}</span>}
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

        <main style={{flex:1,background:'var(--s1)',display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          <div style={{height:46,background:'var(--bg)',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',padding:'0 16px',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:14,fontWeight:600}}>{PAGE_TITLES[page]||page}</span>
          </div>
          <div style={{flex:1,padding:'14px 16px',overflowY:'auto'}}>{renderPage()}</div>
        </main>
      </div>

      <nav className="mob-nav">
        {MOBILE_NAV.map(it=>(
          <div key={it.id} className={`mob-btn${page===it.id?' active':''}`} onClick={()=>nav(it.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={page===it.id?2:1.5}>
              {it.icon.split(' ').map((d,i)=><path key={i} d={d} />)}
            </svg>
            {it.label}
            {it.id==='stock'&&lowStock.length>0&&<span style={{position:'absolute',top:4,right:'calc(50% - 18px)',fontSize:8,background:'var(--red)',color:'#fff',borderRadius:6,padding:'0 4px'}}>{lowStock.length}</span>}
          </div>
        ))}
      </nav>

      {toast&&<div style={{position:'fixed',bottom:80,right:16,background:'var(--t1)',color:'#fff',borderRadius:10,padding:'10px 14px',fontSize:12,zIndex:999,maxWidth:300,lineHeight:1.5}}>{toast}</div>}
      {payModal&&<PayModal />}
    </div>
  )
}
