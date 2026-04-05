import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { verifyToken } from '@clerk/backend';

const IS_PUBLIC_KEY = 'isPublic';

/**
 * Verifies Clerk session tokens from the Authorization header using
 * Clerk's backend SDK for JWKS-based verification.
 * Falls back to permissive dev mode when CLERK_SECRET_KEY is not set.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private readonly clerkSecretKey: string | undefined;

  constructor(
    private config: ConfigService,
    private reflector: Reflector,
  ) {
    this.clerkSecretKey = this.config.get<string>('clerk.secretKey');
    if (this.clerkSecretKey) {
      this.logger.log('Clerk auth guard initialized with secret key');
    } else {
      this.logger.warn('Clerk secret not configured — running in dev fallback mode');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & {
      userId?: string;
      userRole?: string;
      clerkSessionClaims?: Record<string, unknown>;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);

    if (!this.clerkSecretKey) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('CLERK_SECRET_KEY not set in production — rejecting request');
        throw new UnauthorizedException('Authentication service unavailable');
      }
      return this.devFallback(request, token);
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
      });
      request.userId = payload.sub;
      request.clerkSessionClaims = payload as unknown as Record<string, unknown>;

      const publicMetadata = (payload as Record<string, unknown>).public_metadata as
        | { role?: string }
        | undefined;
      request.userRole = publicMetadata?.role ?? 'USER';

      return true;
    } catch (error) {
      this.logger.warn(`Token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired session token');
    }
  }

  /** In dev mode without Clerk, decode the JWT payload without verification. */
  private devFallback(
    request: Request & { userId?: string; userRole?: string },
    token: string,
  ): boolean {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64url').toString('utf-8'),
        ) as { sub?: string; role?: string };
        request.userId = payload.sub ?? 'dev-user';
        request.userRole = payload.role ?? 'USER';
      } else {
        request.userId = 'dev-user';
        request.userRole = 'USER';
      }
      return true;
    } catch {
      request.userId = 'dev-user';
      request.userRole = 'USER';
      return true;
    }
  }
}
