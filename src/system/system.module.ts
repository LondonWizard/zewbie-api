import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [TerminusModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
