import { request as httpsRequest } from 'node:https';

export interface SoapHttpResponse {
  statusCode: number;
  body: string;
}

export interface SoapTlsOptions {
  cert?: string | undefined;
  key?: string | undefined;
  ca?: string | undefined;
}

export type SoapPost = (
  url: string,
  body: string,
  soapAction: string,
  tls?: SoapTlsOptions,
) => Promise<SoapHttpResponse>;

export const postSoapXml: SoapPost = (url, body, soapAction, tls = {}) =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const payload = Buffer.from(body, 'utf8');
    const req = httpsRequest(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        cert: tls.cert,
        key: tls.key,
        ca: tls.ca,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Content-Length': payload.byteLength,
          SOAPAction: soapAction,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
