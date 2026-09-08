import type {
  AccountSubscriptionStatus,
  DocumentStatus,
  SubscriptionStatus,
} from '@fakturcho/shared-types';

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Пробен период',
  active: 'Активен',
  past_due: 'Просрочено плащане',
  canceled: 'Отказан',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  trialing: 'blue',
  active: 'green',
  past_due: 'gold',
  canceled: 'red',
};

export const ACCOUNT_SUBSCRIPTION_STATUS_LABELS: Record<AccountSubscriptionStatus, string> = {
  ...SUBSCRIPTION_STATUS_LABELS,
  none: 'Без абонамент',
};

export const ACCOUNT_SUBSCRIPTION_STATUS_COLORS: Record<AccountSubscriptionStatus, string> = {
  ...SUBSCRIPTION_STATUS_COLORS,
  none: 'default',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'default',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'default',
};
