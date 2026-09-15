import { Injectable, Optional } from '@nestjs/common';
import type {
  EinvoiceTransport,
  EinvoiceTransportSendParams,
  EinvoiceTransportSendResult,
  EinvoiceTransportStatusResult,
} from '../../einvoice/transport/einvoice-transport.interface';
import { readFaceConfig } from './aeat-config';
import { invoiceSeriesNumber } from './es-invoice-id';
import { buildConsultarFacturaEnvelope, buildEnviarFacturaEnvelope } from './face-envelope';
import { signFaceEnvelope } from './face-wsse';
import { postSoapXml, type SoapHttpResponse, type SoapPost } from './soap-http';
import { extractBlocks, extractTagText, isSoapFault, soapFaultMessage } from './soap-xml';

const TEST_ENDPOINT = 'https://se-face-webservice.redsara.es/facturasspp2';
const PROD_ENDPOINT = 'https://webservice.face.gob.es/facturasspp2';

// Resultado.codigo of "0" is the documented success code for every FACe SARCF
// operation; any other value is a rejection carrying its own descripcion.
const SUCCESS_CODE = '0';

// EstadoFactura.codigo catalogue (FACe "Resumen de los estados", flujo ordinario /
// flujo de anulación). Everything on the ordinary path up to and including payment
// counts as accepted; 2600/3100 are terminal negative outcomes, and an accepted
// cancellation request (4300) voids an otherwise-accepted invoice.
const TRAMITACION_REJECTED = new Set(['2600', '3100']);
const ANULACION_ACCEPTED = '4300';

@Injectable()
export class FaceTransport implements EinvoiceTransport {
  readonly providerName = 'face';
  readonly country = 'ES';

  constructor(
    @Optional() private readonly post: SoapPost = postSoapXml,
    @Optional() private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  isConfigured(): boolean {
    return readFaceConfig(this.env) !== null;
  }

  private endpoint(environment: 'test' | 'prod'): string {
    return environment === 'prod' ? PROD_ENDPOINT : TEST_ENDPOINT;
  }

  async send(params: EinvoiceTransportSendParams): Promise<EinvoiceTransportSendResult> {
    const config = readFaceConfig(this.env);
    if (!config) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: 'FACe transport is not configured',
      };
    }

    const envelope = buildEnviarFacturaEnvelope({
      correo: params.document.recipient.email ?? params.document.issuer.companyName ?? '',
      facturaBase64: Buffer.from(params.xml, 'utf8').toString('base64'),
      facturaFileName: `${invoiceSeriesNumber(params.document)}.xml`,
      facturaMime: 'application/xml',
    });
    const signed = signFaceEnvelope(envelope, config.signingCertPem, config.signingKeyPem);

    let response: SoapHttpResponse;
    try {
      response = await this.post(
        this.endpoint(config.environment),
        signed,
        'https://webservice.face.gob.es#enviarFactura',
      );
    } catch (error) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: `FACe request failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (isSoapFault(response.body)) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: soapFaultMessage(response.body),
      };
    }

    const codigo = extractTagText(response.body, 'codigo');
    const descripcion = extractTagText(response.body, 'descripcion');
    if (response.statusCode >= 400 || codigo !== SUCCESS_CODE) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: descripcion ?? `FACe returned resultado.codigo=${codigo ?? '(none)'}`,
      };
    }

    const numeroRegistro = extractTagText(response.body, 'numeroRegistro');
    if (!numeroRegistro) {
      return {
        providerMessageId: '',
        status: 'rejected',
        errorText: 'FACe accepted the request but returned no numeroRegistro',
      };
    }

    return { providerMessageId: numeroRegistro, status: 'sent', receipt: response.body };
  }

  async checkStatus(providerMessageId: string): Promise<EinvoiceTransportStatusResult> {
    const config = readFaceConfig(this.env);
    if (!config) {
      return { status: 'pending', errorText: 'FACe transport is not configured' };
    }

    const envelope = buildConsultarFacturaEnvelope(providerMessageId);
    const signed = signFaceEnvelope(envelope, config.signingCertPem, config.signingKeyPem);

    let response: SoapHttpResponse;
    try {
      response = await this.post(
        this.endpoint(config.environment),
        signed,
        'https://webservice.face.gob.es#consultarFactura',
      );
    } catch (error) {
      return {
        status: 'pending',
        errorText: `FACe query failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (isSoapFault(response.body)) {
      return { status: 'pending', errorText: soapFaultMessage(response.body) };
    }

    const [resultadoBlock] = extractBlocks(response.body, 'resultado');
    const codigo = resultadoBlock
      ? extractTagText(resultadoBlock, 'codigo')
      : extractTagText(response.body, 'codigo');
    if (codigo !== SUCCESS_CODE) {
      const descripcion = resultadoBlock ? extractTagText(resultadoBlock, 'descripcion') : null;
      return { status: 'pending', ...(descripcion ? { errorText: descripcion } : {}) };
    }

    // <tramitacion> and <anulacion> are each an EstadoFactura (codigo/descripcion/motivo).
    const [tramitacionBlock] = extractBlocks(response.body, 'tramitacion');
    const [anulacionBlock] = extractBlocks(response.body, 'anulacion');
    const anulacionCodigo = anulacionBlock ? extractTagText(anulacionBlock, 'codigo') : null;
    if (anulacionCodigo === ANULACION_ACCEPTED) {
      return { status: 'rejected', errorText: 'invoice cancellation was accepted at FACe' };
    }

    const tramitacionCodigo = tramitacionBlock ? extractTagText(tramitacionBlock, 'codigo') : null;
    const tramitacionDescripcion = tramitacionBlock
      ? extractTagText(tramitacionBlock, 'descripcion')
      : undefined;
    if (tramitacionCodigo && TRAMITACION_REJECTED.has(tramitacionCodigo)) {
      return {
        status: 'rejected',
        ...(tramitacionDescripcion ? { errorText: tramitacionDescripcion } : {}),
      };
    }

    return { status: 'accepted', receipt: response.body };
  }
}
