import { LandingPage } from '@app/features/marketing/LandingPage';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Фактурчо — фактури за българския бизнес',
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
};

export default async function HomePage() {
  const store = await cookies();
  if (store.getAll().some((entry) => entry.name.endsWith('session_token'))) {
    redirect('/documents');
  }
  return <LandingPage />;
}
