import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/** Extracts the authenticated user's ID from the request (set by ClerkAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { userId?: string }>();
    if (!request.userId) {
      throw new UnauthorizedException('User identity not found in request');
    }
    return request.userId;
  },
);

/** Extracts the authenticated user's role from the request (set by ClerkAuthGuard). */
export const CurrentUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { userRole?: string }>();
    return request.userRole ?? 'USER';
  },
);
