import { isoInstantToZonedInputValue } from '@app/features/shared/timezone';
import type { DocumentDto } from '@shared/types';

export interface ComposerDeliveryFormState {
  deliveryDate: string;
  transportReason: string;
  transportedAt: string;
  carrierName: string;
  transportNote: string;
  transportVehicle: string;
}

export interface DeliveryRequestFields {
  deliveryDate: string | null;
  transportReason: string | null;
  transportedAt: string | null;
  carrierName: string | null;
  transportNote: string | null;
  transportVehicle: string | null;
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" with no timezone —
// the issuer's own, since that is the clock the stored instant was read from.
function toDateTimeLocalValue(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  return isoInstantToZonedInputValue(iso, timeZone);
}

export function blankDeliveryState(): ComposerDeliveryFormState {
  return {
    deliveryDate: '',
    transportReason: '',
    transportedAt: '',
    carrierName: '',
    transportNote: '',
    transportVehicle: '',
  };
}

export function deliveryStateFromDocument(
  document: DocumentDto,
  timeZone: string,
): ComposerDeliveryFormState {
  return {
    deliveryDate: document.deliveryDate ?? '',
    transportReason: document.transportReason ?? '',
    transportedAt: toDateTimeLocalValue(document.transportedAt, timeZone),
    carrierName: document.carrierName ?? '',
    transportNote: document.transportNote ?? '',
    transportVehicle: document.transportVehicle ?? '',
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
      transportVehicle: null,
    };
  }
  return {
    deliveryDate: state.deliveryDate || null,
    transportReason: state.transportReason.trim() || null,
    transportedAt: state.transportedAt || null,
    carrierName: state.carrierName.trim() || null,
    transportNote: state.transportNote.trim() || null,
    transportVehicle: state.transportVehicle.trim() || null,
  };
}
