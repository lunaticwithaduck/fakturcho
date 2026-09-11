import type { DomainErrorCode } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../../common/domain-error';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { ChorusProApiClient } from './chorus-pro-client';
import { isFrenchPublicSectorRecipient } from './fr-public-sector';

// Current UBL invoice flow syntax code for /deposer/flux, per the Chorus Pro
// factures API (communaute.chorus-pro.gouv.fr/submit-flow-invoice). Confirm
// against the live PISTE OpenAPI spec at onboarding if this ever 400s with
// an unknown-syntaxeFlux error — Chorus Pro has revised this code before.
const UBL_SYNTAX_CODE = 'IN_DP_E2_UBL_INVOICE';

// Chorus Pro invoice/flow lifecycle codes (KB0013510) collapsed onto the
// shared pending/accepted/rejected contract.
const REJECTED_STATUSES = new Set(['A_RECYCLER', 'REJETEE']);
const ACCEPTED_STATUSES = new Set([
  'MISE_A_DISPOSITION',
  'RECUPEREE',
  'A_TRAITER',
  'MANDATEE',
  'COMPTABILISEE',
  'MISE_EN_PAIEMENT',
  'SERVICE_FAIT',
]);

interface DeposerFluxResponse {
  numeroFluxDepot?: string;
  codeRetour?: number;
  libelle?: string;
}

interface HistoriqueResponse {
  statutCourant?: string;
  libelle?: string;
}

@Injectable()
export class ChorusProTransport implements EinvoiceTransport {
  readonly providerName = 'chorus-pro';
  readonly country = 'FR';

  private readonly client = new ChorusProApiClient();

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    if (!isFrenchPublicSectorRecipient(params.document.recipient)) {
      throw new DomainError(
        'EINVOICE_TRANSPORT_NOT_CONFIGURED' as DomainErrorCode,
        'French B2B e-invoicing requires an accredited PDP; none configured',
      );
    }

    const response = await this.client.post('/deposer/flux', {
      fichierFlux: Buffer.from(params.xml, 'utf8').toString('base64'),
      nomFichier: `${params.documentId}.xml`,
      syntaxeFlux: UBL_SYNTAX_CODE,
      avecSignature: false,
    });
    const payload = (await response.json()) as DeposerFluxResponse;

    if (!response.ok || !payload.numeroFluxDepot) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: payload.libelle ?? `Chorus Pro deposit failed (HTTP ${response.status})`,
      };
    }

    return {
      providerMessageId: payload.numeroFluxDepot,
      status: 'sent',
    };
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    const response = await this.client.post('/consulter/historique', {
      numeroFluxDepot: providerMessageId,
    });
    const payload = (await response.json()) as HistoriqueResponse;

    if (!response.ok) {
      return {
        status: 'pending',
        errorText: payload.libelle ?? `Chorus Pro status lookup failed (HTTP ${response.status})`,
      };
    }

    const statut = payload.statutCourant ?? '';
    if (REJECTED_STATUSES.has(statut)) {
      return payload.libelle !== undefined
        ? { status: 'rejected', errorText: payload.libelle }
        : { status: 'rejected' };
    }
    if (ACCEPTED_STATUSES.has(statut)) {
      return { status: 'accepted' };
    }
    return { status: 'pending' };
  }
}
