'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const D = {
  dark: '#141210', dark2: '#1a1714', dark3: '#1e1b17',
  gold: '#c9a45c', cream: '#ede6d8', muted: '#b5ac9c',
  border: '#2a2824',
}

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (role === 'client') { router.replace('/home'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
    } catch {}
  }, [router])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: D.dark,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
      backgroundImage: `linear-gradient(rgba(201,164,92,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,164,92,0.04) 1px,transparent 1px)`,
      backgroundSize: '28px 28px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 42, color: D.gold, fontWeight: 700, letterSpacing: '-0.5px' }}>
          ✂ CoiffPro
        </div>
        <div style={{ fontSize: 13, color: D.muted, marginTop: 8, letterSpacing: '2px', textTransform: 'uppercase' }}>
          Coiffure & Barbier
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 18, color: D.cream, fontWeight: 600, marginBottom: 32, textAlign: 'center' }}>
        Vous êtes&nbsp;?
      </div>

      {/* Choix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340 }}>
        {/* Client */}
        <Link href="/onboarding" style={{ textDecoration: 'none' }}>
          <div style={{
            background: D.gold, borderRadius: 16, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: D.dark }}>Je suis client</div>
              <div style={{ fontSize: 12, color: 'rgba(20,18,16,.6)', marginTop: 3 }}>Réserver, mes RDVs, fidélité</div>
            </div>
            <div style={{ fontSize: 28 }}>✂</div>
          </div>
        </Link>

        {/* Pro */}
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'transparent', borderRadius: 16, padding: '20px 24px',
            border: `1.5px solid ${D.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: D.cream }}>Je suis professionnel</div>
              <div style={{ fontSize: 12, color: D.muted, marginTop: 3 }}>Gérer mon salon, clients, RDVs</div>
            </div>
            <div style={{ fontSize: 28 }}>💼</div>
          </div>
        </Link>

        {/* Créer compte pro */}
        <Link href="/register" style={{ textDecoration: 'none' }}>
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: D.muted }}>
            Pro sans compte ? <span style={{ color: D.gold, fontWeight: 600 }}>Créer mon espace →</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
