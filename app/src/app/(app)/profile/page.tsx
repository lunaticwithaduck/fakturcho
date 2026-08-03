import { IssuerProfilePage } from '@app/features/issuer/IssuerProfilePage';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Профил — Фактурчо' };

export default function ProfilePage() {
  return <IssuerProfilePage />;
}
