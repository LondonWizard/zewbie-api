import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register() {
    return { message: 'POST /auth/register - placeholder', status: 'not_implemented' };
  }

  @Post('register/retailer')
  registerRetailer() {
    return { message: 'POST /auth/register/retailer - placeholder', status: 'not_implemented' };
  }

  @Post('login')
  login() {
    return { message: 'POST /auth/login - placeholder', status: 'not_implemented' };
  }

  @Post('refresh')
  refresh() {
    return { message: 'POST /auth/refresh - placeholder', status: 'not_implemented' };
  }

  @Post('logout')
  logout() {
    return { message: 'POST /auth/logout - placeholder', status: 'not_implemented' };
  }

  @Post('forgot-password')
  forgotPassword() {
    return { message: 'POST /auth/forgot-password - placeholder', status: 'not_implemented' };
  }

  @Post('reset-password')
  resetPassword() {
    return { message: 'POST /auth/reset-password - placeholder', status: 'not_implemented' };
  }

  @Post('verify-email')
  verifyEmail() {
    return { message: 'POST /auth/verify-email - placeholder', status: 'not_implemented' };
  }

  @Post('resend-verification')
  resendVerification() {
    return { message: 'POST /auth/resend-verification - placeholder', status: 'not_implemented' };
  }

  @Post('social/:provider')
  socialAuth(@Param('provider') provider: string) {
    return { message: `POST /auth/social/${provider} - placeholder`, status: 'not_implemented' };
  }

  @Post('2fa/enable')
  enable2fa() {
    return { message: 'POST /auth/2fa/enable - placeholder', status: 'not_implemented' };
  }

  @Post('2fa/verify')
  verify2fa() {
    return { message: 'POST /auth/2fa/verify - placeholder', status: 'not_implemented' };
  }

  @Post('2fa/disable')
  disable2fa() {
    return { message: 'POST /auth/2fa/disable - placeholder', status: 'not_implemented' };
  }

  @Post('admin/login')
  adminLogin() {
    return { message: 'POST /auth/admin/login - placeholder', status: 'not_implemented' };
  }
}
