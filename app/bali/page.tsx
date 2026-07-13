import { permanentRedirect } from 'next/navigation';

/** Legacy preview route — homepage is now the Bali design. */
export default function BaliRedirectPage() {
  permanentRedirect('/');
}
