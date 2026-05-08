import { NextRequest, NextResponse } from 'next/server'

// Appelé après le clic sur le lien magique dans l'email client.
// Supabase redirige ici avec un fragment #access_token=... (côté client)
// ou un ?code=... (PKCE). On redirige vers la page cible, le client JS
// de Supabase récupère la session automatiquement depuis l'URL.
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get('next') || '/'
  // Redirige vers la page cible — Supabase JS détecte le token dans le hash
  return NextResponse.redirect(new URL(next, req.url))
}
