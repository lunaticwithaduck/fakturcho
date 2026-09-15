import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Страницата не е намерена',
  description: 'Страницата, която търсите, не съществува или е преместена.',
  robots: { index: false, follow: false },
  alternates: {},
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-3xl font-bold text-text">Страницата не е намерена</h1>
      <p className="text-lg leading-relaxed text-text-muted">
        Проверете адреса или се върнете към началото.
      </p>
      <Link href="/" className="text-sm font-semibold text-accent underline">
        Към Фактурчо
      </Link>
    </div>
  );
}
