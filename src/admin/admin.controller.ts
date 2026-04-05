import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaginationSchema } from '../common/dto/pagination.dto';
import type { PaginationDto } from '../common/dto/pagination.dto';
import { ReviewRetailerSchema } from './dto/admin.dto';
import type { ReviewRetailerDto } from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  listUsers(
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers(query, { role, status });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/suspend')
  suspendUser(@Param('id') id: string, @CurrentUser() actorId: string) {
    return this.adminService.suspendUser(id, actorId);
  }

  @Get('retailers/pending')
  listPendingRetailers(
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
  ) {
    return this.adminService.listPendingRetailers(query);
  }

  @Post('retailers/:id/review')
  reviewRetailer(
    @Param('id') id: string,
    @CurrentUser() actorId: string,
    @Body(new ZodValidationPipe(ReviewRetailerSchema)) body: ReviewRetailerDto,
  ) {
    return this.adminService.reviewRetailer(id, body.decision, actorId);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query(new ZodValidationPipe(PaginationSchema)) query: PaginationDto,
  ) {
    return this.adminService.getAuditLogs(query);
  }
}
