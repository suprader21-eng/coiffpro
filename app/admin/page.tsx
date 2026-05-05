'use client'
import { useState } from 'react'
import { useTheme, useToast } from '@/app/providers'

const SALONS = [
  {id:'1',name:'Barber Kings',owner:'Karim D.',city:'Lyon',status:'active',mrr:50,clients:87,since:'Jan 2024',plan:'Pro',color:'#4a9fe8',lastSeen:'Il y a 2h'},
  {id:'2',name:'Salon Sarah',owner:'Sarah M.',city:'Montpellier',status:'active',mrr:50,clients:134,since:'Mar 2024',plan:'Pro',color:'#c8a96e',lastSeen:'Il y a 1h'},
  {id:'3',name:'Dylan\'s Shop',owner:'Dylan R.',city:'Paris',status:'trial',mrr:0,clients:23,since:'28 avr.',plan:'Pro',color:'#9a6ee8',lastSeen:'Il y a 30min'},
  {id:'4',name:'Chez Nadia',owner:'Nadia B.',city:'Bordeaux',status:'active',mrr:50,clients:56,since:'Fév 2024',plan:'Pro',color:'#3dba6f',lastSeen:'Il y a 5h'},
  {id:'5',name:'Le Barbier',owner:'Marc D.',city:'Toulouse',status:'suspended',mrr:0,clients:34,since:'Nov 2023',plan:'Pro',color:'#e05a5a',lastSeen:'Il y a 3j'},
]

const ini=(n:string)=>n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)

