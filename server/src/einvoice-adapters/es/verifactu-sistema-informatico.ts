import { sf } from './verifactu-xml';

export interface VerifactuSoftwareIdentity {
  nombreRazon: string;
  nif: string;
  nombreSistemaInformatico: string;
  idSistemaInformatico: string;
  version: string;
  numeroInstalacion: string;
}

export function sistemaInformaticoBlock(system: VerifactuSoftwareIdentity): string {
  return (
    '<sf:SistemaInformatico>' +
    sf('NombreRazon', system.nombreRazon) +
    sf('NIF', system.nif) +
    sf('NombreSistemaInformatico', system.nombreSistemaInformatico) +
    sf('IdSistemaInformatico', system.idSistemaInformatico) +
    sf('Version', system.version) +
    sf('NumeroInstalacion', system.numeroInstalacion) +
    sf('TipoUsoPosibleSoloVerifactu', 'S') +
    sf('TipoUsoPosibleMultiOT', 'S') +
    sf('IndicadorMultiplesOT', 'N') +
    '</sf:SistemaInformatico>'
  );
}
