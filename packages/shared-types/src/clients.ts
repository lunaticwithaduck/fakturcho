import type { DocumentLanguage } from './countries';

// Nullable, never guessed: an existing client stays null (unmeasured) until
// someone picks one. AT §11 Abs. 1 Z 3 lit. b UStG 1994 is the first rule to
// read it, but it is not AT-specific — any country's issuance rules can use it.
export const CLIENT_TYPES = ['business', 'consumer'] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export interface ClientDto {
  id: string;
  companyName: string;
  eik: string | null;
  vatNumber: string | null;
  address: string | null;
  street: string | null;
  postcode: string | null;
  countyRegion: string | null;
  city: string | null;
  country: string;
  documentLanguage: DocumentLanguage | null;
  email: string | null;
  mol: string | null;
  peppolEndpointId: string | null;
  peppolScheme: string | null;
  sdiRecipientCode: string | null;
  pec: string | null;
  clientType: ClientType | null;
}

export interface CreateClientRequest {
  companyName: string;
  eik?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  street?: string | null;
  postcode?: string | null;
  countyRegion?: string | null;
  city?: string | null;
  country?: string;
  documentLanguage?: DocumentLanguage | null;
  email?: string | null;
  mol?: string | null;
  peppolEndpointId?: string | null;
  peppolScheme?: string | null;
  sdiRecipientCode?: string | null;
  pec?: string | null;
  clientType?: ClientType | null;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;
