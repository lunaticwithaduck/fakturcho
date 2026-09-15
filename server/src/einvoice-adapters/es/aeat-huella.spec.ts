import { describe, expect, it } from 'vitest';
import {
  computeRegistroAltaHuella,
  computeRegistroAnulacionHuella,
  huellaAltaInput,
  huellaAnulacionInput,
} from './aeat-huella';

// Worked examples from AEAT's own published spec:
// Veri-Factu_especificaciones_huella_hash_registros.pdf, v0.1.2, §6.

describe('computeRegistroAltaHuella', () => {
  it('matches the AEAT worked example — first record of the chain (case 1)', () => {
    const input = huellaAltaInput({
      idEmisorFactura: '89890001K',
      numSerieFactura: '12345678/G33',
      fechaExpedicionFactura: '01-01-2024',
      tipoFactura: 'F1',
      cuotaTotal: '12.35',
      importeTotal: '123.45',
      huellaAnterior: '',
      fechaHoraHusoGenRegistro: '2024-01-01T19:20:30+01:00',
    });

    expect(input).toBe(
      'IDEmisorFactura=89890001K&NumSerieFactura=12345678/G33&FechaExpedicionFactura=01-01-' +
        '2024&TipoFactura=F1&CuotaTotal=12.35&ImporteTotal=123.45&Huella=&FechaHoraHusoGenRegistro=' +
        '2024-01-01T19:20:30+01:00',
    );
    expect(
      computeRegistroAltaHuella({
        idEmisorFactura: '89890001K',
        numSerieFactura: '12345678/G33',
        fechaExpedicionFactura: '01-01-2024',
        tipoFactura: 'F1',
        cuotaTotal: '12.35',
        importeTotal: '123.45',
        huellaAnterior: '',
        fechaHoraHusoGenRegistro: '2024-01-01T19:20:30+01:00',
      }),
    ).toBe('3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60');
  });

  it('matches the AEAT worked example — chained record (case 2)', () => {
    const huella = computeRegistroAltaHuella({
      idEmisorFactura: '89890001K',
      numSerieFactura: '12345679/G34',
      fechaExpedicionFactura: '01-01-2024',
      tipoFactura: 'F1',
      cuotaTotal: '12.35',
      importeTotal: '123.45',
      huellaAnterior: '3C464DAF61ACB827C65FDA19F352A4E3BDC2C640E9E9FC4CC058073F38F12F60',
      fechaHoraHusoGenRegistro: '2024-01-01T19:20:35+01:00',
    });

    expect(huella).toBe('F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97');
  });
});

describe('computeRegistroAnulacionHuella', () => {
  it('matches the AEAT worked example — cancellation record (case 3)', () => {
    const input = huellaAnulacionInput({
      idEmisorFacturaAnulada: '89890001K',
      numSerieFacturaAnulada: '12345679/G34',
      fechaExpedicionFacturaAnulada: '01-01-2024',
      huellaAnterior: 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97',
      fechaHoraHusoGenRegistro: '2024-01-01T19:20:40+01:00',
    });

    expect(input).toBe(
      'IDEmisorFacturaAnulada=89890001K&NumSerieFacturaAnulada=12345679/G34&' +
        'FechaExpedicionFacturaAnulada=01-01-2024&' +
        'Huella=F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97&' +
        'FechaHoraHusoGenRegistro=2024-01-01T19:20:40+01:00',
    );
    expect(
      computeRegistroAnulacionHuella({
        idEmisorFacturaAnulada: '89890001K',
        numSerieFacturaAnulada: '12345679/G34',
        fechaExpedicionFacturaAnulada: '01-01-2024',
        huellaAnterior: 'F7B94CFD8924EDFF273501B01EE5153E4CE8F259766F88CF6ACB8935802A2B97',
        fechaHoraHusoGenRegistro: '2024-01-01T19:20:40+01:00',
      }),
    ).toBe('177547C0D57AC74748561D054A9CEC14B4C4EA23D1BEFD6F2E69E3A388F90C68');
  });
});
