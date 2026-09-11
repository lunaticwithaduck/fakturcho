import { SignupForm } from '@app/features/auth/SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Sign up' },
  description:
    'Create a free account and issue your first invoice in minutes. 1.00 € starting credit, no subscription.',
  alternates: {
    canonical: '/en/signup',
    languages: {
      bg: '/signup',
      en: '/en/signup',
    },
  },
};

export default function EnglishSignupPage() {
  return <SignupForm locale="en" />;
}
