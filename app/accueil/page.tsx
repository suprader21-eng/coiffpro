'use client'
import { useState, useEffect } from 'react'

type Testimonial = { name:string; role:string; city:string; avatar:string; text:string; metric:string; metricLabel:string; color:string }

const TESTIMONIALS: Testimonial[] = [
  { name:'Karim B.', role:'Barber indépendant', city:'Lyon', avatar:'KB', text:'J\'avais mon agenda sur une plateforme tierce. Avec Glowify je paie 5x moins et mes clients réservent sur MON site. J\'ai récupéré 100% de mes données client.', metric:'+47%', metricLabel:'de CA en 4 mois', color:'#4a9fe8' },
  { name:'Sarah M.', role:'Salon 3 coiffeurs', city:'Montpellier', avatar:'SM', text:'En 2 semaines on était en première position sur Google "coiffeur Montpellier". La visibilité qu\'on payait à une plateforme, maintenant on la possède.', metric:'#1', metricLabel:'sur Google local', color:'#c8a96e' },
  { name:'Dylan R.', role:'Barber Shop premium', city:'Paris 11e', avatar:'DR', text:'Le branding, la page de réservation stylée, le club fidélité… Mes clients me disent que c\'est mieux que chez des grands salons.', metric:'94%', metricLabel:'taux de retour', color:'#9a6ee8' },
  { name:'Nadia A.', role:'Coiffeuse solo', city:'Bordeaux', avatar:'NA', text:'Je bossais seule, j\'avais pas besoin de payer 80€/mois. Glowify à 50€ me donne tout ce qu\'il me faut. L\'agenda, les rappels, la page. Rien de plus.', metric:'0', metricLabel:'no-show ce mois', color:'#3dba6f' },
]

const COMPARAISON = [
  { plateforme:'Commission sur chaque RDV',          coiffpro:'0% de commission. Jamais.',             icon:'💸' },
  { plateforme:'Vos clients sur leur plateforme',    coiffpro:'Votre base client = votre propriété',   icon:'👤' },
  { plateforme:'80-150€/mois pour les fonctions pro',coiffpro:'50€/mois tout inclus',                   icon:'💰' },
  { plateforme:'Votre salon parmi des milliers',     coiffpro:'Votre propre site SEO optimisé',         icon:'🌐' },
  { plateforme:'Support par ticket, délai 48h',      coiffpro:'Support direct, réponse en 2h',          icon:'💬' },
  { plateforme:'Design imposé',                      coiffpro:'Votre identité, votre couleur, votre marque', icon:'🎨' },
]

const FEATURES = [
  { icon:'🚀', title:'Votre site de réservation', desc:'Page pro à votre image sur votre domaine. SEO optimisé pour Google Maps. Vos clients réservent chez vous.', tag:'Indépendance', c:'#e05a5a' },
  { icon:'📈', title:'Acquisition clients', desc:'Fiche Google optimisée, campagnes SMS locales, relances auto. On vous apporte des clients, pas juste un logiciel.', tag:'Différenciateur', c:'#7c3aed' },
  { icon:'🎯', title:'Mode barber premium', desc:'Expérience haut de gamme. Club fidélité. Branding fort. Tes clients réservent comme dans un club privé.', tag:'Barbers', c:'#c8a96e' },
  { icon:'🤖', title:'Fidélisation intelligente', desc:'Relance auto des clients perdus. SMS personnalisés selon l\'historique. Vos données travaillent 24h/24.', tag:'IA', c:'#3dba6f' },
  { icon:'⚡', title:'Mode solo ultra-simple', desc:'Agenda + paiement + rappels en 3 clics. Zéro prise de tête. Le Notion du coiffeur.', tag:'Indépendants', c:'#4a9fe8' },
  { icon:'📱', title:'Instagram & TikTok', desc:'Lien bio intelligent → réservation directe. Posts programmés. Transformez vos followers en clients.', tag:'Réseaux', c:'#f97316' },
]

