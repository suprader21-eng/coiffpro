'use client'
import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [view, setView]         = useState<'login'|'forgot'|'sent'>('login')

  const sb = getBrowserClient()

  const s: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e8e8e8', borderRadius: 9,
    padding: '11px 14px', fontSize: 14, fontFamily: 'inherit',
    color: '#111', outline: 'none', background: '#fff',
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true); setError('')
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password })
    if (err || !data.session) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Entrez votre email'); return }
    setLoading(true); setError('')
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setView('sent')
  }

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <a href="/accueil" style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:700,color:'#111',textDecoration:'none',display:'block'}}>✂ Glowify</a>
          <p style={{fontSize:14,color:'#888',marginTop:6}}>
            {view==='login' ? 'Connectez-vous à votre espace' : view==='forgot' ? 'Réinitialiser le mot de passe' : 'Email envoyé'}
          </p>
        </div>

        <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:14,padding:28}}>

          {/* ── Connexion ── */}
          {view === 'login' && (
            <form onSubmit={submit}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="contact@monsalon.fr" style={s}
                  onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                  onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
              </div>
              <div style={{marginBottom:6}}>
                <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••" style={s}
                  onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                  onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
              </div>
              <div style={{textAlign:'right',marginBottom:18}}>
                <button type="button" onClick={()=>{setView('forgot');setError('')}}
                  style={{background:'none',border:'none',fontSize:12,color:'#888',cursor:'pointer',fontFamily:'inherit',padding:0}}>
                  Mot de passe oublié ?
                </button>
              </div>
              {error && <div style={{background:'#fde8e8',border:'1px solid #f0b8b8',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#c03030',marginBottom:14}}>{error}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:9,padding:'13px',fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.7:1}}>
                {loading ? 'Connexion…' : 'Se connecter →'}
              </button>
            </form>
          )}

          {/* ── Mot de passe oublié ── */}
          {view === 'forgot' && (
            <form onSubmit={sendReset}>
              <p style={{fontSize:13,color:'#666',marginBottom:16,lineHeight:1.5}}>
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              <div style={{marginBottom:18}}>
                <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="contact@monsalon.fr" style={s}
                  onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                  onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
              </div>
              {error && <div style={{background:'#fde8e8',border:'1px solid #f0b8b8',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#c03030',marginBottom:14}}>{error}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:9,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:loading?.7:1}}>
                {loading ? 'Envoi…' : 'Envoyer le lien →'}
              </button>
              <button type="button" onClick={()=>{setView('login');setError('')}}
                style={{width:'100%',background:'none',border:'none',fontSize:13,color:'#888',cursor:'pointer',fontFamily:'inherit',marginTop:12}}>
                ← Retour à la connexion
              </button>
            </form>
          )}

          {/* ── Email envoyé ── */}
          {view === 'sent' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>📬</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Vérifiez votre boîte mail</div>
              <p style={{fontSize:13,color:'#666',lineHeight:1.6,marginBottom:20}}>
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.<br/>
                Cliquez sur le lien pour choisir un nouveau mot de passe.
              </p>
              <p style={{fontSize:11,color:'#aaa'}}>Vérifiez aussi vos spams. Le lien expire dans 1 heure.</p>
              <button onClick={()=>setView('login')}
                style={{marginTop:16,background:'none',border:'none',fontSize:13,color:'#888',cursor:'pointer',fontFamily:'inherit'}}>
                ← Retour à la connexion
              </button>
            </div>
          )}

          {view === 'login' && (
            <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#888'}}>
              Pas encore de compte ?{' '}
              <a href="/register" style={{color:'#1a1a1a',fontWeight:600}}>Créer mon espace →</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
