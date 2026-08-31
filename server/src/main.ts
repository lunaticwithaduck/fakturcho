import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const webhookLogger = new Logger('WebhookProbe');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // Diagnostic: Wise's callback-URL validation never reaches BillingController's own log line —
  // catch it here, before Nest routing, to see the request even if the method/path doesn't match
  // any route (a 404 produces no log line otherwise).
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.path.includes('/billing/webhook')) {
      webhookLogger.log(`${req.method} ${req.path} headers=${JSON.stringify(req.headers)}`);
    }
    next();
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
