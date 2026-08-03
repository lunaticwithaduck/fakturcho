export interface ClientDto {
  id: string;
  companyName: string;
  eik: string | null;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
  mol: string | null;
}

export interface CreateClientRequest {
  companyName: string;
  eik?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  email?: string | null;
  mol?: string | null;
}

export type UpdateClientRequest = Partial<CreateClientRequest>;
