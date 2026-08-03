import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Вход — Фактурчо',
};

export default function LoginPage() {
  return <LoginForm />;
}
