import { LandingPage } from '@app/features/marketing/LandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Фактурчо — фактури за българския бизнес',
  description:
    'Издавайте фактури, проформи, кредитни и дебитни известия и оферти по българските изисквания. Плащате 0,10 € на издаден документ.',
};

export default function HomePage() {
  return <LandingPage />;
}
