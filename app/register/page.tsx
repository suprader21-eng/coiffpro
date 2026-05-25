'use client'
import { useState } from 'react'

type FormData = {
  // Étape 1 — Compte
  email: string; password: string; ownerName: string; phone: string
  // Étape 2 — Salon
  salonName: string; address: string; city: string; postalCode: string
  description: string; instagram: string; website: string
  // Étape 3 — Horaires
  hours: { day: string; open: boolean; from: string; to: string }[]
  // Étape 4 — Services
  services: { name: string; duration: number; price: number; category: string; active: boolean }[]
  // Étape 5 — Équipe
  employees: { name: string; role: string }[]
  // Étape 6 — Plan
  plan: 'starter' | 'pro'
}

const INITIAL: FormData = {
  email:'', password:'', ownerName:'', phone:'',
  salonName:'', address:'', city:'', postalCode:'', description:'', instagram:'', website:'',
  hours:[
    { day:'Lundi',    open:false, from:'09:00', to:'19:00' },
    { day:'Mardi',    open:true,  from:'09:00', to:'19:00' },
    { day:'Mercredi', open:true,  from:'09:00', to:'19:00' },
    { day:'Jeudi',    open:true,  from:'09:00', to:'20:00' },
    { day:'Vendredi', open:true,  from:'09:00', to:'20:00' },
    { day:'Samedi',   open:true,  from:'08:30', to:'18:00' },
    { day:'Dimanche', open:false, from:'09:00', to:'17:00' },
  ],
  services:[
    { name:'Coupe Femme',   duration:45,  price:25, category:'Coupes',  active:true },
    { name:'Coupe Homme',   duration:30,  price:18, category:'Coupes',  active:true },
    { name:'Barbe',         duration:20,  price:12, category:'Barbier', active:true },
    { name:'Coloration',    duration:90,  price:55, category:'Couleurs',active:true },
    { name:'Brushing',      duration:35,  price:20, category:'Soins',   active:true },
  ],
  employees:[{ name:'', role:'Gérant(e)' }],
  plan:'starter',
}

const STEPS = [
  { n:1, label:'Votre compte',   icon:'👤' },
  { n:2, label:'Votre salon',    icon:'✂' },
  { n:3, label:'Horaires',       icon:'🕐' },
  { n:4, label:'Services',       icon:'📋' },
  { n:5, label:'Équipe',         icon:'👥' },
  { n:6, label:'Votre plan',     icon:'💳' },
]

