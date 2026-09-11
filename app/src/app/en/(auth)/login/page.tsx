import { LoginForm } from '@app/features/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Log in' },
  description: 'Log in to your Fakturcho account to issue and manage documents.',
  alternates: {
    canonical: '/en/login',
    languages: {
      bg: '/login',
      en: '/en/login',
    },
  },
};

export default function EnglishLoginPage() {
  return <LoginForm locale="en" />;
}
