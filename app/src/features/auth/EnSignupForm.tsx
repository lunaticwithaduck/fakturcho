'use client';

import { useSearchParams } from 'next/navigation';
import { SignupForm } from './SignupForm';

export function EnSignupForm() {
  const searchParams = useSearchParams();
  const countryParam = searchParams.get('country') ?? undefined;
  return <SignupForm locale="en" initialCountry={countryParam} />;
}
