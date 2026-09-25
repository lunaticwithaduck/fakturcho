import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
    alternates: {},
  };
}

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-3xl font-bold text-text">{t('title')}</h1>
      <p className="text-lg leading-relaxed text-text-muted">{t('description')}</p>
      <Link href="/" className="text-sm font-semibold text-accent underline">
        {t('link')}
      </Link>
    </div>
  );
}
