import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';

const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations');

export interface TestDatabase {
  url: string;
  prisma: PrismaClient;
  stop: () => Promise<void>;
}

export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const url = container.getConnectionUri();
  await applyMigrations(url);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  return {
    url,
    prisma,
    stop: async () => {
      await prisma.$disconnect();
      await container.stop();
    },
  };
}

async function applyMigrations(url: string): Promise<void> {
  const client = new Client({ connectionString: url });
  await client.connect();
  const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const name of migrations) {
    const sql = readFileSync(join(MIGRATIONS_DIR, name, 'migration.sql'), 'utf-8');
    await client.query(sql);
  }
  await client.end();
}
