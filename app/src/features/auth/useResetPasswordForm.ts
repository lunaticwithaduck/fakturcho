import { authClient, mapAuthErrorMessage } from '@app/auth';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;

export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const INITIAL_VALUES: ResetPasswordFormValues = {
  newPassword: '',
  confirmPassword: '',
};

export interface ResetPasswordFieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function computeFieldErrors(
  values: ResetPasswordFormValues,
  t: (key: string) => string,
): ResetPasswordFieldErrors {
  const errors: ResetPasswordFieldErrors = {};
  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = t('tooShort');
  }
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = t('mismatch');
  }
  return errors;
}

export function useResetPasswordForm(token: string, onReset: () => void) {
  const t = useTranslations('resetPassword');
  const tErrors = useTranslations('auth.errors');
  const [values, setValues] = useState<ResetPasswordFormValues>(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  function setField<K extends keyof ResetPasswordFormValues>(
    key: K,
    value: ResetPasswordFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = computeFieldErrors(values, t);
    if (fieldErrors.newPassword || fieldErrors.confirmPassword) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: values.newPassword,
      token,
    });
    setIsSubmitting(false);
    if (resetError) {
      setError(tErrors(mapAuthErrorMessage(resetError.code)));
      return;
    }
    onReset();
  }

  return {
    values,
    setField,
    error,
    isSubmitting,
    handleSubmit,
    fieldErrors: submitAttempted ? computeFieldErrors(values, t) : {},
  };
}
