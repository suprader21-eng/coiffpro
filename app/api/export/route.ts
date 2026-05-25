import { NextRequest, NextResponse } from 'next/server'

// Génère une page HTML standalone pour mise en ligne
export async function POST(req: NextRequest) {
  const data = await req.json()

  const {
    salonName = 'Salon',
    tagline = 'Coiffure & Barbier',
    description = '',
    address = '',
    city = '',
    phone = '',
    email = '',
    instagram = '',
    googleLink = '#',
    mapsEmbed = '',
    rating = 4.8,
    reviewCount = 0,
    bookingUrl = '#',
    hours = [],
    services = [],
    employees = [],
    photos = [],
    reviews = [],
    primaryColor = '#111111',
    accentColor = '#b8922a',
  } = data

  const catGroups: Record<string, typeof services> = {}
  for (const s of services) {
    if (!catGroups[s.category]) catGroups[s.category] = []
    catGroups[s.category].push(s)
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${salonName} — ${tagline} | Réservation en ligne</title>
  <meta name="description" content="${description || `Réservez en ligne chez ${salonName}, ${tagline} à ${city}. Note ${rating}★ · ${reviewCount} avis Google.`}"/>
  <meta name="keywords" content="coiffeur ${city.toLowerCase()}, salon de coiffure, réservation coiffeur en ligne"/>
  <meta property="og:title" content="${salonName} — ${tagline}"/>
  <meta property="og:description" content="${description || `Réservation en ligne 24h/24 chez ${salonName}`}"/>
  <meta property="og:type" content="website"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --primary: ${primaryColor}; --accent: ${accentColor}; --bg: #ffffff; --s1: #fafafa; --b1: #e8e8e8; --t1: #111; --t2: #666; --t3: #bbb; }
    body { font-family: 'Outfit', -apple-system, sans-serif; color: var(--t1); background: var(--bg); }
    .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
    a { color: inherit; text-decoration: none; }
    /* NAV */
    nav { position: sticky; top: 0; z-index: 50; background: #fff; border-bottom: 1px solid var(--b1); height: 56px; display: flex; align-items: center; padding: 0 24px; gap: 16px; }
    .logo { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; }
    .btn-rdv { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; display: inline-block; }
    /* HERO */
    .hero { background: var(--s1); border-bottom: 1px solid var(--b1); padding: 52px 24px 44px; }
    .hero-inner { max-width: 900px; margin: 0 auto; display: flex; gap: 40px; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; }
    h1 { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 700; line-height: 1.02; letter-spacing: -.01em; margin-bottom: 14px; }
    .badge { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; background: #fff; border: 1px solid var(--b1); border-radius: 8px; padding: 6px 12px; }
    .badge-open { background: #e8f7ee; border-color: #b8dfc6; color: #1a9648; font-weight: 500; }
    .hours-card { background: #fff; border: 1px solid var(--b1); border-radius: 12px; padding: 20px 22px; min-width: 220px; }
    /* PHOTOS */
    .photos { padding: 40px 24px; max-width: 900px; margin: 0 auto; }
    .photos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .photo-item { border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: var(--s1); border: 1px solid var(--b1); }
    .photo-item img { width: 100%; height: 100%; object-fit: cover; }
    /* SERVICES */
    section { padding: 48px 24px; }
    .section-inner { max-width: 900px; margin: 0 auto; }
    h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; margin-bottom: 6px; }
    .cat-label { font-size: 11px; font-weight: 600; color: var(--t3); text-transform: uppercase; letter-spacing: .08em; margin: 20px 0 10px; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .service-card { background: #fff; border: 1px solid var(--b1); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: box-shadow .15s; }
    .service-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .service-name { font-size: 13px; font-weight: 600; }
    .service-meta { font-size: 11px; color: var(--t3); margin-top: 3px; }
    .service-price { font-size: 18px; font-weight: 700; flex-shrink: 0; }
    /* TEAM */
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .team-card { background: #fff; border: 1px solid var(--b1); border-radius: 10px; padding: 20px 16px; text-align: center; }
    .team-avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--s1); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: var(--t2); margin: 0 auto 10px; border: 1px solid var(--b1); }
    /* MAP */
    .map-section { background: var(--s1); border-top: 1px solid var(--b1); border-bottom: 1px solid var(--b1); }
    .map-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
    .map-frame { height: 340px; background: var(--b1); overflow: hidden; }
    .map-frame iframe { width: 100%; height: 100%; border: none; }
    .map-info { padding: 36px 32px; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
    .map-info-row { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--t2); }
    .map-info-row svg { flex-shrink: 0; margin-top: 1px; }
    /* REVIEWS */
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
    .review-card { background: #fff; border: 1px solid var(--b1); border-radius: 10px; padding: 14px 16px; }
    .stars { color: var(--accent); }
    /* FOOTER */
    footer { background: var(--s1); border-top: 1px solid var(--b1); padding: 40px 24px 24px; }
    .footer-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 28px; }
    .footer-bottom { max-width: 900px; margin: 24px auto 0; padding-top: 16px; border-top: 1px solid var(--b1); display: flex; justify-content: space-between; font-size: 11px; color: var(--t3); }
    /* BOOKING CTA */
    .cta-bar { background: var(--primary); color: #fff; text-align: center; padding: 28px 24px; }
    .cta-bar h3 { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; margin-bottom: 10px; }
    .btn-cta { display: inline-block; background: #fff; color: var(--primary); border-radius: 9px; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; }
    @media (max-width: 600px) {
      h1 { font-size: 34px; }
      .map-inner { grid-template-columns: 1fr; }
      nav .phone { display: none; }
    }
  </style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="logo">✂ ${salonName}</div>
  ${phone ? `<a href="tel:${phone}" class="phone" style="font-size:13px;color:#666;margin-left:8px">${phone}</a>` : ''}
  <a href="${bookingUrl}" class="btn-rdv" style="margin-left:auto">Réserver en ligne</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-inner">
    <div>
      <div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px">${tagline}</div>
      <h1>${salonName}</h1>
      <p style="font-size:15px;color:#555;line-height:1.7;max-width:500px;margin-bottom:20px">${description}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px">
        ${rating ? `<span class="badge"><span class="stars">${'★'.repeat(Math.round(rating))}</span> <strong>${rating}</strong> <span style="color:#aaa">(${reviewCount} avis)</span></span>` : ''}
        ${address ? `<span class="badge">📍 ${address}, ${city}</span>` : ''}
      </div>
      <a href="${bookingUrl}" class="btn-rdv" style="font-size:14px;padding:13px 28px;border-radius:10px;margin-right:10px">Réserver un créneau →</a>
      ${phone ? `<a href="tel:${phone}" style="display:inline-block;background:transparent;color:#111;border:1px solid #d0d0d0;border-radius:10px;padding:12px 20px;font-size:13px;font-weight:500">Nous appeler</a>` : ''}
    </div>
    <!-- Horaires -->
    <div class="hours-card">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#666;margin-bottom:14px">Horaires</div>
      ${hours.map((h: any, i: number) => `
      <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:${i<6?'1px solid #f0f0f0':'none'};font-size:12px">
        <span style="color:#555">${h.day}</span>
        <span style="color:${h.open?'#333':'#bbb'}">${h.open ? `${h.from} – ${h.to}` : 'Fermé'}</span>
      </div>`).join('')}
    </div>
  </div>
</div>

${photos.length > 0 ? `
<!-- PHOTOS -->
<div class="photos">
  <h2 style="margin-bottom:16px">Notre salon</h2>
  <div class="photos-grid">
    ${photos.map((p: string) => `<div class="photo-item"><img src="${p}" alt="${salonName}" loading="lazy"/></div>`).join('')}
  </div>
</div>` : ''}

<!-- SERVICES -->
<section style="background:#fff;border-top:1px solid #e8e8e8">
  <div class="section-inner">
    <h2>Nos prestations</h2>
    <p style="font-size:14px;color:#888;margin-bottom:8px">Tous nos tarifs incluent le shampoing et la finition</p>
    ${Object.entries(catGroups).map(([cat, svcs]) => `
    <div class="cat-label">${cat}</div>
    <div class="services-grid">
      ${(svcs as any[]).map((s: any) => `
      <div class="service-card">
        <div>
          <div class="service-name">${s.name}</div>
          <div class="service-meta">${s.duration} min</div>
        </div>
        <div>
          <div class="service-price">${s.price}€</div>
          <a href="${bookingUrl}" style="display:block;font-size:10px;color:#aaa;text-align:right;margin-top:2px">Réserver →</a>
        </div>
      </div>`).join('')}
    </div>`).join('')}
    <div style="text-align:center;margin-top:28px">
      <a href="${bookingUrl}" class="btn-rdv" style="font-size:14px;padding:13px 28px;border-radius:10px">Réserver maintenant →</a>
    </div>
  </div>
</section>

${employees.length > 0 ? `
<!-- ÉQUIPE -->
<section style="background:var(--s1);border-top:1px solid var(--b1)">
  <div class="section-inner">
    <h2 style="margin-bottom:20px">Notre équipe</h2>
    <div class="team-grid">
      ${employees.map((e: any) => `
      <div class="team-card">
        <div class="team-avatar">${e.name.split(' ').map((w: string)=>w[0]).join('').toUpperCase().slice(0,2)}</div>
        <div style="font-size:14px;font-weight:600">${e.name}</div>
        <div style="font-size:12px;color:#888;margin-top:3px">${e.role}</div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<!-- MAP + INFOS -->
<div class="map-section">
  <div class="map-inner">
    <div class="map-frame">
      ${mapsEmbed
        ? `<iframe src="${mapsEmbed}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#aaa;font-size:13px">📍 Carte Google Maps</div>`
      }
    </div>
    <div class="map-info">
      <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;margin-bottom:8px">${salonName}</div>
      ${address ? `<div class="map-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>${address}, ${city}</span></div>` : ''}
      ${phone ? `<div class="map-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg><a href="tel:${phone}" style="color:#333">${phone}</a></div>` : ''}
      ${email ? `<div class="map-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><a href="mailto:${email}" style="color:#333">${email}</a></div>` : ''}
      ${instagram ? `<div class="map-info-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg><span>${instagram}</span></div>` : ''}
      <a href="${bookingUrl}" class="btn-rdv" style="margin-top:8px;text-align:center;border-radius:9px;padding:11px 20px">Réserver en ligne →</a>
    </div>
  </div>
</div>

${reviews.length > 0 ? `
<!-- AVIS -->
<section>
  <div class="section-inner">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap">
      <div>
        <h2 style="margin-bottom:4px">Avis clients</h2>
        <div style="display:flex;align-items:center;gap:8px"><span class="stars" style="font-size:16px">${'★'.repeat(5)}</span><strong>${rating}</strong><span style="color:#aaa;font-size:13px">sur ${reviewCount} avis Google</span></div>
      </div>
      ${googleLink !== '#' ? `<a href="${googleLink}" target="_blank" rel="noopener" style="margin-left:auto;background:#fff;border:1px solid #e8e8e8;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:500">⭐ Laisser un avis →</a>` : ''}
    </div>
    <div class="reviews-grid">
      ${reviews.map((r: any) => `
      <div class="review-card">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;font-weight:600">${r.name}</span><span style="font-size:10px;color:#aaa">${r.date}</span></div>
        <div class="stars" style="font-size:12px;margin-bottom:6px">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
        <div style="font-size:12px;color:#555;line-height:1.6">${r.text}</div>
      </div>`).join('')}
    </div>
  </div>
</section>` : ''}

<!-- CTA BAR -->
<div class="cta-bar">
  <h3>Prêt(e) à prendre RDV ?</h3>
  <p style="font-size:13px;opacity:.8;margin-bottom:16px">Disponible 24h/24 · Confirmation immédiate · Rappel SMS</p>
  <a href="${bookingUrl}" class="btn-cta">Réserver mon créneau →</a>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;margin-bottom:10px">✂ ${salonName}</div>
      <div style="font-size:12px;color:#666;line-height:2">
        ${address ? `${address}<br/>${city}<br/>` : ''}
        ${phone ? `<a href="tel:${phone}" style="color:#666">${phone}</a><br/>` : ''}
        ${email ? `<a href="mailto:${email}" style="color:#666">${email}</a>` : ''}
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#aaa;margin-bottom:10px">Réseaux</div>
      <div style="font-size:12px;color:#666;line-height:2.2">
        ${instagram ? `<a href="#">📸 ${instagram}</a><br/>` : ''}
        ${googleLink !== '#' ? `<a href="${googleLink}" target="_blank">⭐ Avis Google</a><br/>` : ''}
        <a href="#">📅 Planity</a>
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#aaa;margin-bottom:10px">Réservation</div>
      <a href="${bookingUrl}" class="btn-rdv" style="display:block;text-align:center;border-radius:8px;padding:10px 16px;font-size:13px">Prendre RDV en ligne →</a>
      <div style="font-size:11px;color:#aaa;margin-top:8px">Disponible 24h/24, 7j/7</div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© ${new Date().getFullYear()} ${salonName} — Propulsé par Glowify</span>
    <span>Mentions légales · Confidentialité</span>
  </div>
</footer>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${salonName.replace(/\s+/g,'-').toLowerCase()}-page.html"`,
    },
  })
}
