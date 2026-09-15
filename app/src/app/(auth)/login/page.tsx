import { LoginForm } from '@app/features/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Влезте в акаунта си във Фактурчо, за да издавате и управлявате документи.',
  alternates: {
    canonical: '/login',
    languages: {
      bg: '/login',
      en: '/en/login',
    },
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
