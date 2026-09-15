import { SignupForm } from '@app/features/auth/SignupForm';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация',
  description:
    'Създайте безплатен акаунт и издайте първата си фактура за минути. 1,00 € начален кредит, без абонамент.',
  alternates: {
    canonical: '/signup',
    languages: hreflangAlternates('/signup'),
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
