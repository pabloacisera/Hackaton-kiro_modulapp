import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GenerateInviteCodeUseCase } from '../../../application/auth/use-cases/generate-invite-code.use-case';

/**
 * Settings controller — accessible only by authenticated admins.
 * Provides configuration actions like generating invite codes.
 */
@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly generateInviteCode: GenerateInviteCodeUseCase) {}

  @Post('invite-code')
  async createInviteCode(@Req() req: any): Promise<{ code: string; expiresIn: number }> {
    const user = req.user as { sub: string; email: string };
    return this.generateInviteCode.execute(user.email);
  }
}
