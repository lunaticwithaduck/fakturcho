import type { Cents } from './money';

export interface CatalogueItemDto {
  id: string;
  name: string;
  defaultUnitPrice: Cents;
  unit: string;
  unitCode: string | null;
}

export interface CreateCatalogueItemRequest {
  name: string;
  defaultUnitPrice: Cents;
  unit: string;
  unitCode?: string | null;
}

export type UpdateCatalogueItemRequest = Partial<CreateCatalogueItemRequest>;
