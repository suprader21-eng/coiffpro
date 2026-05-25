'use client'
import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WelcomePage() {
  const [msg, setMsg] = useState('Chargement…')
  const router = useRouter()

  useEffect(() => {
    getBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMsg('Espace prêt ! Redirection vers votre dashboard…')
        setTimeout(() => router.push('/dashboard'), 1200)
      } else {
        setMsg('Compte créé avec succès ! Connectez-vous pour accéder à votre espace.')
        setTimeout(() => router.push('/login'), 2000)
      }
    })
  }, [])

  return (
    <div style={{minHeight:'100vh',background:'#fafafa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <div style={{textAlign:'center',padding:32,maxWidth:440}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'#e8f7ee',border:'2px solid #1a9648',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,margin:'0 auto 20px'}}>✓</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:700,marginBottom:10}}>Bienvenue sur Glowify !</h1>
        <p style={{fontSize:14,color:'#666',marginBottom:22,lineHeight:1.7}}>{msg}</p>
        <a href="/login" style={{display:'inline-block',background:'#1a1a1a',color:'#fff',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:600,textDecoration:'none'}}>
          Se connecter →
        </a>
      </div>
    </div>
  )
}
