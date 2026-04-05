import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { createClerkClient } from '@clerk/backend';
import { RegisterDto, RegisterRetailerDto, LoginDto } from './dto/auth.dto';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('clerk.secretKey');
    if (secretKey) {
      this.clerkClient = createClerkClient({ secretKey });
    }
  }

  /**
   * Registers a new consumer user. If Clerk is configured, creates the user
   * in Clerk first, then syncs to the local DB.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    let clerkId: string | null = null;

    if (this.clerkClient) {
      try {
        const clerkUser = await this.clerkClient.users.createUser({
          emailAddress: [dto.email],
          password: dto.password,
          firstName: dto.firstName,
          lastName: dto.lastName,
        });
        clerkId = clerkUser.id;
      } catch (error) {
        this.logger.error('Clerk user creation failed', (error as Error).message);
        throw new ConflictException('Failed to create authentication account');
      }
    }

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email: dto.email,
          passwordHash: await this.hashPassword(dto.password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: 'USER',
          status: clerkId ? 'ACTIVE' : 'PENDING',
          emailVerified: !!clerkId,
        },
      });
    } catch (error) {
      if (clerkId && this.clerkClient) {
        await this.clerkClient.users.deleteUser(clerkId).catch(() => {});
      }
      throw error;
    }

    this.logger.log(`User registered: ${user.id}${clerkId ? ` (Clerk: ${clerkId})` : ''}`);
    return { id: user.id, email: user.email, status: user.status };
  }

  /** Registers a new retailer user with a pending business profile. */
  async registerRetailer(dto: RegisterRetailerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    let clerkId: string | null = null;

    if (this.clerkClient) {
      try {
        const clerkUser = await this.clerkClient.users.createUser({
          emailAddress: [dto.email],
          password: dto.password,
          firstName: dto.firstName,
          lastName: dto.lastName,
          publicMetadata: { role: 'RETAILER' },
        });
        clerkId = clerkUser.id;
      } catch (error) {
        this.logger.error('Clerk retailer creation failed', (error as Error).message);
        throw new ConflictException('Failed to create authentication account');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        clerkId,
        email: dto.email,
        passwordHash: await this.hashPassword(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: 'RETAILER',
        status: 'PENDING',
        retailerProfile: {
          create: {
            businessName: dto.businessName,
            businessEmail: dto.businessEmail,
            taxId: dto.taxId,
            website: dto.website,
            status: 'PENDING',
          },
        },
      },
      include: { retailerProfile: true },
    });

    this.logger.log(`Retailer registered: ${user.id} (${dto.businessName})`);
    return { id: user.id, email: user.email, status: user.status };
  }

  /**
   * Fallback login when Clerk is not configured. Authenticates via
   * email/password and returns a signed JWT.
   */
  async login(dto: LoginDto) {
    if (this.clerkClient) {
      return {
        message: 'Use Clerk frontend SDK for authentication',
        clerkEnabled: true,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is disabled');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(user.id, user.role);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  private generateToken(userId: string, role: string): string {
    const secret = this.config.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET must be set — refusing to sign tokens without a secret');
    }
    return jwt.sign({ sub: userId, role }, secret, { expiresIn: '1h' });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /** Generates a password reset token. */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...(user.metadata as Record<string, unknown>),
          resetToken: token,
          resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });

    this.logger.log(`Password reset requested for ${email}`);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  /** Resets a password using a valid token. */
  async resetPassword(token: string, newPassword: string) {
    const users = await this.prisma.user.findMany({
      where: {
        metadata: { path: ['resetToken'], equals: token },
      },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = users[0];
    const metadata = user.metadata as Record<string, unknown>;
    const expiry = metadata.resetTokenExpiry as string | undefined;

    if (!expiry || new Date(expiry) < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await this.hashPassword(newPassword),
        metadata: { ...metadata, resetToken: null, resetTokenExpiry: null },
      },
    });

    if (this.clerkClient && user.clerkId) {
      try {
        await this.clerkClient.users.updateUser(user.clerkId, {
          password: newPassword,
        });
      } catch (error) {
        this.logger.error('Clerk password sync failed', (error as Error).message);
      }
    }

    return { message: 'Password reset successfully' };
  }

  /**
   * Syncs a Clerk user to the local DB. Called by webhooks on
   * user.created / user.updated events.
   */
  async syncClerkUser(
    clerkId: string,
    data: { email: string; firstName: string; lastName: string; imageUrl?: string },
  ) {
    return this.prisma.user.upsert({
      where: { clerkId },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.imageUrl,
        lastLoginAt: new Date(),
      },
      create: {
        clerkId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        avatarUrl: data.imageUrl,
        passwordHash: '',
        role: 'USER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  /** Deletes a user from Clerk when they deactivate their account. */
  async deleteClerkUser(clerkId: string) {
    if (this.clerkClient && clerkId) {
      try {
        await this.clerkClient.users.deleteUser(clerkId);
        this.logger.log(`Clerk user deleted: ${clerkId}`);
      } catch (error) {
        this.logger.error('Clerk user deletion failed', (error as Error).message);
      }
    }
  }
}
