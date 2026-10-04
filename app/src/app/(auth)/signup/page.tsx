import { SignupForm } from '@app/features/auth/SignupForm';
import { SignupHighlights } from '@app/features/auth/SignupHighlights';
import { loadMessages } from '@app/i18n/locale';
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

export default async function SignupPage() {
  const { capabilities, faq } = (await loadMessages('bg')).marketing;
  return (
    <div className="flex flex-col gap-10">
      <SignupForm />
      <SignupHighlights capabilities={capabilities} faq={faq} />
    </div>
  );
}
