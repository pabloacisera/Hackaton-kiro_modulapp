import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { InitiateRegistrationUseCase } from '../../../application/auth/use-cases/initiate-registration.use-case';
import { VerifyInviteCodeUseCase } from '../../../application/auth/use-cases/verify-invite-code.use-case';
import { CompleteRegistrationUseCase } from '../../../application/auth/use-cases/complete-registration.use-case';
import {
  InitiateRegistrationDto,
  VerifyInviteCodeDto,
  CompleteRegistrationDto,
} from '../dto/registration.dto';

/**
 * Public registration endpoints (no JWT required).
 * Flow:
 * 1. POST /admin/auth/register/initiate — sends email with registration link
 * 2. POST /admin/auth/register/verify-code — validates invite code
 * 3. POST /admin/auth/register/complete — sets password and creates admin
 */
@Controller('admin/auth/register')
export class RegistrationController {
  constructor(
    private readonly initiateRegistration: InitiateRegistrationUseCase,
    private readonly verifyInviteCode: VerifyInviteCodeUseCase,
    private readonly completeRegistration: CompleteRegistrationUseCase,
  ) {}

  @Post('initiate')
  async initiate(
    @Body() dto: InitiateRegistrationDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    // Build base URL for the admin dashboard (where the verify page lives)
    // The admin dashboard is served under /admin/ prefix (Vite base config)
    const adminBaseUrl = process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:3001/admin';
    await this.initiateRegistration.execute(dto.email, adminBaseUrl);
    return { message: 'Registration email sent. Check your inbox.' };
  }

  @Post('verify-code')
  async verify(@Body() dto: VerifyInviteCodeDto): Promise<{ verified: boolean }> {
    return this.verifyInviteCode.execute(dto.token, dto.code);
  }

  @Post('complete')
  async complete(@Body() dto: CompleteRegistrationDto): Promise<{ id: string; email: string }> {
    return this.completeRegistration.execute(dto.token, dto.password);
  }
}
