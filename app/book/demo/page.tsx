'use client'
import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ini = (n:string) => n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
const fmtP = (p:number) => `${p}€`
const fmtD = (m:number) => m<60?`${m} min`:`${Math.floor(m/60)}h${m%60?m%60+'min':''}`

const S = {
  name:"Salon Sarah", desc:"Salon de coiffure & barbier au cœur de Montpellier. Réservation en ligne 24h/24. Coupe, coloration, balayage, barbe.", 
  address:"12 rue Foch", city:"Montpellier", phone:"04 67 12 34 56", email:"contact@salonsarah.fr",
  ig:"@salonsarah_mtp", primary:"#1a1a1a", accent:"#c8a96e",
  hours:[
    {day:'Lundi',open:false},{day:'Mardi',open:true,from:'09:00',to:'19:00'},
    {day:'Mercredi',open:true,from:'09:00',to:'19:00'},{day:'Jeudi',open:true,from:'09:00',to:'20:00'},
    {day:'Vendredi',open:true,from:'09:00',to:'20:00'},{day:'Samedi',open:true,from:'08:30',to:'18:00'},
    {day:'Dimanche',open:false}
  ],
  employees:[
    {id:'1',name:'Sarah M.',role:'Gérante · Coloriste',color:'#c8a96e',rating:4.9,reviews:127,bio:'Spécialiste colorations et balayages depuis 10 ans.'},
    {id:'2',name:'Karim D.',role:'Coiffeur · Barbier',color:'#4a9fe8',rating:4.8,reviews:84,bio:'Expert coupes modernes et dégradés.'},
    {id:'3',name:'Léa R.',role:'Coiffeuse',color:'#9a6ee8',rating:4.7,reviews:62,bio:'Passionnée de coupes féminines et soins.'},
  ],
  services:[
    {id:'1',name:'Coupe Femme',cat:'Coupes',dur:45,price:25,desc:'Ciseau · Pointes ou changement'},
    {id:'2',name:'Coupe Homme',cat:'Coupes',dur:30,price:18,desc:'Ciseau ou tondeuse'},
    {id:'3',name:'Coupe Enfant',cat:'Coupes',dur:25,price:14,desc:'Moins de 12 ans'},
    {id:'4',name:'Barbe',cat:'Barbier',dur:25,price:18,desc:'Taille · Contour · Lame chaude'},
    {id:'5',name:'Coupe + Barbe',cat:'Barbier',dur:55,price:32,desc:'Le combo parfait'},
    {id:'6',name:'Coloration',cat:'Couleurs',dur:90,price:55,desc:'Couleur pleine · Repousse'},
    {id:'7',name:'Balayage',cat:'Couleurs',dur:120,price:75,desc:'Californien · Ombré'},
    {id:'8',name:'Brushing',cat:'Coiffages',dur:35,price:22,desc:'Lissage · Volume · Naturel'},
    {id:'9',name:'Mèches',cat:'Couleurs',dur:110,price:65,desc:'Fines ou larges'},
    {id:'10',name:'Soin Kératine',cat:'Soins',dur:90,price:65,desc:'Lissage brésilien'},
    {id:'11',name:'Coupe + Brushing',cat:'Forfaits',dur:75,price:44,desc:'Le duo parfait'},
    {id:'12',name:'Coupe + Colo',cat:'Forfaits',dur:120,price:72,desc:'Transformation complète'},
  ],
  reviews:[
    {name:'Marie D.',emp:'Sarah M.',stars:5,txt:'Meilleure coloriste de Montpellier ! Résultat absolument parfait, je reviens depuis 3 ans.'},
    {name:'Julien M.',emp:'Karim D.',stars:5,txt:'Dégradé impeccable, Karim est un artiste. L\'ambiance est top.'},
    {name:'Sophie R.',emp:'Léa R.',stars:5,txt:'Léa a transformé mes cheveux ! Coupe parfaite, elle a compris exactement ce que je voulais.'},
    {name:'Lucas B.',emp:'Karim D.',stars:5,txt:'Barbe nickel, rapport qualité/prix excellent. Je viens toutes les 3 semaines.'},
  ]
}

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
const TAKEN = [1,3,7,10]

function Stars({n,size=12}:{n:number;size?:number}) {
  return <span style={{color:'#c8a96e',fontSize:size}}>{'★'.repeat(Math.round(n))}{'☆'.repeat(5-Math.round(n))}</span>
}

