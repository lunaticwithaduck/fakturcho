export interface Dir3Codes {
  organoGestor: string;
  unidadTramitadora: string;
  oficinaContable: string;
}

// DIR3 codes (a 9-character code: one org-type letter followed by 8 alphanumerics,
// e.g. "L01280796") identify the órgano gestor, unidad tramitadora and oficina contable
// a public-body buyer requires on a FACe submission (Ley 25/2013 art. 6). The document
// model has no dedicated field for them, so we thread them through the existing generic
// `buyerReference`, prefixed to distinguish them from an ordinary purchase-order
// reference: "DIR3:<organoGestor>:<unidadTramitadora>:<oficinaContable>".
const DIR3_CODE = /^[A-Z][A-Z0-9]{8}$/;
const DIR3_PREFIX = 'DIR3:';

export function formatDir3BuyerReference(codes: Dir3Codes): string {
  return `${DIR3_PREFIX}${codes.organoGestor}:${codes.unidadTramitadora}:${codes.oficinaContable}`;
}

export function parseDir3BuyerReference(buyerReference: string | null): Dir3Codes | null {
  if (!buyerReference?.startsWith(DIR3_PREFIX)) return null;
  const parts = buyerReference.slice(DIR3_PREFIX.length).split(':');
  if (parts.length !== 3) return null;
  const [organoGestor, unidadTramitadora, oficinaContable] = parts as [string, string, string];
  if (![organoGestor, unidadTramitadora, oficinaContable].every((code) => DIR3_CODE.test(code))) {
    return null;
  }
  return { organoGestor, unidadTramitadora, oficinaContable };
}

export function isPublicBodyRecipient(buyerReference: string | null): boolean {
  return parseDir3BuyerReference(buyerReference) !== null;
}
