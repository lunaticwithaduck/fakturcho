'use client';

import { mapAuthErrorMessage, signUp } from '@app/auth';
import { Button, Card, Input } from '@design/components';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signUpError } = await signUp.email({ name, email, password });
    setIsSubmitting(false);
    if (signUpError) {
      setError(mapAuthErrorMessage(signUpError.code));
      return;
    }
    router.push('/documents');
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">Регистрация във Фактурчо</h1>
        <p className="text-sm text-text-muted">Създайте безплатен акаунт за пробния период.</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Име"
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Регистрация...' : 'Регистрация'}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        Вече имате акаунт?{' '}
        <a className="font-medium text-accent" href="/login">
          Вход
        </a>
      </p>
    </Card>
  );
}