export default function DemoPage() {
  const [view, setView] = useState<'page'|'booking'>('page')
  const [step, setStep] = useState<1|2|3|4>(1)
  const [selSvc, setSelSvc] = useState<typeof S.services[0]|null>(null)
  const [selEmp, setSelEmp] = useState<typeof S.employees[0]|null>(null)
  const [dateIdx, setDateIdx] = useState(0)
  const [slot, setSlot] = useState<string|null>(null)
  const [form, setForm] = useState({firstName:'',lastName:'',phone:'',email:''})
  const [visits, setVisits] = useState(7)

  const T = S.primary, A = S.accent
  const cats = [...new Set(S.services.map(s=>s.cat))]
  const dates = Array.from({length:7},(_,i)=>addDays(new Date(),i+1))

  const reset = () => { setStep(1);setSelSvc(null);setSelEmp(null);setSlot(null);setForm({firstName:'',lastName:'',phone:'',email:''}) }

  /* ═══ BOOKING FLOW ═══ */
  if (view==='booking') return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .slot-btn{padding:10px 4px;text-align:center;font-size:13px;border-radius:10px;cursor:pointer;transition:all .12s;font-family:inherit;font-weight:500}
        .slot-btn:hover:not(:disabled){border-color:${T}!important;color:${T}!important}
      `}</style>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'#fff',borderBottom:'1px solid #f0f0f0',height:54,display:'flex',alignItems:'center',padding:'0 20px'}}>
        <button onClick={()=>{setView('page');reset()}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#888',fontFamily:'inherit',display:'flex',alignItems:'center',gap:6}}>← Retour</button>
        <div style={{flex:1,textAlign:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:700}}>✂ {S.name}</div>
        <a href="/register" style={{fontSize:11,color:A,fontWeight:600,whiteSpace:'nowrap'}}>Créer mon espace →</a>
      </nav>
      <div style={{maxWidth:600,margin:'0 auto',padding:'24px 20px 60px'}}>
        {/* Steps */}
        {step<4&&<div style={{display:'flex',alignItems:'center',marginBottom:24}}>
          {['Service','Coiffeur','Date & Heure','Infos'].map((l,i)=>{
            const s=i+1,done=s<step,active=s===step
            return <div key={l} style={{display:'flex',alignItems:'center',flex:i<3?1:0}}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,cursor:done?'pointer':'default'}} onClick={()=>done&&setStep(s as any)}>
                <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,background:done||active?T:'#f0f0f0',color:done||active?'#fff':'#aaa',boxShadow:active?`0 0 0 4px ${T}22`:undefined}}>{done?'✓':s}</div>
                <span style={{fontSize:10,color:active?T:'#ccc',fontWeight:active?600:400,whiteSpace:'nowrap'}}>{l}</span>
              </div>
              {i<3&&<div style={{flex:1,height:1,background:done?T:'#e8e8e8',margin:'0 6px',marginBottom:16}}/>}
            </div>
          })}
        </div>}

        {/* Step 1: Service */}
        {step===1&&<div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Quelle prestation ?</h2>
          {cats.map(cat=><div key={cat} style={{marginBottom:16}}>
            <div style={{fontSize:10,fontWeight:700,color:'#ccc',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>{cat}<div style={{flex:1,height:1,background:'#f0f0f0'}}/></div>
            {S.services.filter(s=>s.cat===cat).map(s=>(
              <div key={s.id} onClick={()=>{setSelSvc(s);setStep(2)}}
                style={{display:'flex',alignItems:'center',padding:'12px 14px',border:`1.5px solid ${selSvc?.id===s.id?T:'#f0f0f0'}`,borderRadius:11,cursor:'pointer',marginBottom:7,background:selSvc?.id===s.id?`${T}06`:'#fff',transition:'all .15s'}}>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500}}>{s.name}</div><div style={{fontSize:11,color:'#aaa'}}>{s.desc} · {fmtD(s.dur)}</div></div>
                <div style={{fontSize:18,fontWeight:700,color:A}}>{fmtP(s.price)}</div>
              </div>
            ))}
          </div>)}
        </div>}

        {/* Step 2: Employé */}
        {step===2&&<div>
          <button onClick={()=>setStep(1)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
          {selSvc&&<div style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:10,padding:'10px 14px',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{fontSize:13,fontWeight:500}}>{selSvc.name}</div><div style={{fontSize:11,color:'#aaa'}}>{fmtD(selSvc.dur)}</div></div>
            <div style={{fontSize:17,fontWeight:700,color:A}}>{fmtP(selSvc.price)}</div>
          </div>}
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Avec qui ?</h2>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div onClick={()=>{setSelEmp(null);setStep(3)}} style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:'1.5px solid #f0f0f0',borderRadius:12,cursor:'pointer',background:'#e8f7ee'}}>
              <div style={{width:46,height:46,borderRadius:'50%',background:'#3dba6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>★</div>
              <div><div style={{fontSize:14,fontWeight:600}}>Premier disponible</div><div style={{fontSize:11,color:'#1a9648'}}>Meilleur créneau parmi toute l'équipe</div></div>
            </div>
            {S.employees.map(e=>(
              <div key={e.id} onClick={()=>{setSelEmp(e);setStep(3)}}
                style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:`1.5px solid ${selEmp?.id===e.id?T:'#f0f0f0'}`,borderRadius:12,cursor:'pointer',transition:'all .15s',background:selEmp?.id===e.id?`${T}06`:'#fff'}}>
                <div style={{width:46,height:46,borderRadius:'50%',background:e.color+'20',color:e.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,flexShrink:0}}>{ini(e.name)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{e.name}</div>
                  <div style={{fontSize:11,color:'#aaa',marginBottom:4}}>{e.role}</div>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><Stars n={e.rating} size={11}/><span style={{fontSize:11,fontWeight:600}}>{e.rating}</span><span style={{fontSize:10,color:'#bbb'}}>({e.reviews})</span></div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        </div>}

        {/* Step 3: Date + Slot */}
        {step===3&&<div>
          <button onClick={()=>setStep(2)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
          <div style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:11,padding:'11px 14px',marginBottom:18,display:'flex',gap:10,alignItems:'center'}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:(selEmp?.color||'#3dba6f')+'20',color:selEmp?.color||'#3dba6f',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{selEmp?ini(selEmp.name):'★'}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{selSvc?.name}</div><div style={{fontSize:11,color:'#aaa'}}>avec {selEmp?.name||'Premier disponible'}</div></div>
            <div style={{fontSize:16,fontWeight:700,color:A}}>{selSvc&&fmtP(selSvc.price)}</div>
          </div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Quand ?</h2>
          <div style={{display:'flex',gap:6,marginBottom:18,overflowX:'auto' as const,paddingBottom:4}}>
            {dates.map((d,i)=>(
              <div key={i} onClick={()=>{setDateIdx(i);setSlot(null)}}
                style={{flexShrink:0,width:64,borderRadius:11,border:`1.5px solid ${i===dateIdx?T:'#f0f0f0'}`,background:i===dateIdx?T:'#fff',cursor:'pointer',padding:'8px 4px',textAlign:'center' as const,transition:'all .15s'}}>
                <div style={{fontSize:10,color:i===dateIdx?'rgba(255,255,255,.6)':'#bbb',textTransform:'capitalize' as const}}>{format(d,'EEE',{locale:fr})}</div>
                <div style={{fontSize:20,fontWeight:700,color:i===dateIdx?'#fff':T,lineHeight:1.2}}>{format(d,'d')}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:20}}>
            {SLOTS.map((sl,i)=>(
              <button key={sl} disabled={TAKEN.includes(i)} className="slot-btn"
                onClick={()=>setSlot(sl)}
                style={{border:`1.5px solid ${slot===sl?T:TAKEN.includes(i)?'#f5f5f5':'#f0f0f0'}`,background:slot===sl?T:TAKEN.includes(i)?'#fafafa':'#fff',color:slot===sl?'#fff':TAKEN.includes(i)?'#ddd':T,opacity:TAKEN.includes(i)?.4:1,cursor:TAKEN.includes(i)?'not-allowed':'pointer'}}>
                {sl}
              </button>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            {slot
              ? <button onClick={()=>setStep(4)} style={{background:T,color:'#fff',border:'none',borderRadius:10,padding:'13px 28px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Continuer →</button>
              : <div style={{background:'#f0f0f0',color:'#ccc',borderRadius:10,padding:'13px 28px',fontSize:14,fontWeight:600}}>Choisissez un horaire</div>
            }
          </div>
        </div>}

        {/* Step 4: Infos */}
        {step===4&&<div>
          <button onClick={()=>setStep(3)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:12,fontFamily:'inherit',marginBottom:14,padding:0}}>← Retour</button>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,marginBottom:16}}>Vos informations</h2>
          <div style={{background:`${T}06`,border:`1px solid ${T}22`,borderRadius:11,padding:'12px 14px',marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['📅',format(dates[dateIdx],'EEEE d MMMM',{locale:fr})],['⏰',slot||''],['✂',selSvc?.name||''],['👤',selEmp?.name||'Premier disponible']].map(([ic,v])=>(
              <div key={ic} style={{background:'#fff',borderRadius:8,padding:'8px 10px'}}>
                <div style={{fontSize:9,color:'#bbb',marginBottom:2}}>{ic}</div>
                <div style={{fontSize:12,fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Prénom *','Marie','firstName'],['Nom','Dupont','lastName']] .map(([l,p,k])=>(
                <div key={k}><label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:4}}>{l}</label>
                <input value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}
                  style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:9,padding:'10px 12px',fontSize:13,fontFamily:'inherit',outline:'none'}}
                  onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'}/></div>
              ))}
            </div>
            <div><label style={{fontSize:10,fontWeight:600,color:'#888',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:4}}>Téléphone * (rappel SMS)</label>
            <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06 12 34 56 78" type="tel"
              style={{width:'100%',background:'#fff',border:'1.5px solid #f0f0f0',borderRadius:9,padding:'10px 12px',fontSize:13,fontFamily:'inherit',outline:'none'}}
              onFocus={e=>e.target.style.borderColor=T} onBlur={e=>e.target.style.borderColor='#f0f0f0'}/></div>
          </div>
          <button onClick={()=>{setVisits(v=>v+1);setStep(1 as any);setView('confirm' as any)}} disabled={!form.firstName||!form.phone}
            style={{width:'100%',background:form.firstName&&form.phone?T:'#f0f0f0',color:form.firstName&&form.phone?'#fff':'#ccc',border:'none',borderRadius:11,padding:'14px',fontSize:15,fontWeight:700,cursor:form.firstName&&form.phone?'pointer':'not-allowed',marginTop:18,fontFamily:'inherit'}}>
            Confirmer mon RDV →
          </button>
          <p style={{textAlign:'center',fontSize:11,color:'#ccc',marginTop:8}}>Annulation gratuite jusqu'à 24h avant</p>
        </div>}

        {/* Loyalty */}
        <div style={{background:'linear-gradient(135deg,#111,#222)',borderRadius:14,padding:'18px 20px',marginTop:28,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:16}}>
          <div>
            <div style={{fontSize:10,color:'rgba(255,255,255,.35)',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:8}}>Carte fidélité</div>
            <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:12}}>{form.firstName?`${form.firstName} ${form.lastName}`:'Votre fidélité'}</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap' as const}}>
              {Array.from({length:10},(_,j)=>(
                <div key={j} style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${j<visits?'#c8a96e':'rgba(255,255,255,.15)'}`,background:j<visits?(visits>=10&&j===9?'#1a9648':'#c8a96e'):'transparent'}}/>
              ))}
            </div>
          </div>
          <div style={{textAlign:'right' as const}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:700,color:'#c8a96e'}}>{Math.min(visits,10)}/10</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:2}}>coupes effectuées</div>
            {visits>=10
              ? <div style={{marginTop:8,background:'rgba(26,150,72,.25)',border:'1px solid rgba(26,150,72,.4)',borderRadius:7,padding:'5px 10px',fontSize:11,color:'#3dba6f'}}>🎁 Produit offert disponible !</div>
              : visits>=7&&<div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:6}}>Plus que {10-visits} coupe{10-visits>1?'s':''} pour un cadeau ✨</div>
            }
          </div>
        </div>
      </div>
    </div>
  )

  /* ═══ PAGE PUBLIQUE ═══ */
  return (
    <div style={{minHeight:'100vh',background:'#fff',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}a{color:inherit;text-decoration:none}
        .card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.08)!important;transition:all .2s}
        .svc-hover:hover{box-shadow:0 4px 14px rgba(0,0,0,.07)!important;transform:translateY(-1px)}
        .container{max-width:960px;margin:0 auto}
        @media(max-width:768px){.grid2{grid-template-columns:1fr!important}.mob-hide{display:none!important}.hero-btns{flex-direction:column!important}.hero-btns>*{width:100%!important;text-align:center}}
      `}</style>

      {/* Banner démo */}
      <div style={{background:'#1a9648',color:'#fff',textAlign:'center' as const,fontSize:12,fontWeight:500,padding:'8px 16px'}}>
        🎭 Ceci est une démonstration Glowify —{' '}
        <a href="/register" style={{fontWeight:700,textDecoration:'underline'}}>Créez votre propre page gratuitement →</a>
      </div>

      {/* Nav */}
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,.96)',backdropFilter:'blur(12px)',borderBottom:'1px solid #f0f0f0',height:56,display:'flex',alignItems:'center',padding:'0 24px',gap:16}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700}}>✂ {S.name}</div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <a href={`tel:${S.phone}`} style={{fontSize:12,color:'#666',padding:'7px 12px',border:'1px solid #f0f0f0',borderRadius:8,display:'none'}} className="mob-hide">Appeler</a>
          <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Réserver</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{background:'linear-gradient(180deg,#111 0%,#1a1a1a 100%)',padding:'56px 24px 48px',textAlign:'center' as const,color:'#fff'}}>
        <div className="container">
          <div style={{display:'inline-block',background:'rgba(200,169,110,.15)',color:'#c8a96e',border:'1px solid rgba(200,169,110,.3)',borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:600,marginBottom:16}}>
            ✦ Salon de coiffure & Barbier · {S.city}
          </div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(36px,7vw,72px)',fontWeight:700,lineHeight:1,marginBottom:14}}>{S.name}</h1>
          <p style={{fontSize:15,color:'rgba(255,255,255,.6)',lineHeight:1.7,maxWidth:480,margin:'0 auto 28px'}}>{S.desc}</p>
          <div className="hero-btns" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const,marginBottom:20}}>
            <button onClick={()=>setView('booking')} style={{background:A,color:'#1a1a1a',border:'none',borderRadius:12,padding:'14px 28px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              Réserver en ligne →
            </button>
            <a href={`tel:${S.phone}`} style={{display:'inline-block',background:'rgba(255,255,255,.1)',color:'#fff',border:'1px solid rgba(255,255,255,.2)',borderRadius:12,padding:'13px 20px',fontSize:14}}>
              📞 {S.phone}
            </a>
          </div>
          <div style={{display:'flex',gap:20,justifyContent:'center',flexWrap:'wrap' as const,fontSize:12,color:'rgba(255,255,255,.4)'}}>
            <span>📍 {S.address}, {S.city}</span>
            <span>📸 {S.ig}</span>
            <span style={{color:A}}>★★★★★ 4.8 · 47 avis Google</span>
          </div>
        </div>
      </div>

      {/* Equipe */}
      <div style={{padding:'48px 24px',background:'#fafafa',borderBottom:'1px solid #f0f0f0'}}>
        <div className="container">
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700,marginBottom:6}}>Notre équipe</h2>
          <p style={{fontSize:14,color:'#888',marginBottom:20}}>Choisissez votre coiffeur lors de la réservation</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
            {S.employees.map(e=>(
              <div key={e.id} className="card-hover" onClick={()=>{setSelEmp(e);setView('booking')}}
                style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'20px',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <div style={{width:48,height:48,borderRadius:'50%',background:e.color+'18',color:e.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,marginBottom:12}}>{ini(e.name)}</div>
                <div style={{fontSize:15,fontWeight:600,marginBottom:2}}>{e.name}</div>
                <div style={{fontSize:12,color:'#aaa',marginBottom:6}}>{e.role}</div>
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:8}}><Stars n={e.rating}/><span style={{fontSize:11,fontWeight:600}}>{e.rating}</span><span style={{fontSize:10,color:'#bbb'}}>({e.reviews})</span></div>
                <p style={{fontSize:11,color:'#888',lineHeight:1.5,marginBottom:10}}>{e.bio}</p>
                <div style={{fontSize:12,fontWeight:600,color:T}}>Réserver avec {e.name.split(' ')[0]} →</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{padding:'48px 24px',background:'#fff'}}>
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:24,flexWrap:'wrap' as const,gap:12}}>
            <div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700}}>Nos prestations</h2>
              <p style={{fontSize:13,color:'#888',marginTop:2}}>{S.services.length} services disponibles</p>
            </div>
            <button onClick={()=>setView('booking')} style={{background:T,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Réserver →</button>
          </div>
          {cats.map(cat=>(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:'#ccc',textTransform:'uppercase' as const,letterSpacing:'.1em',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
                {cat}<div style={{flex:1,height:1,background:'#f5f5f5'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:8}}>
                {S.services.filter(s=>s.cat===cat).map(s=>(
                  <div key={s.id} className="svc-hover" onClick={()=>{setSelSvc(s);setView('booking')}}
                    style={{display:'flex',alignItems:'center',padding:'13px 15px',background:'#fff',border:'1px solid #f0f0f0',borderRadius:11,cursor:'pointer',transition:'all .15s',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,.03)'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{s.name}</div>
                      <div style={{fontSize:11,color:'#bbb'}}>{s.desc} · {fmtD(s.dur)}</div>
                    </div>
                    <div style={{textAlign:'right' as const,flexShrink:0}}>
                      <div style={{fontSize:17,fontWeight:700,color:A}}>{fmtP(s.price)}</div>
                      <div style={{fontSize:10,color:'#ccc',marginTop:1}}>Réserver →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horaires + Map */}
      <div style={{borderTop:'1px solid #f0f0f0'}}>
        <div className="container grid2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:280}}>
          <div style={{background:'#e8e8e8',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:32,minHeight:240}}>
            <div style={{fontSize:36}}>📍</div>
            <div style={{fontSize:15,fontWeight:600,textAlign:'center' as const}}>{S.address}</div>
            <div style={{fontSize:13,color:'#666'}}>{S.city}</div>
            <button onClick={()=>setView('booking')} style={{marginTop:8,background:T,color:'#fff',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Réserver en ligne →
            </button>
          </div>
          <div style={{padding:'32px 28px',background:'#fafafa'}}>
            <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,marginBottom:16}}>Horaires</h3>
            {S.hours.map((h,i)=>(
              <div key={h.day} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                <span style={{color:'#555'}}>{h.day}</span>
                <span style={{color:h.open?'#111':'#ccc'}}>{h.open?`${(h as any).from}–${(h as any).to}`:'Fermé'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avis */}
      <div style={{padding:'48px 24px',background:'#fff',borderTop:'1px solid #f0f0f0'}}>
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:20,flexWrap:'wrap' as const,gap:12}}>
            <div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:700}}>Avis clients</h2>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                <Stars n={4.9} size={14}/><span style={{fontSize:14,fontWeight:700}}>4.9</span><span style={{fontSize:12,color:'#aaa'}}>(47 avis Google)</span>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
            {S.reviews.map((r,i)=>(
              <div key={i} className="card-hover" style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:12,padding:'16px',cursor:'default'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div><div style={{fontSize:13,fontWeight:600}}>{r.name}</div><div style={{fontSize:10,color:'#bbb'}}>avec {r.emp}</div></div>
                </div>
                <Stars n={r.stars}/>
                <p style={{fontSize:12,color:'#666',lineHeight:1.6,marginTop:8}}>{r.txt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:T,padding:'44px 24px',textAlign:'center' as const,color:'#fff'}}>
        <div className="container">
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,marginBottom:10}}>Prêt(e) à réserver ?</h2>
          <p style={{fontSize:14,color:'rgba(255,255,255,.55)',marginBottom:22}}>24h/24 · Confirmation SMS immédiate · Annulation gratuite</p>
          <button onClick={()=>setView('booking')} style={{background:'#fff',color:T,border:'none',borderRadius:11,padding:'14px 30px',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:16}}>
            Choisir mon créneau →
          </button>
          <div style={{marginTop:16,background:'rgba(255,255,255,.1)',borderRadius:11,padding:'14px',maxWidth:400,margin:'16px auto 0'}}>
            <p style={{fontSize:13,marginBottom:8}}>Vous voulez cette page pour votre salon ?</p>
            <a href="/register" style={{display:'inline-block',background:'#fff',color:T,borderRadius:9,padding:'9px 20px',fontSize:13,fontWeight:700}}>Créer mon espace gratuit →</a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{background:'#111',borderTop:'1px solid #1e1e1e',padding:'28px 24px 20px'}}>
        <div className="container" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:16}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:'#fff',marginBottom:6}}>✂ {S.name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,.3)',lineHeight:1.8}}>
              <div>{S.address}, {S.city}</div>
              <div>{S.phone}</div>
            </div>
          </div>
          <button onClick={()=>setView('booking')} style={{background:'#fff',color:'#111',border:'none',borderRadius:9,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            Prendre RDV →
          </button>
        </div>
        <div style={{maxWidth:960,margin:'16px auto 0',paddingTop:14,borderTop:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,.18)',flexWrap:'wrap' as const,gap:4}}>
          <span>© {new Date().getFullYear()} {S.name} · Propulsé par <strong style={{color:'rgba(255,255,255,.3)'}}>Glowify</strong></span>
          <a href="/accueil" style={{color:'rgba(255,255,255,.18)'}}>Créer votre page →</a>
        </div>
      </footer>
    </div>
  )
}
