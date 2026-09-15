import type { DocumentDto } from '@shared/types';

export interface ComposerDeliveryFormState {
  deliveryDate: string;
  transportReason: string;
  transportedAt: string;
  carrierName: string;
  transportNote: string;
}

export interface DeliveryRequestFields {
  deliveryDate: string | null;
  transportReason: string | null;
  transportedAt: string | null;
  carrierName: string | null;
  transportNote: string | null;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" with no timezone.
function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

export function blankDeliveryState(): ComposerDeliveryFormState {
  return {
    deliveryDate: '',
    transportReason: '',
    transportedAt: '',
    carrierName: '',
    transportNote: '',
  };
}

export function deliveryStateFromDocument(document: DocumentDto): ComposerDeliveryFormState {
  return {
    deliveryDate: document.deliveryDate ?? '',
    transportReason: document.transportReason ?? '',
    transportedAt: toDateTimeLocalValue(document.transportedAt),
    carrierName: document.carrierName ?? '',
    transportNote: document.transportNote ?? '',
  };
}

export function deliveryRequestFields(
  state: ComposerDeliveryFormState,
  isDeliveryNote: boolean,
): DeliveryRequestFields {
  if (!isDeliveryNote) {
    return {
      deliveryDate: null,
      transportReason: null,
      transportedAt: null,
      carrierName: null,
      transportNote: null,
    };
  }
  return {
    deliveryDate: state.deliveryDate || null,
    transportReason: state.transportReason.trim() || null,
    transportedAt: state.transportedAt || null,
    carrierName: state.carrierName.trim() || null,
    transportNote: state.transportNote.trim() || null,
  };
}
