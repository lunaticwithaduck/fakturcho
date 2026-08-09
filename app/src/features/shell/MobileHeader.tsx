'use client';

import Image from 'next/image';
import brandIcon from './brand-icon.png';
import { SignOutButton } from './SignOutButton';

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <Image src={brandIcon} alt="" className="h-6 w-6" />
        <p className="text-base font-bold text-text">Фактурчо</p>
      </div>
      <SignOutButton />
    </header>
  );
}
