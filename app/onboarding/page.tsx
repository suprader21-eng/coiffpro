'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase'

const D = {
  dark: '#141210', dark2: '#1a1714', dark3: '#1e1b17',
  border: '#2a2824', border2: '#3a3630',
  gold: '#c9a45c', cream: '#ede6d8', muted: '#b5ac9c', muted2: '#6b6458',
}

type Screen = 'role' | 'c1' | 'c2' | 'c3' | 'cauth' | 'cdiag' | 'p1' | 'p2' | 'p3' | 'pform'
const ORDER: Screen[] = ['role', 'c1', 'c2', 'c3', 'cauth', 'cdiag', 'p1', 'p2', 'p3', 'pform']

const slideStyle = (screen: Screen, current: Screen, prev: Screen | null): React.CSSProperties => {
  const ci = ORDER.indexOf(current), si = ORDER.indexOf(screen)
  const pi = prev ? ORDER.indexOf(prev) : -1
  let tx = '100%'
  if (screen === current) tx = '0'
  else if (pi >= 0 && si === pi) tx = ci > pi ? '-100%' : '100%'
  return {
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    transform: `translateX(${tx})`, opacity: screen === current ? 1 : 0,
    transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s ease',
    pointerEvents: screen === current ? 'auto' : 'none',
  }
}

const gridBg: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  backgroundImage: `linear-gradient(rgba(201,164,92,0.045) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(201,164,92,0.045) 1px,transparent 1px)`,
  backgroundSize: '28px 28px',
}

function StatusBar() {
  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 22px 0', flexShrink: 0 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: D.cream }}>9:41</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill={D.cream}>
          <rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/>
          <rect x="9" y="0" width="3" height="12" rx="1"/><rect x="13.5" y="1" width="2.5" height="11" rx="1" opacity=".3"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke={D.cream}>
          <rect x="0" y="1.5" width="21" height="9" rx="2" strokeWidth="1.2"/>
          <rect x="22" y="4" width="3" height="4" rx="1" fill={D.cream} stroke="none"/>
          <rect x="1.5" y="3" width="15" height="6" rx="1" fill={D.cream} stroke="none"/>
        </svg>
      </div>
    </div>
  )
}

