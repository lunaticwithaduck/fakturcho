import { describe, expect, it } from 'vitest';
import { extractBlocks, extractTagText, isSoapFault, soapFaultMessage } from './soap-xml';

describe('extractTagText', () => {
  it('reads text content regardless of namespace prefix', () => {
    expect(extractTagText('<tikR:CSV>A1B2C3</tikR:CSV>', 'CSV')).toBe('A1B2C3');
    expect(extractTagText('<CSV>A1B2C3</CSV>', 'CSV')).toBe('A1B2C3');
  });

  it('trims whitespace around the content', () => {
    expect(extractTagText('<x:EstadoEnvio>\n  Correcto \n</x:EstadoEnvio>', 'EstadoEnvio')).toBe(
      'Correcto',
    );
  });

  it('returns null when the tag is absent', () => {
    expect(extractTagText('<Other>1</Other>', 'CSV')).toBeNull();
  });

  it('returns an empty string for a self-closing or empty tag', () => {
    expect(extractTagText('<CSV/>', 'CSV')).toBe('');
    expect(extractTagText('<CSV></CSV>', 'CSV')).toBe('');
  });
});

describe('extractBlocks', () => {
  it('returns the inner XML of every occurrence', () => {
    const xml =
      '<r:RespuestaLinea><a>1</a></r:RespuestaLinea><r:RespuestaLinea><a>2</a></r:RespuestaLinea>';
    expect(extractBlocks(xml, 'RespuestaLinea')).toEqual(['<a>1</a>', '<a>2</a>']);
  });

  it('returns an empty array when there are no matches', () => {
    expect(extractBlocks('<x/>', 'RespuestaLinea')).toEqual([]);
  });
});

describe('isSoapFault / soapFaultMessage', () => {
  it('detects a namespaced SOAP 1.1 fault and reads its faultstring', () => {
    const xml =
      '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
      '<soapenv:Body><soapenv:Fault><faultcode>Client</faultcode>' +
      '<faultstring>Malformed request</faultstring></soapenv:Fault></soapenv:Body></soapenv:Envelope>';
    expect(isSoapFault(xml)).toBe(true);
    expect(soapFaultMessage(xml)).toBe('Malformed request');
  });

  it('is false for a normal response body', () => {
    expect(isSoapFault('<Envelope><Body><Foo/></Body></Envelope>')).toBe(false);
  });
});
