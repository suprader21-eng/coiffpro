'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getBrowserClient } from '@/lib/supabase'
import { useTheme, useToast } from '@/app/providers'

type Salon = {
  id: string; slug: string; name: string; owner_name: string; email: string; phone: string
  city: string; status: string; plan: string; created_at: string; trial_ends_at: string
  stripe_subscription_status: string; admin_notes: string; admin_message: string
  custom_domain: string; primary_color: string; accent_color: string
  client_count: number; appointment_count: number; employee_count: number
}

const ini = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
const statusColor = (s: string) => s === 'active' ? { bg: '#e8f7ee', color: '#1a9648', border: '#b8dfc6' } : s === 'trial' ? { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd' } : { bg: '#fde8e8', color: '#d04040', border: '#f0b8b8' }
const statusLabel = (s: string) => s === 'active' ? 'Actif' : s === 'trial' ? 'Essai' : 'Suspendu'
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default function AdminPage() {
  const { theme, toggle } = useTheme()
  const { addToast } = useToast()
  const [page, setPage] = useState('overview')
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [sel, setSel] = useState<Salon | null>(null)
  const [search, setSearch] = useState('')
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    const sb = getBrowserClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      tokenRef.current = session.access_token
      fetch('/api/admin', { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then(async r => {
          const j = await r.json()
          if (!r.ok) { setApiError(`Erreur ${r.status}: ${j.error || 'inconnue'}`); setLoading(false); return }
          setSalons(j.salons || [])
          setLoading(false)
        })
        .catch(e => { setApiError('Erreur réseau: ' + e.message); setLoading(false) })
    })
  }, [])

  const call = useCallback(async (action: string, id: string, data: Record<string, string>) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ action, id, data }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erreur')
    return json
  }, [])

  const active = salons.filter(s => s.status === 'active')
  const trials = salons.filter(s => s.status === 'trial')
  const mrr = active.length * 50
  const totalClients = salons.reduce((s, x) => s + (x.client_count || 0), 0)
  const filtered = salons.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',system-ui,sans-serif", background: '#fafafa' }}>
      <div style={{ fontSize: 14, color: '#888' }}>Chargement…</div>
    </div>
  )

  if (apiError) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',system-ui,sans-serif", background: '#fafafa', gap: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#d04040' }}>Accès refusé ou erreur API</div>
      <div style={{ fontSize: 13, color: '#888', padding: '10px 20px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, maxWidth: 500, wordBreak: 'break-all' }}>{apiError}</div>
      <div style={{ fontSize: 12, color: '#aaa' }}>Vérifiez que la variable ADMIN_EMAIL dans Vercel correspond à votre email de connexion, ou supprimez-la pour autoriser tous les comptes.</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: "'Outfit',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#fff;--s1:#fafafa;--b1:#e8e8e8;--b2:#d0d0d0;--t1:#111;--t2:#666;--t3:#bbb;--green:#1a9648;--red:#d04040;--purple:#7c3aed;--gold:#b8922a}
        [data-theme="dark"]{--bg:#080808;--s1:#0e0e0e;--b1:#1e1e1e;--b2:#2c2c2c;--t1:#f2f2f2;--t2:#888;--t3:#333}
        body{background:var(--bg);color:var(--t1)}
        .card{background:var(--bg);border:1px solid var(--b1);border-radius:10px;padding:14px 16px}
        .input{background:var(--bg);border:1px solid var(--b2);border-radius:8px;padding:8px 11px;font-size:12px;color:var(--t1);font-family:inherit;width:100%}
        .input:focus{outline:none;border-color:#999}
        .textarea{background:var(--bg);border:1px solid var(--b2);border-radius:8px;padding:8px 11px;font-size:12px;color:var(--t1);font-family:inherit;width:100%;resize:vertical;min-height:80px}
        .textarea:focus{outline:none;border-color:#999}
        .table{width:100%;border-collapse:collapse}
        .table th{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding:0 8px 9px;text-align:left;border-bottom:1px solid var(--b1);font-weight:500}
        .table td{padding:9px 8px;border-bottom:1px solid var(--b1);font-size:12px}
        .badge{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:600}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
        .btn{background:var(--t1);color:var(--bg);border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-ghost{background:var(--bg);color:var(--t1);border:1px solid var(--b2);border-radius:8px;padding:7px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit}
        .btn-sm{background:var(--t1);color:var(--bg);border:none;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-purple{background:var(--purple);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-red{background:var(--red);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
        .btn-green{background:var(--green);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:768px){.g4{grid-template-columns:1fr 1fr}.mob-hide{display:none}}
      `}</style>

      {/* NAV */}
      <nav style={{ height: 50, background: 'var(--bg)', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, position: 'sticky', top: 0, zIndex: 60 }}>
        <span style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700 }}>✂ Glowify</span>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: '#ede9fe', color: 'var(--purple)', fontWeight: 600, border: '1px solid #c4b5fd' }}>Admin</span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          {[
            { id: 'overview', label: "Vue d'ensemble" },
            { id: 'salons', label: 'Salons' },
            { id: 'support', label: 'Support' },
            { id: 'messages', label: 'Messages' },
            { id: 'domaines', label: 'Domaines' },
          ].map(p => (
            <div key={p.id} onClick={() => { setPage(p.id); setSel(null) }} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: page === p.id ? 'var(--t1)' : 'transparent', color: page === p.id ? 'var(--bg)' : 'var(--t2)', fontWeight: page === p.id ? 600 : 400 }}>
              {p.label}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={toggle} style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 7, padding: '5px 9px', fontSize: 11, cursor: 'pointer', color: 'var(--t1)' }}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>A</div>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '18px', background: 'var(--s1)', overflow: 'auto' }}>

        {/* ── VUE D'ENSEMBLE ── */}
        {page === 'overview' && <>
          <div className="g4">
            {[
              { l: 'MRR réel', v: `${mrr}€`, s: `${active.length} salons actifs × 50€`, up: true },
              { l: 'ARR estimé', v: `${mrr * 12}€`, s: 'si churn = 0', up: true },
              { l: 'En essai', v: trials.length, s: `+${trials.length * 50}€ potentiel` },
              { l: 'Clients gérés', v: totalClients, s: 'au total sur la plateforme', up: true },
            ].map((s, i) => (
              <div key={i} className="card" style={{ borderTop: '3px solid var(--purple)' }}>
                <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{s.v}</div>
                {s.s && <div style={{ fontSize: 10, color: s.up ? 'var(--green)' : 'var(--t3)', marginTop: 4 }}>{s.s}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="card">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Tous les salons</div>
              {salons.slice(0, 6).map(s => {
                const sc = statusColor(s.status)
                return (
                  <div key={s.id} onClick={() => { setSel(s); setPage('salons') }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--b1)', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: (s.primary_color || '#c8a96e') + '22', color: s.primary_color || '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{ini(s.name)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.owner_name} · {s.city || '—'} · {s.client_count} clients</div>
                    </div>
                    <span className="badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{statusLabel(s.status)}</span>
                  </div>
                )
              })}
              {salons.length > 6 && <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', paddingTop: 10 }}>+{salons.length - 6} autres →</div>}
            </div>

            <div className="card">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Répartition par statut</div>
              {[
                { label: 'Actifs', count: active.length, color: 'var(--green)' },
                { label: 'En essai', count: trials.length, color: 'var(--purple)' },
                { label: 'Suspendus', count: salons.filter(s => s.status === 'suspended').length, color: 'var(--red)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)', width: 80 }}>{row.label}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--b1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: row.color, width: salons.length ? `${Math.round(row.count / salons.length * 100)}%` : '0%', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, width: 24, textAlign: 'right' }}>{row.count}</span>
                </div>
              ))}

              <div style={{ marginTop: 16, fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Messages en attente</div>
              {salons.filter(s => s.admin_message).length === 0
                ? <div style={{ fontSize: 12, color: 'var(--t3)' }}>Aucun message en cours</div>
                : salons.filter(s => s.admin_message).map(s => (
                  <div key={s.id} style={{ fontSize: 12, padding: '6px 10px', background: '#ede9fe', borderRadius: 7, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{s.name}</span> : {s.admin_message.slice(0, 60)}{s.admin_message.length > 60 ? '…' : ''}
                  </div>
                ))
              }
            </div>
          </div>
        </>}

        {/* ── SALONS ── */}
        {page === 'salons' && <>
          {sel ? (
            <SalonDetail
              salon={sel}
              onBack={() => setSel(null)}
              call={call}
              addToast={addToast}
              onUpdate={(updated) => {
                setSalons(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s))
                setSel(s => s ? { ...s, ...updated } : s)
              }}
            />
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input className="input" placeholder="Rechercher un salon…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t2)', display: 'flex', alignItems: 'center' }}>{filtered.length} salon{filtered.length > 1 ? 's' : ''}</span>
              </div>
              <div className="card">
                <table className="table">
                  <thead><tr>
                    <th>Salon</th><th>Propriétaire</th><th className="mob-hide">Email</th>
                    <th>Clients</th><th>RDV</th><th>Statut</th><th></th>
                  </tr></thead>
                  <tbody>{filtered.map(s => {
                    const sc = statusColor(s.status)
                    return <tr key={s.id}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: (s.primary_color || '#c8a96e') + '22', color: s.primary_color || '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{ini(s.name)}</div>
                        <div><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.city || '—'}</div></div>
                      </div></td>
                      <td style={{ color: 'var(--t2)' }}>{s.owner_name}</td>
                      <td className="mob-hide" style={{ color: 'var(--t2)', fontSize: 11 }}>{s.email}</td>
                      <td style={{ fontWeight: 600 }}>{s.client_count}</td>
                      <td style={{ color: 'var(--t2)' }}>{s.appointment_count}</td>
                      <td><span className="badge" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{statusLabel(s.status)}</span></td>
                      <td><button className="btn-sm" onClick={() => setSel(s)}>Gérer</button></td>
                    </tr>
                  })}</tbody>
                </table>
              </div>
            </>
          )}
        </>}

        {/* ── SUPPORT ── */}
        {page === 'support' && (
          <AdminSupportPage salons={salons} call={call} addToast={addToast} />
        )}

        {/* ── MESSAGES ── */}
        {page === 'messages' && (
          <MessagesPage salons={salons} call={call} addToast={addToast}
            onUpdate={(id, msg) => setSalons(prev => prev.map(s => s.id === id ? { ...s, admin_message: msg } : s))} />
        )}

        {/* ── DOMAINES ── */}
        {page === 'domaines' && (
          <DomainsPage salons={salons} call={call} addToast={addToast}
            onUpdate={(id, domain) => setSalons(prev => prev.map(s => s.id === id ? { ...s, custom_domain: domain } : s))} />
        )}

      </div>
    </div>
  )
}

/* ── DETAIL SALON ── */
function SalonDetail({ salon, onBack, call, addToast, onUpdate }: {
  salon: Salon; onBack: () => void
  call: (action: string, id: string, data: Record<string, string>) => Promise<any>
  addToast: (m: string) => void
  onUpdate: (data: Partial<Salon>) => void
}) {
  const [notes, setNotes] = useState(salon.admin_notes || '')
  const [message, setMessage] = useState(salon.admin_message || '')
  const [saving, setSaving] = useState<string | null>(null)
  const sc = statusColor(salon.status)

  const save = async (action: string, data: Record<string, string>, label: string) => {
    setSaving(action)
    try {
      await call(action, salon.id, data)
      addToast(`✅ ${label}`)
      onUpdate(data as any)
    } catch (e: any) { addToast('❌ ' + e.message) }
    setSaving(null)
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--t2)', marginBottom: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
        ← Retour à la liste
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Infos salon */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: (salon.primary_color || '#c8a96e') + '22', color: salon.primary_color || '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{ini(salon.name)}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{salon.name}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{salon.owner_name} · {salon.city || '—'}</div>
            </div>
            <span className="badge" style={{ marginLeft: 'auto', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{statusLabel(salon.status)}</span>
          </div>
          {[
            ['Email', salon.email],
            ['Téléphone', salon.phone || '—'],
            ['Slug', `/${salon.slug}`],
            ['Clients', salon.client_count + ' clients'],
            ['RDV total', salon.appointment_count + ' rendez-vous'],
            ['Employés actifs', salon.employee_count + ''],
            ['Inscrit le', new Date(salon.created_at).toLocaleDateString('fr-FR')],
            ['Essai jusqu\'au', salon.trial_ends_at ? new Date(salon.trial_ends_at).toLocaleDateString('fr-FR') : '—'],
            ['Stripe', salon.stripe_subscription_status || '—'],
            ['Domaine custom', salon.custom_domain || '—'],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--b1)', fontSize: 12 }}>
              <span style={{ color: 'var(--t2)' }}>{l}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => window.open(`/book/${salon.slug}`, '_blank')} style={{ fontSize: 11 }}>
              Voir la page ↗
            </button>
            <button
              className={salon.status === 'active' ? 'btn-red' : 'btn-green'}
              style={{ fontSize: 11 }}
              onClick={() => save('update_status', { status: salon.status === 'active' ? 'suspended' : 'active' }, salon.status === 'active' ? 'Salon suspendu' : 'Salon réactivé')}
              disabled={saving === 'update_status'}
            >
              {salon.status === 'active' ? '⏸ Suspendre' : '▶ Réactiver'}
            </button>
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => window.location.href = `mailto:${salon.email}`}>
              ✉ Email direct
            </button>
          </div>
        </div>

        {/* Notes + message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Notes internes (privées)</div>
            <textarea className="textarea" placeholder="Notes de suivi, observations…" value={notes} onChange={e => setNotes(e.target.value)} />
            <button className="btn" style={{ marginTop: 8, fontSize: 11, width: '100%' }}
              onClick={() => save('save_notes', { notes }, 'Notes sauvegardées')}
              disabled={saving === 'save_notes'}>
              {saving === 'save_notes' ? 'Sauvegarde…' : 'Sauvegarder les notes'}
            </button>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Message au salon</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>S'affiche comme une bannière dans son dashboard jusqu'à effacement</div>
            <textarea className="textarea" placeholder="Ex : Votre période d'essai se termine dans 3 jours…" value={message} onChange={e => setMessage(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-purple" style={{ fontSize: 11, flex: 1 }}
                onClick={() => save('send_message', { message }, 'Message envoyé')}
                disabled={saving === 'send_message' || !message.trim()}>
                {saving === 'send_message' ? 'Envoi…' : '📨 Envoyer'}
              </button>
              {salon.admin_message && (
                <button className="btn-ghost" style={{ fontSize: 11 }}
                  onClick={() => { save('clear_message', { message: '' }, 'Message effacé'); setMessage('') }}>
                  Effacer
                </button>
              )}
            </div>
            {salon.admin_message && (
              <div style={{ marginTop: 8, fontSize: 11, padding: '6px 10px', background: '#ede9fe', borderRadius: 7, color: 'var(--purple)' }}>
                Actif : « {salon.admin_message} »
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── MESSAGES PAGE ── */
function MessagesPage({ salons, call, addToast, onUpdate }: {
  salons: Salon[]
  call: (action: string, id: string, data: Record<string, string>) => Promise<any>
  addToast: (m: string) => void
  onUpdate: (id: string, msg: string) => void
}) {
  const [sel, setSel] = useState<Salon | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const send = async () => {
    if (!sel || !message.trim()) return
    setSaving(true)
    try {
      await call('send_message', sel.id, { message })
      onUpdate(sel.id, message)
      setSel(s => s ? { ...s, admin_message: message } : s)
      addToast('✅ Message envoyé — visible dans le dashboard du salon')
    } catch (e: any) { addToast('❌ ' + e.message) }
    setSaving(false)
  }

  const clear = async (s: Salon) => {
    try {
      await call('clear_message', s.id, { message: '' })
      onUpdate(s.id, '')
      if (sel?.id === s.id) setSel(x => x ? { ...x, admin_message: '' } : x)
      addToast('✅ Message effacé')
    } catch (e: any) { addToast('❌ ' + e.message) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
      <div className="card" style={{ padding: '10px 0', height: 'fit-content' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', padding: '0 14px 10px' }}>Salons</div>
        {salons.map(s => (
          <div key={s.id} onClick={() => { setSel(s); setMessage(s.admin_message || '') }}
            style={{ padding: '10px 14px', cursor: 'pointer', background: sel?.id === s.id ? 'var(--s1)' : 'transparent', borderLeft: sel?.id === s.id ? '3px solid var(--purple)' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.owner_name}</div>
            </div>
            {s.admin_message && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {sel ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{sel.name}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 12 }}>
              {sel.email} · {sel.phone || '—'}
              <button onClick={() => window.location.href = `mailto:${sel.email}`}
                style={{ marginLeft: 10, fontSize: 10, background: 'none', border: '1px solid var(--b2)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✉ Email direct
              </button>
            </div>

            {sel.admin_message && (
              <div style={{ padding: '10px 12px', background: '#ede9fe', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--purple)' }}>
                  <span style={{ fontWeight: 600 }}>Message actif :</span> {sel.admin_message}
                </div>
                <button onClick={() => clear(sel)} style={{ fontSize: 10, background: 'none', border: '1px solid #c4b5fd', borderRadius: 5, padding: '2px 7px', cursor: 'pointer', color: 'var(--purple)', fontFamily: 'inherit' }}>
                  Effacer
                </button>
              </div>
            )}

            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Nouveau message (bannière dashboard)</div>
            <textarea className="textarea" placeholder="Ce message s'affichera comme une alerte dans le dashboard du salon…"
              value={message} onChange={e => setMessage(e.target.value)} />
            <button className="btn-purple" style={{ marginTop: 8, width: '100%' }} onClick={send} disabled={saving || !message.trim()}>
              {saving ? 'Envoi…' : '📨 Envoyer au salon'}
            </button>
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10 }}>Infos du salon</div>
            {[
              ['Clients', sel.client_count + ''],
              ['RDV total', sel.appointment_count + ''],
              ['Employés', sel.employee_count + ''],
              ['Statut', statusLabel(sel.status)],
              ['Slug', sel.slug],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--b1)', fontSize: 12 }}>
                <span style={{ color: 'var(--t2)' }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
          ← Sélectionnez un salon pour lui envoyer un message
        </div>
      )}
    </div>
  )
}

/* ── ADMIN SUPPORT PAGE ── */
type SupportMsg = { id: string; salon_id: string; from_admin: boolean; message: string; read_at: string | null; created_at: string }

function AdminSupportPage({ salons, call, addToast }: {
  salons: Salon[]
  call: (action: string, id: string, data: Record<string, string>) => Promise<any>
  addToast: (m: string) => void
}) {
  const [sel, setSel] = useState<Salon | null>(null)
  const [msgs, setMsgs] = useState<SupportMsg[]>([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const loadMsgs = async (salon: Salon) => {
    setSel(salon); setLoading(true)
    try {
      const json = await call('get_support_messages', salon.id, {})
      setMsgs(json.messages || [])
    } catch { setMsgs([]) }
    setLoading(false)
  }

  const send = async () => {
    if (!sel || !reply.trim()) return
    setSending(true)
    try {
      const json = await call('send_support_reply', sel.id, { message: reply.trim() })
      setMsgs(prev => [...prev, json.message])
      setReply('')
      addToast(`✅ Réponse envoyée à ${sel.name}`)
    } catch (e: any) { addToast('❌ ' + e.message) }
    setSending(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
      <div className="card" style={{ padding: '10px 0', height: 'fit-content' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.07em', padding: '0 14px 10px' }}>Salons</div>
        {salons.map(s => (
          <div key={s.id} onClick={() => loadMsgs(s)}
            style={{ padding: '10px 14px', cursor: 'pointer', background: sel?.id === s.id ? 'var(--s1)' : 'transparent', borderLeft: sel?.id === s.id ? '3px solid var(--purple)' : '3px solid transparent' }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.owner_name}</div>
          </div>
        ))}
      </div>

      {sel ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--b1)' }}>
            {sel.name} — {sel.email}
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 30, color: 'var(--t3)', fontSize: 12 }}>Chargement…</div>
            : <div style={{ flex: 1, minHeight: 300, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {msgs.length === 0
                  ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)', fontSize: 13 }}>Aucun message de ce salon</div>
                  : msgs.map(m => (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from_admin ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '9px 13px', borderRadius: m.from_admin ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: m.from_admin ? 'var(--purple)' : 'var(--s1)', color: m.from_admin ? '#fff' : 'var(--t1)', fontSize: 13, lineHeight: 1.5 }}>
                        {m.message}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, padding: '0 4px' }}>
                        {m.from_admin ? 'Glowify (admin)' : sel.name} · {new Date(m.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {!m.from_admin && !m.read_at && <span style={{ marginLeft: 6, color: 'var(--purple)', fontWeight: 600 }}>● non lu</span>}
                      </div>
                    </div>
                  ))
                }
              </div>
          }
          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--b1)', paddingTop: 12 }}>
            <textarea className="textarea" value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Répondre au salon…" rows={2} style={{ flex: 1, resize: 'none', fontFamily: 'inherit', fontSize: 13, minHeight: 0 }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
            <button className="btn-purple" onClick={send} disabled={sending || !reply.trim()} style={{ alignSelf: 'flex-end' }}>
              {sending ? '…' : 'Répondre'}
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13, minHeight: 200 }}>
          ← Sélectionnez un salon pour voir ses messages
        </div>
      )}
    </div>
  )
}

/* ── DOMAINES PAGE ── */
function DomainsPage({ salons, call, addToast, onUpdate }: {
  salons: Salon[]
  call: (action: string, id: string, data: Record<string, string>) => Promise<any>
  addToast: (m: string) => void
  onUpdate: (id: string, domain: string) => void
}) {
  const [domains, setDomains] = useState<Record<string, string>>(
    Object.fromEntries(salons.map(s => [s.id, s.custom_domain || '']))
  )
  const [saving, setSaving] = useState<string | null>(null)

  const save = async (salon: Salon) => {
    setSaving(salon.id)
    try {
      await call('update_domain', salon.id, { domain: domains[salon.id] || '' })
      onUpdate(salon.id, domains[salon.id] || '')
      addToast(`✅ Domaine mis à jour pour ${salon.name}`)
    } catch (e: any) { addToast('❌ ' + e.message) }
    setSaving(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ background: '#ede9fe', border: '1px solid #c4b5fd' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--purple)' }}>Configuration DNS pour domaine custom</div>
        <div style={{ fontSize: 12, color: '#5b21b6', lineHeight: 1.6 }}>
          Pour chaque domaine custom, le client doit ajouter ces enregistrements DNS chez son registrar :<br />
          <code style={{ fontFamily: 'monospace', background: '#ddd6fe', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 6 }}>
            CNAME @ → cname.vercel-dns.com<br />
            CNAME www → cname.vercel-dns.com
          </code><br />
          <span style={{ fontSize: 11, marginTop: 6, display: 'block', opacity: .8 }}>
            Ensuite ajouter le domaine dans Vercel Dashboard → Project → Settings → Domains
          </span>
        </div>
      </div>

      {salons.map(s => (
        <div key={s.id} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: (s.primary_color || '#c8a96e') + '22', color: s.primary_color || '#c8a96e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{ini(s.name)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)' }}>coiffpro.fr/book/{s.slug} (URL par défaut)</div>
            </div>
            <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => window.open(`/book/${s.slug}`, '_blank')}>
              Voir ↗
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="ex: reservation.monsalon.fr"
              value={domains[s.id] || ''}
              onChange={e => setDomains(d => ({ ...d, [s.id]: e.target.value }))}
            />
            <button className="btn" style={{ whiteSpace: 'nowrap', fontSize: 11 }}
              onClick={() => save(s)} disabled={saving === s.id}>
              {saving === s.id ? '…' : 'Sauvegarder'}
            </button>
          </div>
          {s.custom_domain && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)' }}>
              ✓ Domaine actuel : <strong>{s.custom_domain}</strong>
              <button onClick={() => window.open(`https://${s.custom_domain}`, '_blank')}
                style={{ marginLeft: 8, fontSize: 10, background: 'none', border: '1px solid #b8dfc6', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', color: 'var(--green)', fontFamily: 'inherit' }}>
                Tester ↗
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
