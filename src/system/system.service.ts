import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';

@Injectable()
export class SystemService {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  /** Runs registered health indicators (memory, future: db, redis). */
  async checkHealth() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
    ]);
  }
}
