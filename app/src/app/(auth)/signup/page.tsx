import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Регистрация',
  description:
    'Създайте безплатен акаунт и издайте първата си фактура за минути. 1,00 € начален кредит, без абонамент.',
};

export default function SignupPage() {
  return <SignupForm />;
}