interface SlideScreenProps {
  icon: React.ReactNode
  title: string
  body: string
  dots: [boolean, boolean, boolean]
  onSkip: () => void
  onNext: () => void
  nextLabel?: string
}
function SlideScreen({ icon, title, body, dots, onSkip, onNext, nextLabel = 'Continuer →' }: SlideScreenProps) {
  return (
    <>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={gridBg} />
        <div style={{ position: 'relative', marginBottom: 26, zIndex: 1 }}>
          <div style={{ position: 'absolute', inset: -16, borderRadius: 42, border: `1px solid rgba(201,164,92,0.05)` }} />
          <div style={{ position: 'absolute', inset: -8, borderRadius: 34, border: `1px solid rgba(201,164,92,0.12)` }} />
          <div style={{ width: 86, height: 86, borderRadius: 26, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.dark3 }}>
            {icon}
          </div>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 25, color: D.cream, marginBottom: 12, lineHeight: 1.25, position: 'relative', zIndex: 1 }} dangerouslySetInnerHTML={{ __html: title }} />
        <div style={{ fontSize: 13, color: D.muted, lineHeight: 1.7, maxWidth: 260, position: 'relative', zIndex: 1 }}>{body}</div>
      </div>
      <div style={{ padding: '16px 24px 28px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
          {dots.map((on, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, background: on ? D.gold : D.border2, width: on ? 20 : 6, transition: 'all .3s ease' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSkip} style={{ flex: 1, padding: 14, borderRadius: 12, background: D.dark3, border: `1px solid ${D.border}`, color: D.muted, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Passer
          </button>
          <button onClick={onNext} style={{ flex: 2, padding: 14, borderRadius: 12, background: D.gold, border: 'none', color: D.dark, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {nextLabel}
          </button>
        </div>
      </div>
    </>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('role')
  const [prev, setPrev] = useState<Screen | null>(null)
  const [form, setForm] = useState({ salonName: '', firstName: '', phone: '', email: '', city: '' })
  const [firstName, setFirstName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [diagServices, setDiagServices] = useState<string[]>([])
  const [diagFreq, setDiagFreq] = useState('')
  const [diagStyle, setDiagStyle] = useState('')

  useEffect(() => {
    try {
      const role = localStorage.getItem('cp_role')
      if (role === 'client') { router.replace('/home'); return }
      if (role === 'pro') { router.replace('/dashboard'); return }
      // Pré-remplir téléphone si le client vient de réserver
      const savedPhone = localStorage.getItem('cp_phone')
      if (savedPhone) setClientPhone(savedPhone)
    } catch {}
  }, [router])

  const goTo = (next: Screen) => {
    setPrev(screen)
    setScreen(next)
  }

  const doneClient = () => {
    try { localStorage.setItem('cp_role', 'client') } catch {}
    router.replace('/home')
  }

  const donePro = async () => {
    setSubmitting(true)
    try { localStorage.setItem('cp_role', 'pro') } catch {}
    await new Promise(r => setTimeout(r, 600))
    router.replace('/dashboard')
  }

  const wrap: React.CSSProperties = {
    position: 'fixed', inset: 0, background: D.dark, overflow: 'hidden',
    fontFamily: "'DM Sans', 'Outfit', -apple-system, sans-serif",
  }

  return (
    <div style={wrap}>

      {/* ── ROLE SELECTION ── */}
      <div style={slideStyle('role', screen, prev)}>
        <StatusBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px 20px', position: 'relative' }}>
          <div style={gridBg} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, border: `1px solid ${D.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 20 L14 6 L20 20" stroke={D.gold} strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 15 L18 15" stroke={D.gold} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
              </svg>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, color: D.gold, marginBottom: 6, letterSpacing: '0.5px' }}>CoiffPro</div>
            <div style={{ fontSize: 11, color: D.muted, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 40 }}>Réservation & Gestion</div>
            <div style={{ fontSize: 16, color: D.cream, fontWeight: 500, marginBottom: 20, textAlign: 'center' }}>Vous êtes…</div>

            <button onClick={() => goTo('c1')} style={{ width: '100%', padding: '16px 20px', borderRadius: 14, background: D.gold, border: 'none', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', marginBottom: 12, textAlign: 'left' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(20,18,16,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="3.5" stroke="#141210" strokeWidth="1.5"/><path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#141210" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: D.dark }}>Je cherche un coiffeur</span>
                <span style={{ display: 'block', fontSize: 11, color: 'rgba(20,18,16,0.6)', marginTop: 2 }}>Réserver un RDV facilement</span>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(20,18,16,0.4)' }}>→</span>
            </button>

            <button onClick={() => goTo('p1')} style={{ width: '100%', padding: '16px 20px', borderRadius: 14, background: D.dark3, border: `1px solid ${D.border2}`, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(201,164,92,0.1)', border: `1px solid ${D.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke={D.gold} strokeWidth="1.5"/><path d="M7 10h6M10 7v6" stroke={D.gold} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: D.cream }}>Je gère mon salon</span>
                <span style={{ display: 'block', fontSize: 11, color: D.muted, marginTop: 2 }}>Dashboard pro &amp; planning</span>
              </div>
              <span style={{ fontSize: 16, color: D.muted2 }}>→</span>
            </button>

            <div style={{ fontSize: 12, color: D.muted2, marginTop: 10 }}>
              Coiffeur pro ?{' '}
              <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: D.gold, fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Connexion salon →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CLIENT SLIDES ── */}
      <div style={slideStyle('c1', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><path d="M12 32 L21 10 L30 32" stroke={D.gold} strokeWidth="2.5" strokeLinecap="round"/><path d="M14.5 25 L27.5 25" stroke={D.gold} strokeWidth="2" strokeLinecap="round" opacity=".6"/><circle cx="34" cy="12" r="3" fill="rgba(201,164,92,0.2)" stroke={D.gold} strokeWidth="1.5"/><path d="M34 10.5v3M32.5 12h3" stroke={D.gold} strokeWidth="1.2" strokeLinecap="round"/></svg>}
          title="Votre coiffeur,<br/>en quelques clics"
          body="Trouvez le meilleur salon près de vous, consultez les disponibilités en temps réel et réservez sans aucun appel."
          dots={[true, false, false]}
          onSkip={doneClient}
          onNext={() => goTo('c2')}
        />
      </div>

      <div style={slideStyle('c2', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><rect x="8" y="10" width="26" height="22" rx="4" stroke={D.gold} strokeWidth="2"/><path d="M14 10V7M28 10V7" stroke={D.gold} strokeWidth="2" strokeLinecap="round"/><path d="M8 17h26" stroke={D.gold} strokeWidth="1.5" opacity=".4"/><rect x="13" y="22" width="7" height="6" rx="1.5" fill="rgba(201,164,92,0.25)" stroke={D.gold} strokeWidth="1.2"/></svg>}
          title="Réservez en<br/>moins d'une minute"
          body="Choisissez votre prestation, votre coiffeur et votre créneau. Un SMS de confirmation vous est envoyé immédiatement."
          dots={[false, true, false]}
          onSkip={doneClient}
          onNext={() => goTo('c3')}
        />
      </div>

      <div style={slideStyle('c3', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="11" stroke={D.gold} strokeWidth="2"/><path d="M21 14v7l4 3" stroke={D.gold} strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="14" r="3.5" fill="rgba(201,164,92,0.15)" stroke={D.gold} strokeWidth="1.5"/><circle cx="34" cy="30" r="3.5" fill="rgba(201,164,92,0.15)" stroke={D.gold} strokeWidth="1.5"/></svg>}
          title="Rappels, historique<br/>& fidélité"
          body="Recevez un rappel SMS 24h avant. Retrouvez tout votre historique de visites et profitez des offres de fidélité."
          dots={[false, false, true]}
          onSkip={doneClient}
          onNext={() => goTo('cauth')}
          nextLabel="C'est parti →"
        />
      </div>

      {/* ── CLIENT AUTH ── */}
      <div style={slideStyle('cauth', screen, prev)}>
        <StatusBar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px', justifyContent: 'center' }}>
          <button onClick={() => goTo('c3')} style={{ background: 'none', border: 'none', color: D.gold, fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: '0 0 32px', fontFamily: 'inherit', textAlign: 'left' }}>
            ← Retour
          </button>

          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, color: D.gold, marginBottom: 4 }}>CoiffPro</div>
          <div style={{ fontSize: 22, color: D.cream, fontWeight: 600 }}>Bienvenue 👋</div>
          <div style={{ fontSize: 13, color: D.muted, marginTop: 6, marginBottom: 36, lineHeight: 1.5 }}>
            Entrez votre prénom pour personnaliser votre expérience
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Prénom (optionnel)</div>
            <input
              type="text"
              placeholder="Votre prénom"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setAuthError('') }}
              style={{ width: '100%', background: D.dark3, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px 16px', fontSize: 15, color: D.cream, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Téléphone (pour retrouver vos RDVs)</div>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={clientPhone}
              onChange={e => { setClientPhone(e.target.value); setAuthError('') }}
              style={{ width: '100%', background: D.dark3, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px 16px', fontSize: 15, color: D.cream, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true)
                setAuthError('')
                try {
                  const sb = getBrowserClient()
                  const { data: { session } } = await sb.auth.signInAnonymously()
                  // Lier au client existant si téléphone fourni
                  if (clientPhone.trim() && session?.access_token) {
                    const salonId = localStorage.getItem('cp_salon_id')
                    if (salonId) {
                      await fetch('/api/client/me', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                        body: JSON.stringify({ action: 'link_account', phone: clientPhone.trim(), salonId, name: firstName.trim() || undefined }),
                      })
                    }
                  }
                } catch {}
                try {
                  localStorage.setItem('cp_role', 'client')
                  if (firstName.trim()) localStorage.setItem('cp_firstName', firstName.trim())
                  if (clientPhone.trim()) localStorage.setItem('cp_phone', clientPhone.trim())
                } catch {}
                setSubmitting(false)
                goTo('cdiag')
              }}
              style={{ width: '100%', padding: 16, borderRadius: 13, background: submitting ? 'rgba(201,164,92,0.5)' : D.gold, border: 'none', color: D.dark, fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}
            >
              {submitting ? 'Chargement…' : 'Commencer →'}
            </button>
            {authError && <div style={{ fontSize: 11, color: '#e07070', textAlign: 'center' }}>{authError}</div>}
            <button
              onClick={() => {
                try { localStorage.setItem('cp_role', 'client') } catch {}
                goTo('cdiag')
              }}
              style={{ width: '100%', padding: 14, borderRadius: 13, background: 'none', border: `1px solid ${D.border}`, color: D.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Passer pour l'instant
            </button>
          </div>
        </div>
      </div>

      {/* ── CLIENT DIAGNOSTIC ── */}
      <div style={slideStyle('cdiag', screen, prev)}>
        <StatusBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', scrollbarWidth: 'none' }}>
          <div style={{ paddingBottom: 4 }}>
            <button onClick={() => goTo('cauth')} style={{ background: 'none', border: 'none', color: D.gold, fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: '12px 0', fontFamily: 'inherit' }}>
              ← Retour
            </button>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: D.gold }}>CoiffPro</div>
            <div style={{ fontSize: 20, color: D.cream, fontWeight: 600, marginTop: 2 }}>Votre profil</div>
            <div style={{ fontSize: 12, color: D.muted, marginTop: 4, lineHeight: 1.5 }}>Quelques questions pour personnaliser votre expérience</div>
          </div>

          {/* Q1 — Services */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Ce que vous cherchez</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'coupe', label: 'Coupe', emoji: '✂', sub: 'Cheveux' },
                { id: 'barbe', label: 'Barbe', emoji: '🪒', sub: 'Taille & soin' },
                { id: 'les-deux', label: 'Les deux', emoji: '✨', sub: 'Coupe + barbe' },
                { id: 'soins', label: 'Soins', emoji: '💆', sub: 'Visage & peau' },
              ].map(opt => {
                const sel = diagServices.includes(opt.id)
                return (
                  <button key={opt.id}
                    onClick={() => setDiagServices(s => sel ? s.filter(x => x !== opt.id) : [...s, opt.id])}
                    style={{ padding: '14px 12px', borderRadius: 12, background: sel ? 'rgba(201,164,92,0.15)' : D.dark3, border: `1px solid ${sel ? D.gold : D.border}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s ease' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: sel ? D.gold : D.cream }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: D.muted, marginTop: 2 }}>{opt.sub}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Q2 — Fréquence */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Fréquence de visite</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: '2x-mois', label: 'Toutes les 2 semaines' },
                { id: '1x-mois', label: '1 fois par mois' },
                { id: '2mois', label: 'Tous les 2 mois' },
                { id: 'besoin', label: 'Selon mes besoins' },
              ].map(opt => {
                const sel = diagFreq === opt.id
                return (
                  <button key={opt.id} onClick={() => setDiagFreq(opt.id)}
                    style={{ padding: '12px 16px', borderRadius: 10, background: sel ? 'rgba(201,164,92,0.12)' : D.dark3, border: `1px solid ${sel ? D.gold : D.border}`, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all .15s ease' }}>
                    <span style={{ fontSize: 13, color: sel ? D.gold : D.cream }}>{opt.label}</span>
                    {sel && <span style={{ fontSize: 12, color: D.gold }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Q3 — Style */}
          <div style={{ marginTop: 22, paddingBottom: 8 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Votre style</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'classique', label: 'Classique' },
                { id: 'moderne', label: 'Moderne' },
                { id: 'tendance', label: 'Tendance' },
                { id: 'variable', label: 'Ça change !' },
              ].map(opt => {
                const sel = diagStyle === opt.id
                return (
                  <button key={opt.id} onClick={() => setDiagStyle(opt.id)}
                    style={{ padding: '9px 18px', borderRadius: 20, background: sel ? 'rgba(201,164,92,0.15)' : D.dark3, border: `1px solid ${sel ? D.gold : D.border}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s ease' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: sel ? D.gold : D.muted }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px 28px' }}>
          <button
            onClick={() => {
              try {
                localStorage.setItem('cp_prefs', JSON.stringify({ services: diagServices, freq: diagFreq, style: diagStyle }))
              } catch {}
              router.replace('/home')
            }}
            style={{ width: '100%', padding: 16, borderRadius: 13, background: D.gold, border: 'none', color: D.dark, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Créer mon espace →
          </button>
          <button
            onClick={() => router.replace('/home')}
            style={{ width: '100%', padding: 14, borderRadius: 13, background: 'none', border: `1px solid ${D.border}`, color: D.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 10 }}
          >
            Passer pour l'instant
          </button>
        </div>
      </div>

      {/* ── PRO SLIDES ── */}
      <div style={slideStyle('p1', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><rect x="6" y="8" width="30" height="26" rx="4" stroke={D.gold} strokeWidth="2"/><path d="M6 16h30" stroke={D.gold} strokeWidth="1.5" opacity=".4"/><path d="M14 8V5M28 8V5" stroke={D.gold} strokeWidth="2" strokeLinecap="round"/><rect x="12" y="21" width="7" height="8" rx="2" fill="rgba(201,164,92,0.2)" stroke={D.gold} strokeWidth="1.3"/><rect x="23" y="21" width="7" height="5" rx="2" fill="rgba(201,164,92,0.1)" stroke={D.gold} strokeWidth="1.3" strokeDasharray="2 1.5"/></svg>}
          title="Planning intelligent,<br/>zéro appel manqué"
          body="Vos clients réservent en ligne 24h/24. Gérez vos créneaux, congés et équipe depuis votre téléphone."
          dots={[true, false, false]}
          onSkip={() => goTo('pform')}
          onNext={() => goTo('p2')}
        />
      </div>

      <div style={slideStyle('p2', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="15" r="6" stroke={D.gold} strokeWidth="2"/><path d="M8 36c0-7.2 5.8-13 13-13s13 5.8 13 13" stroke={D.gold} strokeWidth="2" strokeLinecap="round"/><rect x="27" y="24" width="12" height="9" rx="2.5" fill="rgba(201,164,92,0.15)" stroke={D.gold} strokeWidth="1.3"/><path d="M29 28h8M29 31h5" stroke={D.gold} strokeWidth="1" strokeLinecap="round" opacity=".7"/></svg>}
          title="Clients fidélisés,<br/>SMS automatisés"
          body="Confirmations, rappels 24h avant et relances des clients inactifs — tout se fait automatiquement, sans intervention."
          dots={[false, true, false]}
          onSkip={() => goTo('pform')}
          onNext={() => goTo('p3')}
        />
      </div>

      <div style={slideStyle('p3', screen, prev)}>
        <SlideScreen
          icon={<svg width="42" height="42" viewBox="0 0 42 42" fill="none"><rect x="6" y="28" width="6" height="8" rx="1.5" fill="rgba(201,164,92,0.15)" stroke={D.gold} strokeWidth="1.3"/><rect x="15" y="22" width="6" height="14" rx="1.5" fill="rgba(201,164,92,0.25)" stroke={D.gold} strokeWidth="1.3"/><rect x="24" y="16" width="6" height="20" rx="1.5" fill="rgba(201,164,92,0.4)" stroke={D.gold} strokeWidth="1.3"/><rect x="33" y="10" width="4" height="26" rx="1.5" fill="rgba(201,164,92,0.6)" stroke={D.gold} strokeWidth="1.3"/><path d="M6 8l8 6 10-4 12-6" stroke={D.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          title="Votre chiffre d'affaires,<br/>en temps réel"
          body="Suivez vos revenus, les prestations les plus populaires et la fidélité de vos clients depuis un seul tableau de bord."
          dots={[false, false, true]}
          onSkip={() => goTo('pform')}
          onNext={() => goTo('pform')}
          nextLabel="Créer mon salon →"
        />
      </div>

      {/* ── PRO FORM ── */}
      <div style={slideStyle('pform', screen, prev)}>
        <StatusBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', scrollbarWidth: 'none' }}>
          <div style={{ paddingBottom: 20 }}>
            <button onClick={() => goTo('p3')} style={{ background: 'none', border: 'none', color: D.gold, fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: '12px 0', fontFamily: 'inherit' }}>
              ← Retour
            </button>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: D.gold }}>CoiffPro</div>
            <div style={{ fontSize: 20, color: D.cream, fontWeight: 600, marginTop: 2 }}>Créez votre salon</div>
            <div style={{ fontSize: 12, color: D.muted, marginTop: 4 }}>Rejoignez des centaines de coiffeurs</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,164,92,0.1)', border: '1px solid rgba(201,164,92,0.25)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: D.gold, marginTop: 12 }}>
              ✦ 14 jours gratuits · Sans carte bancaire
            </div>
          </div>
          {[
            { label: 'Nom du salon', key: 'salonName', placeholder: 'Salon Élite Paris', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'marc@salon.fr', type: 'email' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', background: D.dark3, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: D.cream, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {[
              { label: 'Prénom', key: 'firstName', placeholder: 'Marc', type: 'text' },
              { label: 'Téléphone', key: 'phone', placeholder: '06 12 34…', type: 'tel' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', background: D.dark3, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: D.cream, fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: D.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Ville</div>
            <input
              type="text"
              placeholder="Paris, Lyon, Marseille…"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              style={{ width: '100%', background: D.dark3, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: D.cream, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ padding: '16px 24px 28px' }}>
          <button
            onClick={donePro}
            disabled={submitting}
            style={{ width: '100%', padding: 15, borderRadius: 13, background: submitting ? 'rgba(201,164,92,0.5)' : D.gold, border: 'none', color: D.dark, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}
          >
            {submitting ? 'Création…' : 'Créer mon salon →'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: D.muted2, marginTop: 10 }}>
            Déjà un compte ?{' '}
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: D.gold, fontWeight: 500, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              Se connecter
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
