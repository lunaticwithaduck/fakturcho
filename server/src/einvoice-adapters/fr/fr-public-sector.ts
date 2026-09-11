import type { RecipientSnapshotDto } from '@fakturcho/shared-types';
import { resolveFrenchBusinessIdentifier } from './fr-identifiers';

// INSEE reserves the leading digit of a SIREN for the public sphere: 1 for
// the State/central administration, 2 for territorial collectivities and
// their établissements (communes, départements, régions, EPCI...). A
// commercial company's SIREN is never allocated in that range.
const PUBLIC_SPHERE_SIREN_PREFIXES = new Set(['1', '2']);

const PUBLIC_SECTOR_NAME_MARKERS = [
  'commune de',
  'mairie de',
  'ville de',
  'departement',
  'region ',
  'conseil departemental',
  'conseil regional',
  'ministere',
  'prefecture',
  'sous-prefecture',
  'centre hospitalier',
  'chu ',
  'chr ',
  'hopital',
  'universite',
  'rectorat',
  'academie',
  'communaute de communes',
  "communaute d'agglomeration",
  'communaute urbaine',
  'metropole',
  'syndicat intercommunal',
  'sdis',
  'ccas',
  'cias',
  "office public de l'habitat",
  'etablissement public',
  'tresor public',
  'caisse des ecoles',
].map(normalize);

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function isFrenchPublicSectorRecipient(
  recipient: Pick<RecipientSnapshotDto, 'eik' | 'companyName'>,
): boolean {
  const identifier = resolveFrenchBusinessIdentifier(recipient.eik);
  const leadingDigit = identifier?.value.charAt(0) ?? '';
  if (PUBLIC_SPHERE_SIREN_PREFIXES.has(leadingDigit)) {
    return true;
  }
  if (recipient.companyName === null) return false;
  const normalizedName = normalize(recipient.companyName);
  return PUBLIC_SECTOR_NAME_MARKERS.some((marker) => normalizedName.includes(marker));
}
