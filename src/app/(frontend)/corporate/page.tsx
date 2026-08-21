import { redirect } from 'next/navigation'

/** Compatibility alias — About is the canonical company overview route. */
export default function CorporateRedirectPage() {
  redirect('/about')
}
