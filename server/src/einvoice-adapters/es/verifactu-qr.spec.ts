import { describe, expect, it } from 'vitest';
import { buildVerifactuQrUrl } from './verifactu-qr';

describe('buildVerifactuQrUrl — AEAT ValidarQRNoVerifactu (Orden HAC/1177/2024 art. 21, AEAT.md §1.6)', () => {
  it('builds the non-Verifactu validation URL: nif, numserie, fecha (DD-MM-AAAA), importe (dot decimal)', () => {
    const url = buildVerifactuQrUrl({
      eik: 'B12345674',
      vatNumber: 'ESB12345674',
      numberPrefix: null,
      number: 15,
      numberSuffix: null,
      issuedAt: new Date('2026-09-04'),
      amount: 121000,
    });

    expect(url).toBe(
      'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQRNoVerifactu?nif=B12345674&numserie=0000000015&fecha=04-09-2026&importe=1210.00',
    );
  });

  it('strips the ES prefix from the VAT number when eik is absent', () => {
    const url = buildVerifactuQrUrl({
      eik: null,
      vatNumber: 'ESB12345674',
      numberPrefix: null,
      number: 15,
      numberSuffix: null,
      issuedAt: new Date('2026-09-04'),
      amount: 121000,
    });

    expect(url).toContain('nif=B12345674');
  });

  it('includes the number prefix/suffix affixes in numserie', () => {
    const url = buildVerifactuQrUrl({
      eik: 'B12345674',
      vatNumber: null,
      numberPrefix: 'F-',
      number: 7,
      numberSuffix: '/A',
      issuedAt: new Date('2026-01-15'),
      amount: 5000,
    });

    expect(url).toContain('numserie=F-0000000007%2FA');
    expect(url).toContain('fecha=15-01-2026');
    expect(url).toContain('importe=50.00');
  });
});
