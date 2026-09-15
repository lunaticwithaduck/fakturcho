import { getCountryConfig } from '@fakturcho/shared-types';
import { z } from 'zod';

interface CountryPatternedFields {
  country?: string | undefined;
  countyRegion?: string | null | undefined;
  identifiers?: Record<string, string> | undefined;
}

export function withCountryFieldPatterns<T extends CountryPatternedFields>(
  schema: z.ZodType<T>,
  fallbackCountry?: string,
) {
  return schema.superRefine((data, ctx) => {
    const country = data.country ?? fallbackCountry;
    if (!country) return;
    const config = getCountryConfig(country);

    if (data.countyRegion && config.countyRegion?.pattern) {
      if (!config.countyRegion.pattern.test(data.countyRegion)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['countyRegion'],
          message: `${config.countyRegion.label} has an invalid format.`,
        });
      }
    }

    if (data.identifiers) {
      for (const field of config.identifiers) {
        const value = data.identifiers[field.key];
        if (value && field.pattern && !field.pattern.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['identifiers', field.key],
            message: `${field.label} has an invalid format.`,
          });
        }
      }
    }
  });
}
