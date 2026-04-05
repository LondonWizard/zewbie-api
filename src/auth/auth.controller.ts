import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import {
  RegisterSchema,
  RegisterRetailerSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './dto/auth.dto';
import type {
  RegisterDto,
  RegisterRetailerDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('register/retailer')
  @UsePipes(new ZodValidationPipe(RegisterRetailerSchema))
  registerRetailer(@Body() body: RegisterRetailerDto) {
    return this.authService.registerRetailer(body);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('refresh')
  refresh() {
    return { message: 'Token refresh will be handled by Clerk in Phase 1C' };
  }

  @Post('logout')
  logout() {
    return { message: 'Logout will be handled by Clerk in Phase 1C' };
  }
}
