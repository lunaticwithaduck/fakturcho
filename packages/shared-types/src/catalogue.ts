import type { Cents } from './money';

export interface CatalogueItemDto {
  id: string;
  name: string;
  defaultUnitPrice: Cents;
  unit: string;
}

export interface CreateCatalogueItemRequest {
  name: string;
  defaultUnitPrice: Cents;
  unit: string;
}

export type UpdateCatalogueItemRequest = Partial<CreateCatalogueItemRequest>;
