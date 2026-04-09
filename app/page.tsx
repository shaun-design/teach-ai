import { redirect } from 'next/navigation';

/** Entry `/` — static case study pages live under `/public` (e.g. `/index.html`). */
export default function Home() {
  redirect('/index.html');
}
