import { Injectable } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { isPublicBodyRecipient } from './face-dir3';
import { FaceTransport } from './face-transport';
import { VerifactuTransport } from './verifactu-transport';

// Every ES invoice is reported to AEAT via Verifactu; a public-body recipient (signalled
// by DIR3 codes in buyerReference, see face-dir3.ts) additionally goes to FACe. Neither
// leg is skipped because the other one failed — jojo sees both outcomes.
@Injectable()
export class EsTransport implements EinvoiceTransport {
  readonly providerName = 'es';
  readonly country = 'ES';

  constructor(
    private readonly verifactu: VerifactuTransport,
    private readonly face: FaceTransport,
  ) {}

  isConfigured(): boolean {
    return this.verifactu.isConfigured() || this.face.isConfigured();
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    const verifactuResult = this.verifactu.isConfigured()
      ? await this.verifactu.send(params)
      : {
          providerMessageId: '',
          status: 'rejected' as const,
          errorText: 'AEAT Verifactu transport is not configured',
        };

    const isPublicBody = isPublicBodyRecipient(params.document.buyerReference);
    const faceResult =
      isPublicBody && this.face.isConfigured() ? await this.face.send(params) : null;

    return combineResults(verifactuResult, faceResult);
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    const [scheme, id] = splitProviderMessageId(providerMessageId);
    if (scheme === 'face') {
      return (
        this.face.checkStatus?.(id) ?? {
          status: 'pending',
          errorText: 'FACe transport has no checkStatus',
        }
      );
    }
    return (
      this.verifactu.checkStatus?.(id) ?? {
        status: 'pending',
        errorText: 'AEAT Verifactu transport has no checkStatus',
      }
    );
  }
}

const ID_SEP = '::';

function combineResults(
  verifactu: EinvoiceTransportSendResult,
  face: EinvoiceTransportSendResult | null,
): EinvoiceTransportSendResult {
  const providerMessageId = [
    `verifactu${ID_SEP}${verifactu.providerMessageId}`,
    face ? `face${ID_SEP}${face.providerMessageId}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join('|');

  if (verifactu.status === 'sent' && (!face || face.status === 'sent')) {
    const errorText = [verifactu.errorText, face?.errorText].filter(Boolean).join(' | ');
    return { providerMessageId, status: 'sent', ...(errorText ? { errorText } : {}) };
  }

  const errors = [
    verifactu.status === 'rejected' ? `Verifactu: ${verifactu.errorText ?? 'rejected'}` : null,
    face && face.status === 'rejected' ? `FACe: ${face.errorText ?? 'rejected'}` : null,
  ].filter((part): part is string => part !== null);

  return { providerMessageId, status: 'rejected', errorText: errors.join(' | ') };
}

function splitProviderMessageId(providerMessageId: string): ['verifactu' | 'face', string] {
  const facePart = providerMessageId.split('|').find((part) => part.startsWith(`face${ID_SEP}`));
  if (facePart) return ['face', facePart.slice(`face${ID_SEP}`.length)];
  const verifactuPart = providerMessageId
    .split('|')
    .find((part) => part.startsWith(`verifactu${ID_SEP}`));
  return [
    'verifactu',
    verifactuPart ? verifactuPart.slice(`verifactu${ID_SEP}`.length) : providerMessageId,
  ];
}
