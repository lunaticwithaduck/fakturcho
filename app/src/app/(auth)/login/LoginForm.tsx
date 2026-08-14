'use client';

import { mapAuthErrorMessage, signIn } from '@app/auth';
import { Button, Card, Input } from '@design/components';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn.email({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(mapAuthErrorMessage(signInError.code));
      return;
    }
    router.push('/documents');
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">Вход във Фактурчо</h1>
        <p className="text-sm text-text-muted">Въведете имейл и парола, за да продължите.</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Имейл"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Парола"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Влизане...' : 'Вход'}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        Нямате акаунт?{' '}
        <a className="font-medium text-accent" href="/signup">
          Регистрирайте се
        </a>
      </p>
    </Card>
  );
}
