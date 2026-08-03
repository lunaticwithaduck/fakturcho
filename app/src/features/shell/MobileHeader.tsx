'use client';

import { SignOutButton } from './SignOutButton';

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-3 md:hidden">
      <p className="text-base font-bold text-text">Фактурчо</p>
      <SignOutButton />
    </header>
  );
}