const Lb = ({ children }: { children: React.ReactNode }) => (
  <label style={{fontSize:10,color:'#666',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:4}}>{children}</label>
)
const In = ({ value, onChange, placeholder, type='text' }: { value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) => (
  <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
    style={{width:'100%',background:'#fff',border:'1px solid #d0d0d0',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'#111',marginBottom:10}} />
)

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const up = (key: keyof FormData, val: any) => setForm(f => ({...f, [key]: val}))

  const addService = () => up('services', [...form.services, { name:'', duration:30, price:20, category:'Coupes', active:true }])
  const removeService = (i: number) => up('services', form.services.filter((_,j)=>j!==i))
  const updService = (i: number, field: string, val: any) => up('services', form.services.map((s,j)=>j===i?{...s,[field]:val}:s))

  const addEmployee = () => up('employees', [...form.employees, { name:'', role:'Coiffeur(se)' }])
  const removeEmployee = (i: number) => up('employees', form.employees.filter((_,j)=>j!==i))
  const updEmployee = (i: number, field: string, val: string) => up('employees', form.employees.map((e,j)=>j===i?{...e,[field]:val}:e))

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          ownerName: form.ownerName,
          phone: form.phone,
          salonName: form.salonName,
          city: form.city,
          address: form.address,
          postalCode: form.postalCode,
          description: form.description,
          instagram: form.instagram,
          hours: form.hours.map((h, i) => ({
            day_index: i, day_name: h.day,
            is_open: h.open, open_time: h.from, close_time: h.to
          })),
          services: form.services.filter(s => s.name),
          employees: form.employees.filter(e => e.name),
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Erreur lors de la création du compte')
        setLoading(false)
        return
      }
      // Rediriger vers Stripe Checkout (essai 14j + carte enregistrée)
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        window.location.href = '/dashboard?welcome=1'
      }
    } catch (err) {
      alert('Erreur réseau. Veuillez réessayer.')
      setLoading(false)
    }
  }

  if (done) return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Outfit,-apple-system,sans-serif'}}>
      <div style={{textAlign:'center',maxWidth:480,padding:32}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'#e8f7ee',border:'2px solid #1a9648',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 20px'}}>✓</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:700,marginBottom:10}}>Bienvenue sur Glowify !</h1>
        <p style={{fontSize:14,color:'#666',lineHeight:1.7,marginBottom:24}}>
          Votre espace <strong>{form.salonName}</strong> a été créé avec succès.<br/>
          Votre page de réservation est en ligne et votre essai gratuit 14 jours commence maintenant.
        </p>
        <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:10,padding:'14px 18px',marginBottom:20,textAlign:'left'}}>
          <div style={{fontSize:11,color:'#aaa',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:8}}>Votre lien de réservation</div>
          <div style={{fontSize:14,fontWeight:600,color:'#111',wordBreak:'break-all'}}>coiffpro.fr/book/{form.salonName.toLowerCase().replace(/\s+/g,'-')}</div>
          <div style={{fontSize:11,color:'#aaa',marginTop:6}}>Partagez-le sur Instagram, Google Maps, votre carte de visite</div>
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button onClick={()=>window.location.href='/dashboard'} style={{background:'#111',color:'#fff',border:'none',borderRadius:9,padding:'12px 24px',fontSize:13,fontWeight:600,cursor:'pointer'}}>Accéder à mon dashboard →</button>
          <button onClick={()=>window.open(`/book/${form.salonName.toLowerCase().replace(/\s+/g,'-')}`,'_blank')} style={{background:'#fff',color:'#111',border:'1px solid #d0d0d0',borderRadius:9,padding:'12px 18px',fontSize:13,cursor:'pointer'}}>Voir ma page ↗</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',fontFamily:'Outfit,-apple-system,sans-serif'}}>

      {/* Header */}
      <header style={{background:'#fff',borderBottom:'1px solid #e8e8e8',height:52,display:'flex',alignItems:'center',padding:'0 24px',gap:12}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:19,fontWeight:700}}>✂ Glowify</span>
        <span style={{fontSize:12,color:'#aaa',marginLeft:4}}>Inscription</span>
        <a href="/login" style={{marginLeft:'auto',fontSize:12,color:'#666',textDecoration:'none'}}>Déjà un compte ? Se connecter →</a>
      </header>

      <div style={{maxWidth:640,margin:'0 auto',padding:'32px 24px 64px'}}>

        {/* Titre */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,marginBottom:6}}>Créez votre espace salon</h1>
          <p style={{fontSize:14,color:'#666'}}>14 jours gratuits · Sans carte bancaire · 5 minutes pour tout configurer</p>
        </div>

        {/* Steps bar */}
        <div style={{display:'flex',gap:0,marginBottom:32,background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:4,overflowX:'auto'}}>
          {STEPS.map((s,i) => (
            <div key={s.n} onClick={()=>s.n<step&&setStep(s.n)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 4px',borderRadius:9,background:step===s.n?'#111':'transparent',cursor:s.n<step?'pointer':'default',transition:'background .15s',minWidth:80}}>
              <span style={{fontSize:16}}>{s.icon}</span>
              <span style={{fontSize:10,fontWeight:step===s.n?600:400,color:step===s.n?'#fff':'#888',textAlign:'center',whiteSpace:'nowrap'}}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:14,padding:28}}>

          {/* ── ÉTAPE 1 : Compte ── */}
          {step===1 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:18}}>👤 Votre compte</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <div><Lb>Prénom & Nom</Lb><In value={form.ownerName} onChange={v=>up('ownerName',v)} placeholder="Sarah Martin" /></div>
              <div><Lb>Téléphone</Lb><In value={form.phone} onChange={v=>up('phone',v)} placeholder="06 12 34 56 78" type="tel" /></div>
            </div>
            <Lb>Adresse email</Lb><In value={form.email} onChange={v=>up('email',v)} placeholder="sarah@monsalon.fr" type="email" />
            <Lb>Mot de passe</Lb><In value={form.password} onChange={v=>up('password',v)} placeholder="Minimum 8 caractères" type="password" />
          </>}

          {/* ── ÉTAPE 2 : Salon ── */}
          {step===2 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:18}}>✂ Votre salon</h2>
            <Lb>Nom du salon</Lb><In value={form.salonName} onChange={v=>up('salonName',v)} placeholder="Salon Sarah" />
            <Lb>Description (affichée sur votre page publique)</Lb>
            <textarea value={form.description} onChange={e=>up('description',e.target.value)} placeholder="Présentez votre salon en quelques mots…"
              style={{width:'100%',background:'#fff',border:'1px solid #d0d0d0',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',color:'#111',resize:'none',height:80,marginBottom:10}} />
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'0 12px'}}>
              <div><Lb>Adresse</Lb><In value={form.address} onChange={v=>up('address',v)} placeholder="12 rue du Faubourg" /></div>
              <div><Lb>Code postal</Lb><In value={form.postalCode} onChange={v=>up('postalCode',v)} placeholder="34000" /></div>
            </div>
            <Lb>Ville</Lb><In value={form.city} onChange={v=>up('city',v)} placeholder="Montpellier" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px'}}>
              <div><Lb>Instagram (optionnel)</Lb><In value={form.instagram} onChange={v=>up('instagram',v)} placeholder="@salon.sarah" /></div>
              <div><Lb>Site web (optionnel)</Lb><In value={form.website} onChange={v=>up('website',v)} placeholder="www.salon-sarah.fr" /></div>
            </div>
          </>}

          {/* ── ÉTAPE 3 : Horaires ── */}
          {step===3 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:18}}>🕐 Horaires d'ouverture</h2>
            {form.hours.map((h,i) => (
              <div key={h.day} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                <span style={{width:80,fontSize:13,fontWeight:500}}>{h.day}</span>
                <div style={{width:32,height:18,borderRadius:9,cursor:'pointer',position:'relative',background:h.open?'#111':'#d0d0d0',transition:'background .2s',flexShrink:0}}
                  onClick={()=>up('hours',form.hours.map((x,j)=>j===i?{...x,open:!x.open}:x))}>
                  <div style={{position:'absolute',width:12,height:12,background:'#fff',borderRadius:'50%',top:3,left:h.open?17:3,transition:'left .2s'}} />
                </div>
                {h.open ? <>
                  <input type="time" value={h.from} onChange={e=>up('hours',form.hours.map((x,j)=>j===i?{...x,from:e.target.value}:x))}
                    style={{border:'1px solid #d0d0d0',borderRadius:7,padding:'5px 8px',fontSize:12,background:'#fff'}} />
                  <span style={{fontSize:12,color:'#aaa'}}>–</span>
                  <input type="time" value={h.to} onChange={e=>up('hours',form.hours.map((x,j)=>j===i?{...x,to:e.target.value}:x))}
                    style={{border:'1px solid #d0d0d0',borderRadius:7,padding:'5px 8px',fontSize:12,background:'#fff'}} />
                </> : <span style={{fontSize:12,color:'#aaa'}}>Fermé</span>}
              </div>
            ))}
          </>}

          {/* ── ÉTAPE 4 : Services ── */}
          {step===4 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:4}}>📋 Vos services & tarifs</h2>
            <p style={{fontSize:12,color:'#888',marginBottom:16}}>Modifiables à tout moment depuis votre dashboard</p>
            <div style={{background:'#f9f9f9',border:'1px solid #e8e8e8',borderRadius:8,padding:'8px 0',marginBottom:12}}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 80px 32px',gap:8,padding:'4px 12px',marginBottom:4}}>
                {['Prestation','Catégorie','Durée (min)','Prix (€)',''].map(h=><div key={h} style={{fontSize:9,color:'#aaa',textTransform:'uppercase',letterSpacing:'.06em'}}>{h}</div>)}
              </div>
              {form.services.map((s,i) => (
                <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 80px 80px 32px',gap:8,padding:'6px 12px',borderTop:'1px solid #f0f0f0',alignItems:'center'}}>
                  <input value={s.name} onChange={e=>updService(i,'name',e.target.value)} placeholder="Nom du service"
                    style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 8px',fontSize:12,background:'#fff',fontFamily:'inherit'}} />
                  <select value={s.category} onChange={e=>updService(i,'category',e.target.value)}
                    style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 8px',fontSize:12,background:'#fff'}}>
                    {['Coupes','Couleurs','Barbier','Soins','Forfaits'].map(c=><option key={c}>{c}</option>)}
                  </select>
                  <input type="number" value={s.duration} onChange={e=>updService(i,'duration',+e.target.value)}
                    style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 8px',fontSize:12,background:'#fff',textAlign:'center'}} />
                  <input type="number" value={s.price} onChange={e=>updService(i,'price',+e.target.value)}
                    style={{border:'1px solid #e0e0e0',borderRadius:6,padding:'6px 8px',fontSize:12,background:'#fff',textAlign:'center'}} />
                  <button onClick={()=>removeService(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#ccc',fontSize:16}}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={addService} style={{width:'100%',padding:'9px',background:'#fafafa',border:'1px dashed #d0d0d0',borderRadius:8,fontSize:12,color:'#888',cursor:'pointer'}}>+ Ajouter un service</button>
          </>}

          {/* ── ÉTAPE 5 : Équipe ── */}
          {step===5 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:4}}>👥 Votre équipe</h2>
            <p style={{fontSize:12,color:'#888',marginBottom:16}}>Les collaborateurs seront affichés sur votre page publique</p>
            {form.employees.map((e,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 32px',gap:10,marginBottom:10,alignItems:'end'}}>
                <div>
                  {i===0&&<Lb>Nom complet</Lb>}
                  <input value={e.name} onChange={ev=>updEmployee(i,'name',ev.target.value)} placeholder={i===0?"Votre nom":"Prénom Nom"}
                    style={{width:'100%',border:'1px solid #d0d0d0',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',background:'#fff'}} />
                </div>
                <div>
                  {i===0&&<Lb>Rôle / Spécialité</Lb>}
                  <input value={e.role} onChange={ev=>updEmployee(i,'role',ev.target.value)} placeholder="Coloriste, Barbier…"
                    style={{width:'100%',border:'1px solid #d0d0d0',borderRadius:8,padding:'9px 12px',fontSize:13,fontFamily:'inherit',background:'#fff'}} />
                </div>
                {i>0 && <button onClick={()=>removeEmployee(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#ccc',fontSize:18,paddingBottom:2}}>✕</button>}
                {i===0 && <div />}
              </div>
            ))}
            <button onClick={addEmployee} style={{width:'100%',padding:'9px',background:'#fafafa',border:'1px dashed #d0d0d0',borderRadius:8,fontSize:12,color:'#888',cursor:'pointer',marginTop:4}}>+ Ajouter un collaborateur</button>
          </>}

          {/* ── ÉTAPE 6 : Plan ── */}
          {step===6 && <>
            <h2 style={{fontSize:17,fontWeight:600,marginBottom:4}}>💳 Votre abonnement</h2>
            <p style={{fontSize:12,color:'#888',marginBottom:20}}>14 jours gratuits · Sans engagement · Sans carte bancaire</p>
            <div style={{border:'2px solid #1a1a1a',borderRadius:14,padding:22,marginBottom:16,position:'relative'}}>
              <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 14px',borderRadius:100,whiteSpace:'nowrap'}}>
                Glowify Pro — Tout inclus
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:16}}>
                <span style={{fontFamily:'Georgia,serif',fontSize:40,fontWeight:700}}>50€</span>
                <span style={{fontSize:13,color:'#aaa'}}>/mois</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {['Page de réservation personnalisée','Agenda en ligne','Clients illimités (CRM)','Rappels SMS automatiques','Programme fidélité','Campagnes SMS','Statistiques','Paiement SumUp intégré','Multi-collaborateurs','Support en français en 2h'].map(f=>(
                  <div key={f} style={{fontSize:12,color:'#444',display:'flex',alignItems:'center',gap:5}}>
                    <span style={{color:'#1a9648',fontWeight:700,flexShrink:0}}>✓</span>{f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{background:'#fafafa',border:'1px solid #e8e8e8',borderRadius:9,padding:'12px 14px',fontSize:12,color:'#888',textAlign:'center'}}>
              Aucune carte bancaire requise pour l'essai · Résiliation en 1 clic
            </div>
          </>}

          {/* Navigation */}
          <div style={{display:'flex',justifyContent:'space-between',marginTop:24,paddingTop:16,borderTop:'1px solid #f0f0f0'}}>
            {step>1
              ? <button onClick={()=>setStep(s=>s-1 as any)} style={{background:'#fff',color:'#111',border:'1px solid #d0d0d0',borderRadius:9,padding:'10px 20px',fontSize:13,cursor:'pointer'}}>← Retour</button>
              : <div/>
            }
            {step<6
              ? <button onClick={()=>setStep(s=>s+1 as any)} style={{background:'#111',color:'#fff',border:'none',borderRadius:9,padding:'11px 24px',fontSize:13,fontWeight:600,cursor:'pointer'}}>Continuer →</button>
              : <button onClick={submit} disabled={loading} style={{background:'#111',color:'#fff',border:'none',borderRadius:9,padding:'11px 24px',fontSize:13,fontWeight:600,cursor:'pointer',opacity:loading?.7:1}}>
                  {loading ? 'Création en cours…' : '🚀 Créer mon espace →'}
                </button>
            }
          </div>
          {/* Progress */}
          <div style={{marginTop:12,height:3,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#111',width:`${(step/6)*100}%`,transition:'width .3s',borderRadius:2}} />
          </div>
          <div style={{textAlign:'right',fontSize:10,color:'#aaa',marginTop:4}}>Étape {step}/6</div>
        </div>
      </div>
    </div>
  )
}