function Ticker() {
  const items = ['Karim — Lyon — +47% CA','Sarah — Montpellier — #1 Google','Dylan — Paris — 94% retour','Nadia — Bordeaux — 0 no-show']
  const [x, setX] = useState(0)
  useEffect(()=>{
    const id = setInterval(()=>setX(p=>(p-1)), 30)
    return ()=>clearInterval(id)
  },[])
  return (
    <div style={{background:'#1a1a1a',color:'rgba(255,255,255,.55)',fontSize:11,fontWeight:500,padding:'7px 0',overflow:'hidden',whiteSpace:'nowrap'}}>
      <span style={{display:'inline-block',transform:`translateX(${x % 800}px)`,transition:'none'}}>
        {Array(8).fill(items.join('  ✦  ')).join('  ✦  ')}
      </span>
    </div>
  )
}

export default function LandingPage() {
  const [cookieBanner, setCookieBanner] = useState(true)
  const [openLegal, setOpenLegal] = useState<string|null>(null)

  return (
    <div style={{fontFamily:"'Outfit',system-ui,sans-serif",background:'#fff',color:'#111',overflowX:'hidden'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fi1{animation:fadeUp .5s ease .1s both}
        .fi2{animation:fadeUp .5s ease .25s both}
        .fi3{animation:fadeUp .5s ease .4s both}
        .fi4{animation:fadeUp .5s ease .55s both}
        .hover-lift:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.09)!important;transition:all .2s}
        .container{max-width:1040px;margin:0 auto}
      `}</style>

      <Ticker />

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,.96)',backdropFilter:'blur(16px)',borderBottom:'1px solid #f0f0f0',height:58,display:'flex',alignItems:'center',padding:'0 20px',gap:16}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700}}>✂ Glowify</div>
        <div className="nav-desktop" style={{gap:4,marginLeft:8}}>
          <a href="#features" style={{fontSize:13,color:'#666',padding:'6px 10px',borderRadius:8}}>Fonctionnalités</a>
          <a href="#tarifs" style={{fontSize:13,color:'#666',padding:'6px 10px',borderRadius:8}}>Tarifs</a>
          <a href="#temoignages" style={{fontSize:13,color:'#666',padding:'6px 10px',borderRadius:8}}>Témoignages</a>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <a href="/login" style={{fontSize:13,color:'#666',padding:'8px 12px',borderRadius:8}}>Connexion</a>
          <a href="/register" style={{fontSize:13,fontWeight:600,background:'#1a1a1a',color:'#fff',padding:'9px 16px',borderRadius:9,display:'inline-block'}}>Essai gratuit →</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="landing-padding" style={{padding:'72px 24px 56px',background:'#fafafa',borderBottom:'1px solid #f0f0f0'}}>
        <div className="container" style={{textAlign:'center'}}>
          <div className="fi1" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #f0ddc8',borderRadius:100,padding:'6px 14px',fontSize:12,fontWeight:500,color:'#c8a96e',marginBottom:20}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'#c8a96e',display:'inline-block'}}/>
            La plateforme de réservation pour coiffeurs indépendants
          </div>
          <h1 className="fi2" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(34px,7vw,74px)',fontWeight:700,lineHeight:1.0,letterSpacing:'-.02em',marginBottom:18,maxWidth:820,margin:'0 auto 18px'}}>
            Reprenez le contrôle de votre clientèle avec votre propre site de réservation.
          </h1>
          <p className="fi3" style={{fontSize:'clamp(14px,2vw,17px)',color:'#666',lineHeight:1.7,maxWidth:540,margin:'0 auto 32px'}}>
            Créez votre page de réservation personnalisée, gérez vos clients et automatisez vos rappels SMS — sans dépendre d'aucune plateforme tierce.
          </p>
          <div className="fi4 hero-btns">
            <a href="/register" style={{background:'#1a1a1a',color:'#fff',borderRadius:12,padding:'14px 28px',fontSize:15,fontWeight:700,display:'inline-block',boxShadow:'0 4px 20px rgba(0,0,0,.18)'}}>
              Créer mon espace gratuit →
            </a>
            <a href="/book/demo" style={{background:'#fff',color:'#333',border:'1px solid #e0e0e0',borderRadius:12,padding:'13px 20px',fontSize:14,display:'inline-block'}}>
              Voir une démo ↗
            </a>
          </div>
          <div style={{fontSize:12,color:'#bbb',display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',marginTop:24}}>
            {['14 jours gratuits','Sans carte bancaire','Annulation en 1 clic','Support français'].map(t=>(
              <span key={t} style={{display:'flex',alignItems:'center',gap:5}}><span style={{color:'#3dba6f'}}>✓</span>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* COMPARAISON */}
      <div className="landing-padding" style={{padding:'72px 24px',background:'#fff'}}>
        <div className="container">
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{display:'inline-block',background:'#fde8e8',color:'#c03030',borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:600,marginBottom:14}}>Pourquoi choisir Glowify ?</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700,lineHeight:1.1}}>
              Une alternative aux<br/><em style={{color:'#e05a5a',fontStyle:'italic'}}>plateformes de réservation</em>
            </h2>
            <p style={{fontSize:14,color:'#888',marginTop:10,maxWidth:480,margin:'10px auto 0'}}>Votre page vous appartient. Vos clients réservent chez vous.</p>
          </div>
          <div className="comparaison" style={{background:'#fafafa',border:'1px solid #f0f0f0',borderRadius:16,overflow:'hidden',maxWidth:760,margin:'0 auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',background:'#f0f0f0',borderBottom:'1px solid #e8e8e8'}}>
              <div style={{padding:'12px 18px',textAlign:'center',fontSize:12,fontWeight:700,color:'#999'}}>Plateformes tierces</div>
              <div style={{padding:'12px 18px',textAlign:'center',fontSize:12,fontWeight:700,color:'#111',background:'#fff',borderLeft:'1px solid #e8e8e8'}}>✂ Glowify</div>
            </div>
            {COMPARAISON.map((r,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:i<COMPARAISON.length-1?'1px solid #f0f0f0':undefined}}>
                <div style={{padding:'13px 18px',display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#999'}}>
                  <span style={{fontSize:14,flexShrink:0}}>{r.icon}</span>
                  <span style={{textDecoration:'line-through',textDecorationColor:'#e05a5a'}}>{r.plateforme}</span>
                </div>
                <div style={{padding:'13px 18px',display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#111',fontWeight:500,background:'#fffdf8',borderLeft:'1px solid #f0f0f0'}}>
                  <span style={{color:'#3dba6f',fontWeight:700,flexShrink:0}}>✓</span>{r.coiffpro}
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:24}}>
            <a href="/register" style={{display:'inline-block',background:'#1a1a1a',color:'#fff',borderRadius:10,padding:'12px 24px',fontSize:13,fontWeight:600}}>Créer mon espace →</a>
            <div style={{fontSize:11,color:'#aaa',marginTop:8}}>Migration depuis votre ancienne plateforme offerte</div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="landing-padding" style={{padding:'72px 24px',background:'#fafafa',borderTop:'1px solid #f0f0f0'}}>
        <div className="container">
          <div style={{textAlign:'center',marginBottom:44}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700,marginBottom:10}}>Tout ce dont vous avez besoin,<br/>rien de superflu.</h2>
            <p style={{fontSize:14,color:'#888',maxWidth:440,margin:'0 auto'}}>Conçu avec et pour des coiffeurs et barbers indépendants.</p>
          </div>
          <div className="features-auto" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
            {FEATURES.map((f,i)=>(
              <div key={i} className="hover-lift" style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'22px',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <span style={{fontSize:26}}>{f.icon}</span>
                  <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:100,background:f.c+'18',color:f.c}}>{f.tag}</span>
                </div>
                <div style={{fontSize:15,fontWeight:600,marginBottom:7}}>{f.title}</div>
                <p style={{fontSize:13,color:'#888',lineHeight:1.7}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARBER MODE */}
      <div className="landing-padding" style={{padding:'72px 24px',background:'#1a1a1a',color:'#fff'}}>
        <div className="container barber-grid">
          <div>
            <div style={{display:'inline-block',background:'rgba(200,169,110,.15)',color:'#c8a96e',borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:600,marginBottom:18,border:'1px solid rgba(200,169,110,.3)'}}>
              ✦ Mode Barber Premium
            </div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700,lineHeight:1.05,marginBottom:14}}>
              Ton shop mérite une<br/><em style={{color:'#c8a96e',fontStyle:'italic'}}>image à sa hauteur.</em>
            </h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,.55)',lineHeight:1.8,marginBottom:22}}>
              Les meilleurs barbers ne veulent pas un outil générique. Ils veulent un brand. Glowify crée une expérience "club privé" qui colle à ton identité.
            </p>
            {['Page de réservation à votre image','Expérience client type "membre VIP"','Club fidélité personnalisé','Rappels SMS à votre ton','Galerie photos de vos coupes'].map(f=>(
              <div key={f} style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'rgba(255,255,255,.8)',marginBottom:10}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:'rgba(200,169,110,.2)',border:'1px solid rgba(200,169,110,.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#c8a96e',flexShrink:0}}>✓</span>
                {f}
              </div>
            ))}
            <a href="/register" style={{display:'inline-block',background:'#c8a96e',color:'#1a1a1a',borderRadius:10,padding:'13px 24px',fontSize:14,fontWeight:700,marginTop:12}}>
              Créer mon shop →
            </a>
          </div>
          {/* Booking preview */}
          <div style={{background:'#111',border:'1px solid #2a2a2a',borderRadius:18,padding:'22px',boxShadow:'0 24px 60px rgba(0,0,0,.5)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#c8a96e,#8a6a2e)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff'}}>DR</div>
              <div><div style={{fontSize:13,fontWeight:600,color:'#fff'}}>Dylan's Barber Shop</div><div style={{fontSize:10,color:'#666'}}>Paris 11e · Membre 2 ans</div></div>
              <div style={{marginLeft:'auto',fontSize:10,color:'#c8a96e'}}>★★★★★</div>
            </div>
            <div style={{background:'#1a1a1a',borderRadius:10,padding:'12px',marginBottom:10}}>
              <div style={{fontSize:9,color:'#555',textTransform:'uppercase' as const,letterSpacing:'.07em',marginBottom:6}}>Votre RDV</div>
              <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:4}}>Coupe + Fade + Barbe</div>
              <div style={{display:'flex',gap:8}}><span style={{fontSize:11,color:'#888'}}>Sam 11 mai · 10h00</span><span style={{fontSize:11,color:'#c8a96e',fontWeight:600}}>50€</span></div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              {['Lun 13','Mar 14','Mer 15','Jeu 16'].map((d,i)=>(
                <div key={d} style={{flex:1,borderRadius:9,border:`1px solid ${i===2?'#c8a96e':'#222'}`,padding:'7px 4px',textAlign:'center' as const,background:i===2?'rgba(200,169,110,.15)':undefined}}>
                  <div style={{fontSize:9,color:i===2?'#c8a96e':'#555',marginBottom:1}}>{d.split(' ')[0]}</div>
                  <div style={{fontSize:14,fontWeight:700,color:i===2?'#c8a96e':'#fff'}}>{d.split(' ')[1]}</div>
                </div>
              ))}
            </div>
            <div style={{background:'#c8a96e',borderRadius:8,padding:'11px',textAlign:'center' as const,fontSize:13,fontWeight:700,color:'#1a1a1a',cursor:'pointer'}}>
              Confirmer le RDV →
            </div>
          </div>
        </div>
      </div>

      {/* FIDÉLISATION */}
      <div className="landing-padding" style={{padding:'72px 24px',background:'#fff'}}>
        <div className="container">
          <div style={{textAlign:'center',marginBottom:44}}>
            <div style={{display:'inline-block',background:'#e8f7ee',color:'#1a9648',borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:600,marginBottom:14}}>🤖 Fidélisation intelligente</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700,lineHeight:1.1,marginBottom:10}}>
              Vos clients inactifs reviennent<br/><em style={{color:'#3dba6f',fontStyle:'italic'}}>d'eux-mêmes.</em>
            </h2>
            <p style={{fontSize:14,color:'#888',maxWidth:460,margin:'0 auto'}}>Le moteur IA analyse vos données et déclenche des messages au bon moment.</p>
          </div>
          <div style={{background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)',border:'1px solid #b8dfc6',borderRadius:18,padding:'28px 32px'}}>
            <div className="fidelite-grid">
              <div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
                  {[{l:'Taux de réactivation',v:'34%'},{l:'Clients récupérés/mois',v:'12 en moy.'},{l:'CA additionnel estimé',v:'+180€/mois'},{l:'SMS automatiques',v:'∞'}].map(s=>(
                    <div key={s.l} style={{background:'#fff',borderRadius:9,padding:'10px 12px',border:'1px solid #d0f0d8'}}>
                      <div style={{fontSize:18,fontWeight:700,color:'#1a9648'}}>{s.v}</div>
                      <div style={{fontSize:10,color:'#888',marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <a href="/register" style={{display:'inline-block',background:'#1a9648',color:'#fff',borderRadius:9,padding:'11px 20px',fontSize:13,fontWeight:700}}>
                  Activer la fidélisation →
                </a>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {[
                  {msg:'Sophie, ça fait 7 semaines ! Votre brushing vous attend 🌟',status:'RDV pris',c:'#3dba6f'},
                  {msg:'Julien, encore 2 coupes pour votre produit offert 🎁',status:'Lu',c:'#4a9fe8'},
                  {msg:'Bonne fête Marie ! 🎂 -10% ce mois rien que pour vous',status:'Envoyé',c:'#c8a96e'},
                ].map((m,i)=>(
                  <div key={i} style={{background:'#fff',border:'1px solid #e8f7ee',borderRadius:10,padding:'11px 13px',display:'flex',gap:10,alignItems:'flex-start'}}>
                    <span style={{fontSize:16,flexShrink:0}}>🤖</span>
                    <div style={{flex:1,fontSize:12,color:'#333',lineHeight:1.5}}>{m.msg}</div>
                    <span style={{fontSize:9,padding:'2px 7px',borderRadius:100,background:m.c+'18',color:m.c,fontWeight:600,flexShrink:0}}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TÉMOIGNAGES */}
      <div id="temoignages" className="landing-padding" style={{padding:'72px 24px',background:'#fafafa',borderTop:'1px solid #f0f0f0'}}>
        <div className="container">
          <div style={{textAlign:'center',marginBottom:40}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700}}>Ils ont repris leur indépendance.<br/>Ils ne regrettent rien.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
            {TESTIMONIALS.map((t,i)=>(
              <div key={i} className="hover-lift" style={{background:'#fff',border:'1px solid #f0f0f0',borderRadius:14,padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:t.color+'18',color:t.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{t.avatar}</div>
                  <div><div style={{fontSize:13,fontWeight:600}}>{t.name}</div><div style={{fontSize:11,color:'#aaa'}}>{t.role} · {t.city}</div></div>
                </div>
                <div style={{color:'#c8a96e',fontSize:11,marginBottom:8}}>★★★★★</div>
                <p style={{fontSize:13,color:'#555',lineHeight:1.7,marginBottom:12}}>{t.text}</p>
                <div style={{paddingTop:10,borderTop:'1px solid #f5f5f5',display:'flex',gap:4,alignItems:'baseline'}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:t.color}}>{t.metric}</span>
                  <span style={{fontSize:11,color:'#aaa'}}>{t.metricLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TARIF */}
      <div id="tarifs" className="landing-padding" style={{padding:'72px 24px',background:'#fff',borderTop:'1px solid #f0f0f0'}}>
        <div className="container">
          <div style={{textAlign:'center',marginBottom:36}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(26px,4vw,44px)',fontWeight:700,marginBottom:8}}>Un seul tarif. Transparent. Tout inclus.</h2>
            <p style={{fontSize:14,color:'#888'}}>Aucune commission sur vos RDVs. Jamais.</p>
          </div>
          <div style={{maxWidth:380,margin:'0 auto'}}>
            <div style={{border:'2px solid #1a1a1a',borderRadius:18,padding:'28px 24px',position:'relative'}}>
              <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 14px',borderRadius:100,whiteSpace:'nowrap'}}>Glowify Pro — Tout inclus</div>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:50,fontWeight:700,lineHeight:1}}>50€</div>
                <div style={{fontSize:13,color:'#aaa',marginTop:3}}>/mois</div>
              </div>
              {['Page de réservation personnalisée','Agenda en ligne','Clients illimités (CRM)','Rappels SMS automatiques','Programme fidélité','Campagnes SMS','Paiement SumUp intégré','Multi-collaborateurs','Support en français en 2h'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#444',marginBottom:8}}>
                  <span style={{color:'#3dba6f',fontWeight:700,flexShrink:0}}>✓</span>{f}
                </div>
              ))}
              <a href="/register" style={{display:'block',textAlign:'center',marginTop:20,background:'#1a1a1a',color:'#fff',borderRadius:9,padding:'13px',fontSize:14,fontWeight:700}}>
                Essai gratuit 14j →
              </a>
              <div style={{textAlign:'center',fontSize:11,color:'#bbb',marginTop:8}}>Sans carte bancaire · Sans engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="landing-padding" style={{padding:'72px 24px',background:'#1a1a1a',color:'#fff',textAlign:'center' as const}}>
        <div className="container">
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'clamp(28px,5vw,56px)',fontWeight:700,lineHeight:1.0,marginBottom:16}}>
            Votre salon. Vos clients.<br/><span style={{color:'#c8a96e'}}>Votre business.</span>
          </h2>
          <p style={{fontSize:14,color:'rgba(255,255,255,.45)',maxWidth:420,margin:'0 auto 28px',lineHeight:1.7}}>
            Démarrez gratuitement. Configurez votre salon en 5 minutes.
          </p>
          <a href="/register" style={{display:'inline-block',background:'#fff',color:'#1a1a1a',borderRadius:12,padding:'16px 36px',fontSize:15,fontWeight:700,marginBottom:14}}>
            Créer mon espace — gratuit 14 jours →
          </a>
          <div style={{fontSize:12,color:'rgba(255,255,255,.25)',display:'flex',gap:18,justifyContent:'center',flexWrap:'wrap' as const}}>
            {['Sans carte bancaire','Migration offerte','Support en 2h','Résiliation en 1 clic'].map(t=>(
              <span key={t} style={{display:'flex',alignItems:'center',gap:4}}><span style={{color:'#c8a96e'}}>✓</span>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{background:'#111',borderTop:'1px solid #1e1e1e',padding:'36px 24px 20px'}}>
        <div className="container footer-grid">
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:700,color:'#fff',marginBottom:10}}>✂ Glowify</div>
            <p style={{fontSize:12,color:'rgba(255,255,255,.3)',lineHeight:1.8,maxWidth:220}}>La plateforme de réservation pour les professionnels de la coiffure.</p>
            <div style={{marginTop:10,fontSize:12,color:'rgba(255,255,255,.3)',lineHeight:1.9}}>
              <div>contact@coiffpro.fr</div>
              <div>Montpellier, France</div>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Produit</div>
            {[['Fonctionnalités','#features'],['Tarifs','#tarifs'],['Témoignages','#temoignages'],['Démo','/book/demo'],['Connexion','/login'],['Créer un compte','/register']].map(([l,h])=>(
              <a key={l} href={h} style={{display:'block',fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:6}}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Contact</div>
            <a href="mailto:contact@coiffpro.fr" style={{display:'block',fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:6}}>contact@coiffpro.fr</a>
            <a href="mailto:contact@coiffpro.fr" style={{display:'block',fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:6}}>Support client</a>
          </div>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.25)',textTransform:'uppercase' as const,letterSpacing:'.08em',marginBottom:12}}>Légal</div>
            {([['Mentions légales','mentions'],['CGU','cgu'],['Confidentialité','confidentialite'],['Cookies','cookies']] as [string,string][]).map(([l,k])=>(
              <div key={l} onClick={()=>setOpenLegal(k)} style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:6,cursor:'pointer'}}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{maxWidth:1040,margin:'20px auto 0',paddingTop:14,borderTop:'1px solid #1e1e1e',display:'flex',justifyContent:'space-between',fontSize:10,color:'rgba(255,255,255,.18)',flexWrap:'wrap' as const,gap:4}}>
          <span>© {new Date().getFullYear()} Glowify — Micro-entreprise — Montpellier</span>
          <span>Fait en France 🇫🇷</span>
        </div>
      </footer>

      {/* MODALS LÉGALES */}
      {openLegal&&(
        <div onClick={(e:any)=>{if(e.target===e.currentTarget)setOpenLegal(null)}}
          style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.55)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 0 0 0'}}>
          <div style={{background:'#fff',borderRadius:'14px 14px 0 0',padding:'22px 22px 32px',width:'100%',maxWidth:680,maxHeight:'85vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{fontSize:16,fontWeight:700}}>
                {openLegal==='cgu'?'Conditions Générales d\'Utilisation':openLegal==='confidentialite'?'Politique de confidentialité':openLegal==='cookies'?'Cookies':'Mentions légales'}
              </h2>
              <button onClick={()=>setOpenLegal(null)} style={{background:'#f0f0f0',border:'none',borderRadius:'50%',width:30,height:30,cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={{fontSize:13,color:'#444',lineHeight:1.9}}>
              {openLegal==='mentions'&&<><p><strong>Éditeur :</strong> Glowify — Micro-entreprise — Responsable : Magnier Noah — Montpellier — contact@coiffpro.fr</p><br/><p><strong>Hébergement :</strong> Vercel Inc. — 440 N Barranca Avenue #4133, Covina, CA 91723, USA</p><br/><p><strong>Propriété intellectuelle :</strong> Tout le contenu est la propriété de Glowify. Reproduction interdite sans autorisation.</p><br/><p><strong>Droit applicable :</strong> Droit français.</p><br/><p style={{color:'#bbb',fontSize:11}}>Mise à jour : 03/05/2026</p></>}
              {openLegal==='cgu'&&<><p><strong>1. Objet :</strong> Les présentes CGU définissent les modalités d'utilisation de la plateforme Glowify, service de création de site de réservation en ligne.</p><br/><p><strong>2. Éditeur :</strong> Glowify — Micro-entreprise — Montpellier — contact@coiffpro.fr — Responsable : Magnier Noah</p><br/><p><strong>3. Service :</strong> Création d'un site de réservation, gestion des rendez-vous, gestion d'une base client, outils de visibilité.</p><br/><p><strong>4. Tarifs :</strong> Abonnement mensuel de 50€/mois. 14 jours d'essai gratuit. Sans engagement.</p><br/><p><strong>5. Données :</strong> Les données clients appartiennent au professionnel. Glowify agit comme sous-traitant RGPD.</p><br/><p><strong>6. Résiliation :</strong> Résiliation possible à tout moment depuis le dashboard.</p><br/><p><strong>7. Droit applicable :</strong> Droit français. Tribunaux du siège social.</p><br/><p style={{color:'#bbb',fontSize:11}}>Mise à jour : 03/05/2026</p></>}
              {openLegal==='confidentialite'&&<><p><strong>Responsable :</strong> Glowify — Montpellier — contact@coiffpro.fr — Magnier Noah</p><br/><p><strong>Données collectées :</strong> Nom, email, téléphone des professionnels et de leurs clients finaux.</p><br/><p><strong>Finalités :</strong> Fourniture du service, gestion des comptes, support, amélioration.</p><br/><p><strong>Partage :</strong> Données jamais vendues. Partagées uniquement avec prestataires techniques.</p><br/><p><strong>Droits RGPD :</strong> Accès, rectification, suppression, portabilité. Contact : contact@coiffpro.fr</p><br/><p style={{color:'#bbb',fontSize:11}}>Mise à jour : 03/05/2026</p></>}
              {openLegal==='cookies'&&<><p><strong>Types :</strong> Cookies essentiels (connexion, sécurité), cookies d'audience (mesure), cookies fonctionnels.</p><br/><p><strong>Consentement :</strong> Aucun cookie non essentiel sans votre accord.</p><br/><p><strong>Durée :</strong> Maximum 13 mois.</p><br/><p><strong>Gestion :</strong> Via le bandeau ou les paramètres de votre navigateur.</p><br/><p style={{color:'#bbb',fontSize:11}}>Mise à jour : 03/05/2026</p></>}
            </div>
          </div>
        </div>
      )}

      {/* COOKIE BANNER */}
      {cookieBanner&&(
        <div style={{position:'fixed',bottom:16,left:'50%',transform:'translateX(-50%)',background:'#fff',border:'1px solid #e8e8e8',borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,.1)',zIndex:190,maxWidth:480,width:'calc(100% - 32px)'}}>
          <span style={{fontSize:18,flexShrink:0}}>🍪</span>
          <p style={{flex:1,fontSize:12,color:'#666',lineHeight:1.5}}>Nous utilisons des cookies pour améliorer votre expérience.</p>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <button onClick={()=>setCookieBanner(false)} style={{background:'#f5f5f5',border:'none',borderRadius:7,padding:'6px 10px',fontSize:11,cursor:'pointer',fontFamily:'inherit',color:'#888'}}>Refuser</button>
            <button onClick={()=>setCookieBanner(false)} style={{background:'#1a1a1a',border:'none',borderRadius:7,padding:'6px 10px',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',color:'#fff'}}>Accepter</button>
          </div>
        </div>
      )}
    </div>
  )
}
