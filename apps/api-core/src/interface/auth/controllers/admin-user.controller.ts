import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateAdminUseCase } from '../../../application/auth/use-cases/create-admin.use-case';
import { DeactivateAdminUseCase } from '../../../application/auth/use-cases/deactivate-admin.use-case';
import { CreateAdminDto } from '../dto/create-admin.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(
    private readonly createAdminUseCase: CreateAdminUseCase,
    private readonly deactivateAdminUseCase: DeactivateAdminUseCase,
  ) {}

  @Post()
  async createAdmin(@Body() dto: CreateAdminDto): Promise<{ id: string; email: string }> {
    return this.createAdminUseCase.execute(dto.email, dto.password);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateAdmin(@Param('id') id: string): Promise<void> {
    return this.deactivateAdminUseCase.execute(id);
  }
}
