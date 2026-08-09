import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { grantSignupCredits } from '../billing/signup-grant';

export interface AuthConfigOptions {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}

/**
 * Runs inside databaseHooks.user.create.before, not .after: the User row has
 * accountId NOT NULL, so the tenant must exist and be attached to the create
 * payload before Better-Auth inserts the row, not afterwards.
 */
async function provisionTenant(prisma: PrismaClient): Promise<string> {
  const account = await prisma.$transaction(async (tx) => {
    const created = await tx.account.create({ data: {} });
    await tx.issuerProfile.create({ data: { accountId: created.id } });
    // SPEC §11: the signup grant lands in the transaction that creates the account, exactly once
    await grantSignupCredits(tx, created.id);
    return created;
  });
  return account.id;
}

export function createAuth(prisma: PrismaClient, options: AuthConfigOptions) {
  return betterAuth({
    secret: options.secret,
    baseURL: options.baseURL,
    trustedOrigins: options.trustedOrigins,
    basePath: '/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
      enabled: true,
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
      },
    },
    account: {
      modelName: 'authAccount',
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const accountId = await provisionTenant(prisma);
            return { data: { ...user, accountId } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
