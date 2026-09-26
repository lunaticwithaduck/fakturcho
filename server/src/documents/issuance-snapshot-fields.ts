import type { Client, IssuerProfile } from '@prisma/client';

// SPEC §4: at issuance, the issuer profile and client are copied verbatim
// onto the document so it keeps rendering unchanged forever after, even once
// the profile or client record itself changes. issuerIdentifiers is handled
// separately by the caller (a Prisma Json column rejects a plain `null`).
export function issuerSnapshotUpdateFields(profile: IssuerProfile | null) {
  return {
    issuerCompanyName: profile?.companyName ?? null,
    issuerEik: profile?.eik ?? null,
    issuerMol: profile?.mol ?? null,
    issuerAddressLine: profile?.addressLine ?? null,
    issuerStreet: profile?.street ?? null,
    issuerPostcode: profile?.postcode ?? null,
    issuerCountyRegion: profile?.countyRegion ?? null,
    issuerCity: profile?.city ?? null,
    issuerCountry: profile?.country ?? null,
    issuerPhone: profile?.phone ?? null,
    issuerVatRegistered: profile?.vatRegistered ?? false,
    issuerVatNumber: profile?.vatNumber ?? null,
    issuerBankName: profile?.bankName ?? null,
    issuerIban: profile?.iban ?? null,
    issuerBic: profile?.bic ?? null,
    issuerAltIban: profile?.altIban ?? null,
    issuerVatOnCashBasis: profile?.vatOnCashBasis ?? false,
    issuerVatOnDebits: profile?.vatOnDebits ?? false,
  };
}

export function recipientSnapshotUpdateFields(client: Client | null) {
  return {
    recipientCompanyName: client?.companyName ?? null,
    recipientEik: client?.eik ?? null,
    recipientVatNumber: client?.vatNumber ?? null,
    recipientAddress: client?.address ?? null,
    recipientStreet: client?.street ?? null,
    recipientPostcode: client?.postcode ?? null,
    recipientCountyRegion: client?.countyRegion ?? null,
    recipientCity: client?.city ?? null,
    recipientCountry: client?.country ?? null,
    recipientEmail: client?.email ?? null,
    recipientMol: client?.mol ?? null,
    recipientSdiRecipientCode: client?.sdiRecipientCode ?? null,
    recipientPec: client?.pec ?? null,
  };
}
