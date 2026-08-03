import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Регистрация — Фактурчо',
};

export default function SignupPage() {
  return <SignupForm />;
}
