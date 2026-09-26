import { ForgotPasswordForm } from '@app/features/auth/ForgotPasswordForm';
import { hreflangAlternates } from '@app/i18n/localeRedirect';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Забравена парола',
  description: 'Заявете връзка за смяна на паролата на акаунта си във Фактурчо.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/forgot-password',
    languages: hreflangAlternates('/forgot-password'),
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
