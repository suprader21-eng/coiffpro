'use client'
import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [ready, setReady]         = useState(false)

  const sb = getBrowserClient()

  // Supabase injecte la session via le hash de l'URL (#access_token=...)
  // onAuthStateChange détecte l'événement PASSWORD_RECOVERY
  useEffect(() => {
    const { data: listener } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    setLoading(true); setError('')
    const { error: err } = await sb.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/dashboard' }, 2500)
  }

  const s: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e8e8e8', borderRadius: 9,
    padding: '11px 14px', fontSize: 14, fontFamily: 'inherit',
    color: '#111', outline: 'none', background: '#fff',
  }

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",padding:20}}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <a href="/accueil" style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:700,color:'#111',textDecoration:'none',display:'block'}}>✂ CoiffPro</a>
          <p style={{fontSize:14,color:'#888',marginTop:6}}>Nouveau mot de passe</p>
        </div>

        <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:14,padding:28}}>
          {done ? (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>Mot de passe mis à jour !</div>
              <p style={{fontSize:13,color:'#666'}}>Redirection vers votre dashboard…</p>
            </div>
          ) : !ready ? (
            <div style={{textAlign:'center',padding:'20px 0'}}>
              <div style={{fontSize:13,color:'#888'}}>Vérification du lien…</div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Nouveau mot de passe</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères" style={s}
                  onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                  onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
              </div>
              <div style={{marginBottom:18}}>
                <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Confirmer le mot de passe</label>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="••••••••" style={s}
                  onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                  onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
              </div>
              {error && <div style={{background:'#fde8e8',border:'1px solid #f0b8b8',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#c03030',marginBottom:14}}>{error}</div>}
              <button type="submit" disabled={loading} style={{width:'100%',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:9,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',opacity:loading?.7:1}}>
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
