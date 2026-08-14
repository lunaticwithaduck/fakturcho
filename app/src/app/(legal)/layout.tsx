import { LegalFooter } from '@app/features/legal/LegalFooter';
import brandIcon from '@app/features/shell/brand-icon.png';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-10 px-4 py-10">
      <Link href="/" className="flex items-center gap-3 self-start">
        <Image src={brandIcon} alt="" className="h-9 w-9" priority />
        <span className="text-lg font-bold text-text">Фактурчо</span>
      </Link>
      <main className="flex-1">{children}</main>
      <LegalFooter />
    </div>
  );
}
