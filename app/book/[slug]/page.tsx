import { redirect } from 'next/navigation'

export default function BookRedirect({ params }: { params: { slug: string } }) {
  redirect(`/barbier/${params.slug}`)
}
