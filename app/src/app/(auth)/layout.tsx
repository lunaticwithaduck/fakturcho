import { LegalFooter } from '@app/features/legal/LegalFooter';
import brandIcon from '@app/features/shell/brand-icon.png';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <main className="flex flex-col items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src={brandIcon} alt="" className="h-12 w-12" priority />
          <span className="text-xl font-bold text-text">Фактурчо</span>
        </Link>
        <div className="w-full">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}
