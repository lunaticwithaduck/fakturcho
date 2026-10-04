import { SignupForm } from '@app/features/auth/SignupForm';
import { pageAlternates } from '@app/i18n/pageAlternates';
import type { Metadata } from 'next';

interface SignupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: SignupPageProps): Promise<Metadata> {
  return {
    title: 'Регистрация',
    description:
      'Създайте безплатен акаунт и издайте първата си фактура за минути. 1,00 € начален кредит, без абонамент.',
    alternates: pageAlternates('/signup', 'bg', await searchParams),
  };
}

export default function SignupPage() {
  return <SignupForm />;
}
