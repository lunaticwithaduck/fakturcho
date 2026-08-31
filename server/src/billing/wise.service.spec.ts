import { sign as cryptoSign, generateKeyPairSync } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../infrastructure/prisma/prisma.service';
import { startTestDatabase, type TestDatabase } from '../testing/test-database';
import { WiseService } from './wise.service';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function sign(rawBody: string): string {
  return cryptoSign('RSA-SHA256', Buffer.from(rawBody), {
    key: privateKey,
    padding: 1, // crypto.constants.RSA_PKCS1_PADDING
  }).toString('base64');
}

function statementResponse(transactions: unknown[]): Response {
  return new Response(JSON.stringify({ transactions }), { status: 200 });
}

describe('WiseService', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    process.env.WISE_ENVIRONMENT = 'sandbox';
    process.env.WISE_API_TOKEN = 'test-token';
    process.env.WISE_PROFILE_ID = '111';
    process.env.WISE_BALANCE_ID = '222';
    process.env.WISE_IBAN = 'BE00000000000000';
    process.env.WISE_ACCOUNT_HOLDER_NAME = 'Fakturcho';
    process.env.WISE_WEBHOOK_PUBLIC_KEY = publicKey;
  }, 120_000);

  afterAll(async () => {
    await db.stop();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function service(): WiseService {
    return new WiseService(db.prisma as unknown as PrismaService);
  }

  it('creates a pending purchase and returns transfer instructions with a unique reference', async () => {
    const account = await db.prisma.account.create({ data: {} });
    const dto = await service().createTransferInstructions(account.id, 'pack10');

    expect(dto.amountCents).toBe(1000);
    expect(dto.currency).toBe('EUR');
    expect(dto.iban).toBe('BE00000000000000');
    expect(dto.reference).toMatch(/^FKT-[A-Z0-9]{8}$/);

    const pending = await db.prisma.wisePendingPurchase.findUnique({
      where: { reference: dto.reference },
    });
    expect(pending).toMatchObject({
      accountId: account.id,
      creditCents: 1000,
      amountCents: 1000,
      status: 'PENDING',
    });
  });

  describe('live environment with no webhook key configured', () => {
    it('boots without throwing, and fails closed on signature verification', () => {
      const prevEnv = process.env.WISE_ENVIRONMENT;
      const prevKey = process.env.WISE_WEBHOOK_PUBLIC_KEY;
      process.env.WISE_ENVIRONMENT = 'live';
      process.env.WISE_WEBHOOK_PUBLIC_KEY = '';
      try {
        // this must never throw — a missing live key can't take down every other route at boot
        const wise = service();
        expect(wise.verifyWebhookSignature('{"event_type":"balances#update"}', 'anything')).toBe(
          false,
        );
      } finally {
        process.env.WISE_ENVIRONMENT = prevEnv;
        process.env.WISE_WEBHOOK_PUBLIC_KEY = prevKey;
      }
    });
  });

  describe('verifyWebhookSignature', () => {
    it('accepts a body signed with the matching private key', () => {
      const body = '{"event_type":"balances#update"}';
      expect(service().verifyWebhookSignature(body, sign(body))).toBe(true);
    });

    it('rejects a tampered body', () => {
      const body = '{"event_type":"balances#update"}';
      const signature = sign(body);
      expect(service().verifyWebhookSignature('{"event_type":"tampered"}', signature)).toBe(false);
    });

    it('rejects garbage input rather than throwing', () => {
      expect(service().verifyWebhookSignature('body', 'not-base64-signature!!')).toBe(false);
    });
  });

  describe('handleBalanceUpdateWebhook reconciliation', () => {
    function balanceUpdateEvent() {
      return {
        event_type: 'balances#update' as const,
        data: { resource: { id: 222, profile_id: 111, type: 'balance-account' }, occurred_at: '' },
      };
    }

    it('fulfils a pending purchase whose reference appears in the statement description', async () => {
      const account = await db.prisma.account.create({ data: {} });
      const wise = service();
      const dto = await wise.createTransferInstructions(account.id, 'pack5');

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          statementResponse([
            {
              type: 'CREDIT',
              date: '2026-08-31',
              amount: { value: 5, currency: 'EUR' },
              referenceNumber: 'TX-1',
              details: { description: `Payment from Jane Doe ${dto.reference}` },
            },
          ]),
        ),
      );

      await wise.handleBalanceUpdateWebhook(balanceUpdateEvent());

      const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.creditBalanceCents).toBe(500);

      const pending = await db.prisma.wisePendingPurchase.findUniqueOrThrow({
        where: { reference: dto.reference },
      });
      expect(pending.status).toBe('FULFILLED');

      const entries = await db.prisma.creditLedgerEntry.findMany({
        where: { accountId: account.id },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        amountCents: 500,
        reason: 'PURCHASE',
        wiseTransactionId: 'TX-1',
      });
    });

    it('is idempotent — the same statement entry delivered twice credits once', async () => {
      const account = await db.prisma.account.create({ data: {} });
      const wise = service();
      const dto = await wise.createTransferInstructions(account.id, 'pack5');
      const entry = {
        type: 'CREDIT',
        date: '2026-08-31',
        amount: { value: 5, currency: 'EUR' },
        referenceNumber: 'TX-dup',
        details: { description: dto.reference },
      };
      // a fresh Response per call — its body stream can only be read once, and this delivers twice
      const fetchMock = vi.fn().mockImplementation(async () => statementResponse([entry]));
      vi.stubGlobal('fetch', fetchMock);

      await wise.handleBalanceUpdateWebhook(balanceUpdateEvent());
      await wise.handleBalanceUpdateWebhook(balanceUpdateEvent());

      const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.creditBalanceCents).toBe(500);
      const entries = await db.prisma.creditLedgerEntry.count({ where: { accountId: account.id } });
      expect(entries).toBe(1);
    });

    it('does not fulfil when the transferred amount is short of what was requested', async () => {
      const account = await db.prisma.account.create({ data: {} });
      const wise = service();
      const dto = await wise.createTransferInstructions(account.id, 'pack10');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          statementResponse([
            {
              type: 'CREDIT',
              date: '2026-08-31',
              amount: { value: 5, currency: 'EUR' }, // 500 cents, pack10 wants 1000
              referenceNumber: 'TX-short',
              details: { description: dto.reference },
            },
          ]),
        ),
      );

      await wise.handleBalanceUpdateWebhook(balanceUpdateEvent());

      const updated = await db.prisma.account.findUniqueOrThrow({ where: { id: account.id } });
      expect(updated.creditBalanceCents).toBe(0);
      const pending = await db.prisma.wisePendingPurchase.findUniqueOrThrow({
        where: { reference: dto.reference },
      });
      expect(pending.status).toBe('PENDING');
    });

    it('ignores balances#update events for a different balance id', async () => {
      const wise = service();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await wise.handleBalanceUpdateWebhook({
        event_type: 'balances#update',
        data: { resource: { id: 999, profile_id: 111, type: 'balance-account' }, occurred_at: '' },
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('ignores CREDIT entries with no matching pending purchase', async () => {
      const wise = service();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          statementResponse([
            {
              type: 'CREDIT',
              date: '2026-08-31',
              amount: { value: 5, currency: 'EUR' },
              referenceNumber: 'TX-orphan',
              details: { description: 'no reference here' },
            },
          ]),
        ),
      );

      await expect(wise.handleBalanceUpdateWebhook(balanceUpdateEvent())).resolves.toBeUndefined();
    });
  });
});
