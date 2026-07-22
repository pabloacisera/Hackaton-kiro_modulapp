import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginUseCase } from '../../../application/auth/use-cases/login.use-case';
import { RefreshUseCase } from '../../../application/auth/use-cases/refresh.use-case';
import { LogoutUseCase } from '../../../application/auth/use-cases/logout.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';

@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    return this.loginUseCase.execute(dto.email, dto.password, res);
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    return this.refreshUseCase.execute(req, res);
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    return this.logoutUseCase.execute(req, res);
  }
}
