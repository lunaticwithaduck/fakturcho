import type { Locale } from './countries';

export interface ClientDto {
  id: string;
  companyName: string;
  eik: string | null;
  vatNumber: string | null;
  address: string | null;
  street: string | null;
  postcode: string | null;
  country: string;
  documentLanguage: Locale | null;
  email: string | null;
  mol: string | null;
  peppolEndpointId: string | null;
  peppolScheme: string | null;
}

export interface CreateClientRequest {
  companyName: string;
  eik?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  street?: string | null;
  postcode?: string | null;
  country?: string;
  documentLanguage?: Locale | null;
  email?: string | null;
  mol?: string | null;
  peppolEndpointId?: string | null;
  peppolScheme?: string | null;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;
