import { SignupForm } from '@app/features/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Регистрация',
  description:
    'Създайте безплатен акаунт и издайте първата си фактура за минути. 1,00 € начален кредит, без абонамент.',
  alternates: {
    canonical: '/signup',
    languages: {
      bg: '/signup',
      en: '/en/signup',
    },
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
