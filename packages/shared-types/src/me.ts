import type { Locale } from './countries';
import type { UserRole } from './enums';

export interface MeDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locale: Locale;
}
