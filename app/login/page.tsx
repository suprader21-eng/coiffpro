'use client'
import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Remplissez tous les champs'); return }
    setLoading(true); setError('')

    const sb = getBrowserClient()
    const { data, error: err } = await sb.auth.signInWithPassword({ email, password })

    if (err || !data.session) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    // Force full page reload pour que Next.js lise bien la nouvelle session
    window.location.href = '/dashboard'
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
          <p style={{fontSize:14,color:'#888',marginTop:6}}>Connectez-vous à votre espace</p>
        </div>
        <div style={{background:'#fff',border:'1px solid #e8e8e8',borderRadius:14,padding:28}}>
          <form onSubmit={submit}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="contact@monsalon.fr" style={s}
                onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:11,color:'#666',textTransform:'uppercase' as const,letterSpacing:'.05em',display:'block',marginBottom:5}}>Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" style={s}
                onFocus={e=>e.target.style.borderColor='#1a1a1a'}
                onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
            </div>
            {error && (
              <div style={{background:'#fde8e8',border:'1px solid #f0b8b8',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#c03030',marginBottom:14}}>{error}</div>
            )}
            <button type="submit" disabled={loading} style={{width:'100%',background:'#1a1a1a',color:'#fff',border:'none',borderRadius:9,padding:'13px',fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',fontFamily:'inherit',opacity:loading?.7:1}}>
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>
          <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#888'}}>
            Pas encore de compte ?{' '}
            <a href="/register" style={{color:'#1a1a1a',fontWeight:600}}>Créer mon espace →</a>
          </p>
        </div>
      </div>
    </div>
  )
}
