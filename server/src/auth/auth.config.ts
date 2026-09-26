import type { FeatureFlagKey, Locale } from '@fakturcho/shared-types';
import { getCountryConfig, isEuVatAreaCountry, isPublishedLocale } from '@fakturcho/shared-types';
import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { grantSignupCredits } from '../billing/signup-grant';
import type { EmailSender } from '../email/ports';
import { buildResetPasswordEmail } from '../email/reset-password-templates';

export interface AuthConfigOptions {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}

export interface FeatureFlagsReader {
  isEnabled(key: FeatureFlagKey): Promise<boolean>;
}

const ALWAYS_ENABLED: FeatureFlagsReader = { isEnabled: async () => true };
const NOOP_SENDER: EmailSender = { send: async () => {} };

function buildResetPasswordUrl(appOrigin: string, locale: Locale, token: string): string {
  const path = locale === 'bg' ? '/reset-password' : `/${locale}/reset-password`;
  return `${appOrigin}${path}?token=${token}`;
}

/**
 * Runs inside databaseHooks.user.create.before, not .after: the User row has
 * accountId NOT NULL, so the tenant must exist and be attached to the create
 * payload before Better-Auth inserts the row, not afterwards.
 */
async function provisionTenant(prisma: PrismaClient, signupCountry: unknown): Promise<string> {
  const country =
    typeof signupCountry === 'string' && signupCountry !== 'ES' && isEuVatAreaCountry(signupCountry)
      ? signupCountry
      : undefined;
  const account = await prisma.$transaction(async (tx) => {
    const created = await tx.account.create({ data: {} });
    await tx.issuerProfile.create({
      data: country ? { accountId: created.id, country } : { accountId: created.id },
    });
    // SPEC §11: the signup grant lands in the transaction that creates the account, exactly once
    await grantSignupCredits(tx, created.id);
    return created;
  });
  return account.id;
}

export function createAuth(
  prisma: PrismaClient,
  options: AuthConfigOptions,
  flags: FeatureFlagsReader = ALWAYS_ENABLED,
  sender: EmailSender = NOOP_SENDER,
) {
  return betterAuth({
    secret: options.secret,
    baseURL: options.baseURL,
    trustedOrigins: options.trustedOrigins,
    basePath: '/api/auth',
    // Railway's edge overwrites X-Real-IP with the connecting address; the app
    // reaches the api over the private network so the visitor's value survives.
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['x-real-ip'],
      },
    },
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        const rawLocale = 'locale' in user ? user.locale : undefined;
        const locale: Locale = isPublishedLocale(rawLocale) ? rawLocale : 'en';
        const url = buildResetPasswordUrl(
          options.trustedOrigins[0] ?? options.baseURL,
          locale,
          token,
        );
        const email = buildResetPasswordEmail(locale, url);
        await sender.send({
          to: user.email,
          subject: email.subject,
          text: email.text,
          locale,
          issuerName: null,
          replyTo: null,
        });
      },
    },
    user: {
      additionalFields: {
        accountId: {
          type: 'string',
          required: true,
          input: false,
          // parseUserInput requires every required additionalField to be
          // present before databaseHooks.user.create.before ever runs; the
          // hook always overwrites this placeholder with the real tenant id.
          defaultValue: '',
        },
        role: {
          type: 'string',
          input: false,
          defaultValue: 'user',
        },
        locale: {
          type: 'string',
          required: false,
          input: true,
          defaultValue: 'bg',
        },
        country: {
          type: 'string',
          required: false,
          input: true,
        },
      },
    },
    account: {
      modelName: 'authAccount',
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const accountId = await provisionTenant(prisma, user.country);
            const enLocale = await flags.isEnabled('EN_LOCALE');
            const locale = !enLocale
              ? 'bg'
              : typeof user.country === 'string' && user.country.length > 0
                ? getCountryConfig(user.country).locale
                : isPublishedLocale(user.locale)
                  ? user.locale
                  : 'bg';
            return { data: { ...user, accountId, locale } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
