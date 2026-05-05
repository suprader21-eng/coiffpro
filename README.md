# ✂ CoiffPro — SaaS Barber

## Stack
Next.js 14 · Supabase · Stripe · **OVH SMS** · SumUp

---

## 🚀 Mise en production

### 1. Supabase
→ supabase.com → SQL Editor → coller `supabase/schema.sql`
→ Copier URL + anon key + service role key dans `.env.local`

### 2. OVH SMS (sans abonnement, paiement à l'usage)

**Étape 1 — Commander un compte SMS OVH**
1. Aller sur **ovh.com/fr/sms**
2. Commander un pack SMS (ex: 100 SMS = ~4.50€)
3. Votre service SMS s'appelle `sms-xxxxxxx-1` — copier ce nom

**Étape 2 — Générer les clés API OVH**
1. Aller sur **eu.api.ovh.com/createToken**
2. Se connecter avec votre compte OVH
3. Remplir :
   - Application name : `CoiffPro`
   - Application description : `SMS barber`
   - Validity : `Unlimited`
4. Droits à cocher (cliquer "+" pour ajouter) :
   - `GET  /sms/*`
   - `POST /sms/*`
   - `PUT  /sms/*`
5. Valider → vous recevez 3 clés :
   - `Application Key` → `OVH_APP_KEY`
   - `Application Secret` → `OVH_APP_SECRET`
   - `Consumer Key` → `OVH_CONSUMER_KEY`

**Étape 3 — Configurer le Sender ID**
1. Espace client OVH → SMS → votre service → **Expéditeurs**
2. Ajouter `CoiffPro` comme expéditeur alphanumérique
3. C'est ce nom qui apparaît sur le téléphone du client au lieu d'un numéro

**Résultat :** les clients reçoivent les SMS avec **"CoiffPro"** comme expéditeur, pas un numéro.

### 3. Stripe
→ dashboard.stripe.com → Catalogue → Produit "CoiffPro Pro" à 50€/mois récurrent
→ Copier le Price ID dans `STRIPE_PRICE_ID`
→ Webhooks → `https://coiffpro.fr/api/webhooks/stripe`
→ Événements : `customer.subscription.*` · `invoice.payment_*` · `checkout.session.completed`

### 4. SumUp
→ developer.sumup.com → Créer une application → Copier Client ID + Secret

### 5. Domaine o2switch → Vercel
Zone DNS o2switch :
- `A`     : `@`   → `76.76.21.21`
- `CNAME` : `www` → `cname.vercel-dns.com`

Vercel → Settings → Domains → Ajouter `coiffpro.fr`

### 6. Déploiement
```bash
npm install -g vercel
vercel --prod
# Ajouter toutes les variables dans Vercel → Settings → Environment Variables
```

---

## 📱 URLs
| URL | Description |
|-----|-------------|
| `/` | Landing page marketing |
| `/register` | Inscription salon (6 étapes) |
| `/dashboard` | Interface barber (mobile + desktop) |
| `/admin` | Interface admin |
| `/book/[slug]` | Page publique + réservation client |

---

## 💰 Coûts serveur estimés (100 salons)
| Service | Coût/mois |
|---------|-----------|
| Supabase Pro | 25$ |
| Vercel Pro | 20$ |
| OVH SMS | ~30€ (700 SMS/j) |
| Stripe (2.9%) | ~145€ sur 5000€ |
| **Total** | **~220€/mois** |

Revenus : 100 salons × 50€ = **5 000€/mois** → marge ~**96%** 💰
