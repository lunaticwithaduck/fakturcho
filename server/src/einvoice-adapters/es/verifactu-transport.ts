import { Inject, Injectable, Optional } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { readAeatVerifactuConfig } from './aeat-config';
import { postSoapXml, type SoapHttpResponse, type SoapPost } from './soap-http';
import { isSoapFault, soapFaultMessage } from './soap-xml';
import { VERIFACTU_CHAIN_STORE, type VerifactuChainStore } from './verifactu-chain-store';
import { buildConsultaEnvelope, buildRegFactuEnvelope } from './verifactu-envelope';
import { buildRegistroAlta, type VerifactuSoftwareIdentity } from './verifactu-mapper';
import { decodeVerifactuMessageId, encodeVerifactuMessageId } from './verifactu-message-id';
import { parseConsultaResponse, parseRegFactuResponse } from './verifactu-response';

const TEST_ENDPOINT = 'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP';
const PROD_ENDPOINT =
  'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP';

@Injectable()
export class VerifactuTransport implements EinvoiceTransport {
  readonly providerName = 'aeat-verifactu';
  readonly country = 'ES';

  constructor(
    @Inject(VERIFACTU_CHAIN_STORE) private readonly chainStore: VerifactuChainStore,
    @Optional() private readonly post: SoapPost = postSoapXml,
    @Optional() private readonly env: NodeJS.ProcessEnv = process.env,
    @Optional() private readonly now: () => Date = () => new Date(),
  ) {}

  isConfigured(): boolean {
    return readAeatVerifactuConfig(this.env) !== null;
  }

  private endpoint(environment: 'test' | 'prod'): string {
    return environment === 'prod' ? PROD_ENDPOINT : TEST_ENDPOINT;
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    const config = readAeatVerifactuConfig(this.env);
    if (!config) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: 'AEAT Verifactu transport is not configured',
      };
    }

    const previous = await this.chainStore.getLast(config.issuerNif);
    const system: VerifactuSoftwareIdentity = {
      nombreRazon: config.softwareName,
      nif: config.softwareNif,
      nombreSistemaInformatico: config.softwareName,
      idSistemaInformatico: config.softwareAppId,
      version: config.softwareVersion,
      numeroInstalacion: config.issuerNif,
    };
    const registro = buildRegistroAlta(params.document, previous, system, this.now());
    const envelope = buildRegFactuEnvelope(
      params.document.issuer.companyName ?? '',
      config.issuerNif,
      registro.xml,
    );

    let response: SoapHttpResponse;
    try {
      response = await this.post(
        this.endpoint(config.environment),
        envelope,
        'RegFactuSistemaFacturacion',
        {
          cert: config.clientCertPem,
          key: config.clientKeyPem,
          ca: config.caPem,
        },
      );
    } catch (error) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: `AEAT Verifactu request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (isSoapFault(response.body)) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: soapFaultMessage(response.body),
      };
    }

    const outcome = parseRegFactuResponse(response.body);

    if (response.statusCode >= 400 || !outcome.estadoEnvio) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText:
          outcome.descripcionError ??
          `AEAT Verifactu returned HTTP ${response.statusCode} with no EstadoEnvio in the response`,
      };
    }

    if (!outcome.accepted) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: outcome.descripcionError
          ? `${outcome.codigoError ? `[${outcome.codigoError}] ` : ''}${outcome.descripcionError}`
          : `AEAT Verifactu rejected the record (EstadoEnvio=${outcome.estadoEnvio})`,
      };
    }

    await this.chainStore.save(config.issuerNif, registro.chainLink);

    return {
      providerMessageId: encodeVerifactuMessageId(
        outcome.csv ?? '',
        registro.chainLink.idEmisorFactura,
        registro.chainLink.numSerieFactura,
        registro.chainLink.fechaExpedicionFactura,
      ),
      status: 'sent',
      receipt: response.body,
      ...(outcome.admissible && outcome.descripcionError
        ? { errorText: outcome.descripcionError }
        : {}),
    };
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    const config = readAeatVerifactuConfig(this.env);
    const decoded = decodeVerifactuMessageId(providerMessageId);
    if (!config || !decoded) {
      return {
        status: 'pending',
        errorText: 'cannot query Verifactu status without an AEAT Verifactu providerMessageId',
      };
    }

    const [, month, year] = decoded.fecha.split('-');
    const envelope = buildConsultaEnvelope(
      '',
      decoded.idEmisorFactura,
      year ?? '',
      month ?? '',
      decoded.numSerieFactura,
      decoded.fecha,
    );

    let response: SoapHttpResponse;
    try {
      response = await this.post(
        this.endpoint(config.environment),
        envelope,
        'ConsultaFactuSistemaFacturacion',
        { cert: config.clientCertPem, key: config.clientKeyPem, ca: config.caPem },
      );
    } catch (error) {
      return {
        status: 'pending',
        errorText: `AEAT Verifactu query failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (isSoapFault(response.body)) {
      return { status: 'pending', errorText: soapFaultMessage(response.body) };
    }

    const outcome = parseConsultaResponse(response.body);
    if (!outcome.found) {
      return { status: 'rejected', errorText: 'AEAT has no record for this invoice' };
    }
    if (outcome.accepted) {
      return {
        status: 'accepted',
        receipt: response.body,
        ...(outcome.descripcion ? { errorText: outcome.descripcion } : {}),
      };
    }
    if (outcome.cancelled) {
      return { status: 'rejected', errorText: 'invoice record was cancelled at AEAT' };
    }
    return {
      status: 'pending',
      ...(outcome.descripcion ? { errorText: outcome.descripcion } : {}),
    };
  }
}
