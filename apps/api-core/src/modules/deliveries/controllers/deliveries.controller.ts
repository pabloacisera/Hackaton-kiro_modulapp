import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { DeliveryUseCase } from '../use-cases/delivery.use-case';
import { DeliveryOrigin, DeliveryStatus } from '../domain/delivery-item.entity';

class PostponeDto {
  @IsDateString()
  @IsNotEmpty()
  newDate!: string;
}

@Controller('admin/deliveries')
@UseGuards(JwtAuthGuard)
export class DeliveriesController {
  constructor(private readonly deliveryUseCase: DeliveryUseCase) {}

  // TASK-delivery-2: GET /api/admin/deliveries
  @Get()
  async list(
    @Query('status') status?: DeliveryStatus,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.deliveryUseCase.list({
      status,
      q,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  // TASK-delivery-3: PATCH /api/admin/deliveries/:origin/:id/deliver
  @Patch(':origin/:id/deliver')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deliver(@Param('origin') origin: DeliveryOrigin, @Param('id') id: string) {
    await this.deliveryUseCase.deliver(origin, id);
  }

  // TASK-delivery-4: PATCH /api/admin/deliveries/:origin/:id/postpone
  @Patch(':origin/:id/postpone')
  @HttpCode(HttpStatus.OK)
  async postpone(
    @Param('origin') origin: DeliveryOrigin,
    @Param('id') id: string,
    @Body() dto: PostponeDto,
  ) {
    await this.deliveryUseCase.postpone(origin, id, new Date(dto.newDate));
    return { message: 'Delivery date updated' };
  }
}
