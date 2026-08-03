'use client';

import { signOut } from '@app/auth';
import { Button } from '@design/components';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    router.replace('/login');
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isSigningOut}
      onClick={handleSignOut}
      {...(className !== undefined ? { className } : {})}
    >
      Изход
    </Button>
  );
}
