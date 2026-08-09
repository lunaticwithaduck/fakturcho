import brandIcon from '@app/features/shell/brand-icon.png';
import Image from 'next/image';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-3">
        <Image src={brandIcon} alt="" className="h-12 w-12" priority />
        <span className="text-xl font-bold text-text">Фактурчо</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
