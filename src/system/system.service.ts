import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaService,
  ) {}

  /** Runs registered health indicators: memory + database connectivity. */
  async checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      async () => {
        const healthy = await this.prisma.isHealthy();
        return {
          database: {
            status: healthy ? ('up' as const) : ('down' as const),
          },
        };
      },
    ]);
  }
}
