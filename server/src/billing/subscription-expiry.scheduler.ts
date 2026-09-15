import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RevolutService } from './revolut.service';
import { expireStalePendingSubscriptions } from './subscription-expiry';

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class SubscriptionExpiryScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SubscriptionExpiryScheduler.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly revolut: RevolutService,
  ) {}

  onApplicationBootstrap(): void {
    void this.sweep();
    this.timer = setInterval(() => void this.sweep(), SWEEP_INTERVAL_MS).unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await expireStalePendingSubscriptions(this.prisma, this.revolut, new Date());
    } catch (error) {
      this.logger.error(
        `subscription expiry sweep crashed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.running = false;
    }
  }
}
