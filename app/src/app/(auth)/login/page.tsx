import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Влезте в акаунта си във Фактурчо, за да издавате и управлявате документи.',
};

export default function LoginPage() {
  return <LoginForm />;
}
