import type { EinvoiceTransmissionStatus } from '@app/api';
import type { BadgeStylesProps } from '@design/components';

type BadgeVariant = NonNullable<NonNullable<BadgeStylesProps>['variant']>;

const VARIANT_BY_STATUS: Record<EinvoiceTransmissionStatus, BadgeVariant> = {
  QUEUED: 'neutral',
  SENT: 'success',
  DELIVERED: 'success',
  REJECTED: 'danger',
};

const MESSAGE_KEY_BY_STATUS: Record<EinvoiceTransmissionStatus, string> = {
  QUEUED: 'statusQueued',
  SENT: 'statusSent',
  DELIVERED: 'statusDelivered',
  REJECTED: 'statusRejected',
};

export function getPeppolStatusBadgeVariant(status: EinvoiceTransmissionStatus): BadgeVariant {
  return VARIANT_BY_STATUS[status];
}

export function getPeppolStatusMessageKey(status: EinvoiceTransmissionStatus): string {
  return MESSAGE_KEY_BY_STATUS[status];
}