export default function AdminPage() {
  const { theme, toggle } = useTheme()
  const { addToast } = useToast()
  const [page, setPage] = useState('overview')
  const [selSalon, setSelSalon] = useState<typeof SALONS[0]|null>(null)
  const [search, setSearch] = useState('')

  const active = SALONS.filter(s=>s.status==='active')
  const mrr = active.reduce((s,x)=>s+x.mrr,0)
  const trial = SALONS.filter(s=>s.status==='trial').length

  const filtered = SALONS.filter(s=>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100dvh',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#fff;--s1:#fafafa;--b1:#e8e8e8;--b2:#d0d0d0;--t1:#111;--t2:#666;--t3:#bbb;--green:#1a9648;--red:#d04040;--purple:#7c3aed;--gold:#b8922a}
        [data-theme="dark"]{--bg:#080808;--s1:#0e0e0e;--b1:#1e1e1e;--b2:#2c2c2c;--t1:#f2f2f2;--t2:#888;--t3:#333}
        body{background:var(--bg);color:var(--t1)}
        .card{background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:14px 16px}
        .input{background:var(--bg);border:1px solid var(--b2);border-radius:8px;padding:8px 11px;font-size:12px;color:var(--t1);font-family:inherit}
        .input:focus{outline:none;border-color:var(--b3,#aaa)}
        .table{width:100%;border-collapse:collapse}
        .table th{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding:0 8px 9px;text-align:left;border-bottom:1px solid var(--b1);font-weight:500}
        .table td{padding:9px 8px;border-bottom:1px solid var(--b1);font-size:12px}
        .badge{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:600}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        @media(max-width:768px){.g4{grid-template-columns:1fr 1fr}.mob-hide{display:none}}
      `}</style>

      {/* NAV */}
      <nav style={{height:50,background:'var(--bg)',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',padding:'0 18px',gap:12,position:'sticky',top:0,zIndex:60}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700}}>✂ CoiffPro</span>
        <span style={{fontSize:11,padding:'3px 10px',borderRadius:100,background:'#ede9fe',color:'var(--purple)',fontWeight:600,border:'1px solid #c4b5fd'}}>Admin</span>
        <div style={{display:'flex',gap:4,marginLeft:12}}>
          {['overview','salons','revenue','support'].map(p=>(
            <div key={p} onClick={()=>setPage(p)} style={{padding:'5px 12px',borderRadius:7,fontSize:12,cursor:'pointer',background:page===p?'var(--t1)':'transparent',color:page===p?'var(--bg)':'var(--t2)',fontWeight:page===p?600:400,textTransform:'capitalize'}}>
              {p==='overview'?'Vue d\'ensemble':p==='salons'?'Salons':p==='revenue'?'Revenus':'Support'}
            </div>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button onClick={toggle} style={{background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:7,padding:'5px 9px',fontSize:11,cursor:'pointer',color:'var(--t1)'}}>
            {theme==='dark'?'☀':'🌙'}
          </button>
          <div style={{width:30,height:30,borderRadius:'50%',background:'var(--purple)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>A</div>
        </div>
      </nav>

      <div style={{flex:1,padding:'18px',background:'var(--s1)',overflow:'auto'}}>

        {/* ── VUE D'ENSEMBLE ── */}
        {page==='overview' && <>
          <div className="g4">
            {[{l:'MRR',v:`${mrr}€`,s:'▲ +50€ ce mois',up:true},{l:'Salons actifs',v:active.length,s:'+1 ce mois',up:true},{l:'En essai',v:trial,s:'→ à convertir'},{l:'Clients gérés',v:SALONS.reduce((s,x)=>s+x.clients,0),s:'au total',up:true}].map((s,i)=>(
              <div key={i} className="card" style={{borderTop:`3px solid var(--purple)`}}>
                <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:600}}>{s.v}</div>
                {s.s&&<div style={{fontSize:10,color:s.up?'var(--green)':'var(--t3)',marginTop:4}}>{s.s}</div>}
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="card">
              <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Salons actifs</div>
              {SALONS.slice(0,4).map(s=>(
                <div key={s.id} onClick={()=>{setSelSalon(s);setPage('salons')}} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--b1)',cursor:'pointer'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:s.color+'18',color:s.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{ini(s.name)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{s.name}</div>
                    <div style={{fontSize:10,color:'var(--t3)'}}>{s.owner} · {s.city}</div>
                  </div>
                  <span className="badge" style={{background:s.status==='active'?'#e8f7ee':s.status==='trial'?'#ede9fe':'#fde8e8',color:s.status==='active'?'var(--green)':s.status==='trial'?'var(--purple)':'var(--red)',border:`1px solid ${s.status==='active'?'#b8dfc6':s.status==='trial'?'#c4b5fd':'#f0b8b8'}`}}>
                    {s.status==='active'?'Actif':s.status==='trial'?'Essai':'Suspendu'}
                  </span>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>MRR mensuel</div>
              {['Nov','Déc','Jan','Fév','Mar','Avr','Mai'].map((m,i)=>{
                const v=[50,100,100,150,150,200,mrr][i]
                return <div key={m} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <span style={{fontSize:10,color:'var(--t3)',width:28}}>{m}</span>
                  <div style={{flex:1,height:6,background:'var(--b1)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',background:i===6?'var(--purple)':'var(--b2)',width:`${Math.round(v/mrr*100)}%`,borderRadius:3}} />
                  </div>
                  <span style={{fontSize:11,fontWeight:600,width:36,textAlign:'right'}}>{v}€</span>
                </div>
              })}
            </div>
          </div>
        </>}

        {/* ── SALONS ── */}
        {page==='salons' && <>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <input className="input" placeholder="Rechercher un salon…" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}} />
            <button onClick={()=>addToast('✅ Salon ajouté')} style={{background:'var(--t1)',color:'var(--bg)',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',marginLeft:'auto',fontFamily:'inherit'}}>
              + Ajouter un salon
            </button>
          </div>
          {selSalon ? (
            <div>
              <button onClick={()=>setSelSalon(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'var(--t2)',marginBottom:14,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5}}>
                ← Retour à la liste
              </button>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="card">
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:10,background:selSalon.color+'18',color:selSalon.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700}}>{ini(selSalon.name)}</div>
                    <div><div style={{fontSize:15,fontWeight:600}}>{selSalon.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{selSalon.owner} · {selSalon.city}</div></div>
                  </div>
                  {[['Plan',selSalon.plan+' — 50€/mois'],['Statut',selSalon.status],['Clients',selSalon.clients],['Inscrit',selSalon.since],['Dernière connexion',selSalon.lastSeen]].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
                      <span style={{color:'var(--t2)'}}>{l}</span><span style={{fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div className="card">
                    <div style={{fontSize:11,fontWeight:600,marginBottom:10}}>Actions rapides</div>
                    {[
                      {label:'Voir la page client ↗',action:()=>window.open(`/book/${selSalon.name.toLowerCase().replace(/[^a-z0-9]/g,'-')}`,'_blank')},
                      {label:'Envoyer un message',action:()=>addToast(`📧 Message envoyé à ${selSalon.owner}`)},
                      {label:'Modifier le plan',action:()=>addToast('💳 Gestion plan Stripe')},
                      {label:selSalon.status==='active'?'Suspendre le compte':'Réactiver le compte',action:()=>addToast(`${selSalon.status==='active'?'⏸ Suspendu':'✅ Réactivé'} : ${selSalon.name}`)},
                    ].map(btn=>(
                      <button key={btn.label} onClick={btn.action} style={{width:'100%',textAlign:'left',background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:8,padding:'10px 12px',fontSize:12,cursor:'pointer',fontFamily:'inherit',marginBottom:6,color:'var(--t1)'}}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="card">
                    <div style={{fontSize:11,fontWeight:600,marginBottom:8}}>Personnalisation directe</div>
                    <div style={{fontSize:12,color:'var(--t2)',marginBottom:10}}>En tant qu'admin, vous pouvez modifier la page de ce salon :</div>
                    <button onClick={()=>window.open(`/book/${selSalon.name.toLowerCase().replace(/[^a-z0-9]/g,'-')}`,'_blank')} style={{width:'100%',background:'var(--purple)',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                      ✏ Ouvrir l'éditeur du salon →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <table className="table">
                <thead><tr><th>Salon</th><th>Propriétaire</th><th className="mob-hide">Ville</th><th>Clients</th><th>Statut</th><th>MRR</th><th></th></tr></thead>
                <tbody>{filtered.map(s=><tr key={s.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:28,height:28,borderRadius:7,background:s.color+'18',color:s.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{ini(s.name)}</div>
                    <div><div style={{fontWeight:500}}>{s.name}</div><div style={{fontSize:10,color:'var(--t3)'}}>depuis {s.since}</div></div>
                  </div></td>
                  <td style={{color:'var(--t2)'}}>{s.owner}</td>
                  <td className="mob-hide" style={{color:'var(--t2)'}}>{s.city}</td>
                  <td>{s.clients}</td>
                  <td><span className="badge" style={{background:s.status==='active'?'#e8f7ee':s.status==='trial'?'#ede9fe':'#fde8e8',color:s.status==='active'?'var(--green)':s.status==='trial'?'var(--purple)':'var(--red)',border:`1px solid ${s.status==='active'?'#b8dfc6':s.status==='trial'?'#c4b5fd':'#f0b8b8'}`}}>
                    {s.status==='active'?'Actif':s.status==='trial'?'Essai':'Suspendu'}
                  </span></td>
                  <td style={{fontWeight:600}}>{s.mrr?`${s.mrr}€`:'-'}</td>
                  <td><button onClick={()=>setSelSalon(s)} style={{background:'var(--bg)',border:'1px solid var(--b2)',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>Gérer</button></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </>}

        {/* ── REVENUS ── */}
        {page==='revenue' && <>
          <div className="g4">
            {[{l:'MRR actuel',v:`${mrr}€`},{l:'ARR estimé',v:`${mrr*12}€`},{l:'Si essais convertis',v:`+${trial*50}€`},{l:'Taux conversion',v:'67%'}].map((s,i)=>(
              <div key={i} className="card" style={{borderTop:'3px solid var(--purple)'}}>
                <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:600}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:14}}>Tous les abonnements</div>
            <table className="table">
              <thead><tr><th>Salon</th><th>Montant</th><th>Statut Stripe</th><th>Prochain prélèvement</th><th></th></tr></thead>
              <tbody>{SALONS.map(s=><tr key={s.id}>
                <td style={{fontWeight:500}}>{s.name}</td>
                <td style={{fontWeight:600}}>{s.status==='active'?'50€/mois':s.status==='trial'?'Essai gratuit':'Suspendu'}</td>
                <td><span className="badge" style={{background:s.status==='active'?'#e8f7ee':s.status==='trial'?'#ede9fe':'#fde8e8',color:s.status==='active'?'var(--green)':s.status==='trial'?'var(--purple)':'var(--red)',border:'1px solid #ddd'}}>
                  {s.status==='active'?'active':s.status==='trial'?'trialing':'canceled'}
                </span></td>
                <td style={{color:'var(--t3)'}}>{s.status==='active'?`1er juin 2025`:s.status==='trial'?`Fin d'essai: 15 mai`:'-'}</td>
                <td><button onClick={()=>addToast(`💳 Stripe portal: ${s.name}`)} style={{fontSize:10,background:'none',border:'1px solid var(--b2)',borderRadius:6,padding:'3px 8px',cursor:'pointer',fontFamily:'inherit'}}>Stripe →</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </>}

        {/* ── SUPPORT ── */}
        {page==='support' && <>
          <div className="g4" style={{marginBottom:14}}>
            {[{l:'Tickets ouverts',v:'3'},{l:'Temps de réponse moy.',v:'1h24'},{l:'Satisf. clients',v:'4.8★'},{l:'Problèmes résolus',v:'98%'}].map((s,i)=>(
              <div key={i} className="card" style={{borderTop:'3px solid var(--purple)'}}>
                <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:5}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:600}}>{s.v}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{fontSize:10,fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:12}}>Tickets en cours</div>
            {[
              {salon:'Dylan\'s Shop',msg:'SMS de confirmation non reçus',status:'open',time:'Il y a 2h',priority:'high'},
              {salon:'Chez Nadia',msg:'Impossible de modifier les horaires',status:'open',time:'Il y a 4h',priority:'medium'},
              {salon:'Le Barbier',msg:'Demande de réactivation compte',status:'pending',time:'Il y a 1j',priority:'low'},
            ].map((t,i)=>(
              <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'flex-start',gap:10}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:t.priority==='high'?'var(--red)':t.priority==='medium'?'var(--gold)':'var(--green)',marginTop:4,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{t.salon}</div>
                  <div style={{fontSize:12,color:'var(--t2)',marginTop:2}}>{t.msg}</div>
                  <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>{t.time}</div>
                </div>
                <button onClick={()=>addToast(`💬 Réponse envoyée à ${t.salon}`)} style={{background:'var(--purple)',color:'#fff',border:'none',borderRadius:7,padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  Répondre
                </button>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  )
}
