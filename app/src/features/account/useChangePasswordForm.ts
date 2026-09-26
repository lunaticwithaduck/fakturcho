import { authClient, mapAuthErrorMessage } from '@app/auth';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
}

const INITIAL_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  revokeOtherSessions: true,
};

export interface ChangePasswordFieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

function computeFieldErrors(
  values: ChangePasswordFormValues,
  t: (key: string) => string,
): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {};
  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = t('tooShort');
  }
  if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = t('mismatch');
  }
  return errors;
}

export function useChangePasswordForm(onSaved: () => void) {
  const t = useTranslations('account.changePassword');
  const tErrors = useTranslations('auth.errors');
  const [values, setValues] = useState<ChangePasswordFormValues>(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  function setField<K extends keyof ChangePasswordFormValues>(
    key: K,
    value: ChangePasswordFormValues[K],
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
    const { error: changeError } = await authClient.changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      revokeOtherSessions: values.revokeOtherSessions,
    });
    setIsSubmitting(false);
    if (changeError) {
      setError(tErrors(mapAuthErrorMessage(changeError.code)));
      return;
    }
    setValues(INITIAL_VALUES);
    setSubmitAttempted(false);
    onSaved();
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
