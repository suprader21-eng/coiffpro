'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type Salon = {
  id: string; name: string; slug: string; city: string
  address: string; description: string; primary_color: string
  accent_color: string; logo_url?: string
}

const POPULAR_CITIES = ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Montpellier', 'Toulouse', 'Nice', 'Nantes', 'Lille', 'Strasbourg']

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSalons([]); setSearched(false); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const j = await r.json()
      setSalons(j.salons || [])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const geolocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`)
          const j = await r.json()
          const city = j.address?.city || j.address?.town || j.address?.village || j.address?.county || ''
          if (city) { setQuery(city); inputRef.current?.focus() }
        } catch {}
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .salon-card:hover{box-shadow:0 8px 32px rgba(0,0,0,.1)!important;transform:translateY(-2px)}
        .salon-card{transition:all .18s ease}
        .city-pill:hover{background:#f0f0f0!important}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .pulse{animation:pulse 1.2s infinite}
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f0f0f0', height: 58, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, letterSpacing: '-.02em' }}>✂ CoiffPro</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link href="/pro" style={{ fontSize: 13, color: '#555', padding: '7px 14px', border: '1px solid #e8e8e8', borderRadius: 9, textDecoration: 'none', fontWeight: 500 }}>Espace Pro</Link>
          <Link href="/login" style={{ fontSize: 13, color: '#fff', background: '#1a1a1a', padding: '7px 14px', borderRadius: 9, textDecoration: 'none', fontWeight: 600 }}>Connexion</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '64px 20px 56px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(32px, 6vw, 58px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 12 }}>
          Votre coiffeur<br /><span style={{ color: '#c8a96e' }}>proche de chez vous</span>
        </div>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', marginBottom: 32, maxWidth: 420, margin: '12px auto 32px' }}>
          Réservez en ligne chez les meilleurs coiffeurs et barbiers de votre ville, en quelques secondes.
        </p>

        {/* Barre de recherche */}
        <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.3)', border: '2px solid transparent' }}>
            <button onClick={geolocate} title="Me localiser" style={{ padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, flexShrink: 0, color: locating ? '#c8a96e' : '#aaa' }}>
              {locating ? <span className="pulse">📍</span> : '📍'}
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ville, quartier, ou nom du salon…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, padding: '16px 0', fontFamily: 'inherit', color: '#1a1a1a' }}
              onKeyDown={e => e.key === 'Enter' && search(query)}
            />
            <button
              onClick={() => search(query)}
              style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '0 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {loading ? '…' : 'Rechercher'}
            </button>
          </div>

          {/* Villes populaires */}
          {!searched && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
              {POPULAR_CITIES.map(city => (
                <button key={city} className="city-pill"
                  onClick={() => setQuery(city)}
                  style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 20, padding: '5px 13px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}>
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Résultats ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✂</div>
            <div style={{ fontSize: 13 }}>Recherche en cours…</div>
          </div>
        )}

        {!loading && searched && salons.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Aucun salon trouvé</div>
            <div style={{ fontSize: 13, color: '#aaa' }}>Essayez une autre ville ou un autre quartier</div>
          </div>
        )}

        {!loading && salons.length > 0 && (
          <>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              {salons.length} salon{salons.length > 1 ? 's' : ''} trouvé{salons.length > 1 ? 's' : ''} pour « {query} »
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {salons.map(salon => (
                <Link key={salon.id} href={`/book/${salon.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="salon-card" style={{ border: '1.5px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', background: '#fff', cursor: 'pointer' }}>
                    {/* Header couleur */}
                    <div style={{ height: 80, background: `linear-gradient(135deg, ${salon.primary_color || '#1a1a1a'} 0%, ${salon.accent_color || '#c8a96e'} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {salon.logo_url
                        ? <img src={salon.logo_url} alt={salon.name} style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                        : <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>✂</div>
                      }
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{salon.name}</div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {salon.address ? `${salon.address}, ` : ''}{salon.city}</div>
                      {salon.description && (
                        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                          {salon.description}
                        </div>
                      )}
                      <div style={{ marginTop: 12, padding: '7px 0', background: salon.primary_color || '#1a1a1a', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                        Réserver →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Bandeau pro si pas encore recherché */}
        {!searched && !loading && (
          <div style={{ marginTop: 32, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Vous êtes coiffeur ou barbier ?</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Rejoignez CoiffPro et gérez votre salon en ligne</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ background: '#1a1a1a', color: '#fff', borderRadius: 10, padding: '11px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Essai gratuit 14 jours →
              </Link>
              <Link href="/pro" style={{ background: '#fff', color: '#555', border: '1px solid #e8e8e8', borderRadius: 10, padding: '11px 22px', fontSize: 13, textDecoration: 'none' }}>
                En savoir plus
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
