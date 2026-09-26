import { ChangePasswordCard } from '@app/features/account/ChangePasswordCard';
import { IssuerProfilePage } from '@app/features/issuer/IssuerProfilePage';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('shell');
  return { title: t('navItems.profile') };
}

export default function ProfilePage() {
  return (
    <>
      <IssuerProfilePage />
      <ChangePasswordCard />
    </>
  );
}
