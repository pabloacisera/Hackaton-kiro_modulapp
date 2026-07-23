import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { AcceptOrderUseCase } from '../use-cases/accept-order.use-case';
import { RejectOrderUseCase } from '../use-cases/reject-order.use-case';
import { ListOrdersUseCase } from '../use-cases/list-orders.use-case';
import { HandlePaymentWebhookUseCase } from '../use-cases/handle-payment-webhook.use-case';
import { OrderStatus } from '../domain/order.entity';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateOrderDto {
  prototypeId!: string;
  customerEmail!: string;
  customerName?: string;
}

class AcceptOrderDto {
  estimatedDeliveryDate!: string; // ISO date string
}

class RejectOrderDto {
  reason!: string;
}

class PaymentResultWebhookDto {
  reference_id!: string;
  payment_service_ref!: string;
  status!: 'confirmed' | 'failed';
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly acceptOrder: AcceptOrderUseCase,
    private readonly rejectOrder: RejectOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly webhookHandler: HandlePaymentWebhookUseCase,
  ) {}

  // TASK-directpurchase-3: POST /orders (public — no JWT, customer-facing)
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.createOrder.execute({
      prototypeId:  dto.prototypeId,
      customerEmail: dto.customerEmail,
      customerName:  dto.customerName,
    });
  }

  // TASK-directpurchase-5: Webhook from payment-service (internal — no JWT)
  @Post('webhooks/payment-result')
  @HttpCode(HttpStatus.OK)
  async paymentWebhook(@Body() dto: PaymentResultWebhookDto) {
    await this.webhookHandler.execute({
      referenceId:       dto.reference_id,
      paymentServiceRef: dto.payment_service_ref,
      status:            dto.status,
    });
    return { received: true };
  }

  // TASK-directpurchase-8: PATCH /orders/:id/accept (admin, JWT)
  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async accept(@Param('id') id: string, @Body() dto: AcceptOrderDto) {
    await this.acceptOrder.execute(id, new Date(dto.estimatedDeliveryDate));
  }

  // TASK-directpurchase-9: PATCH /orders/:id/reject (admin, JWT)
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reject(@Param('id') id: string, @Body() dto: RejectOrderDto) {
    await this.rejectOrder.execute(id, dto.reason);
  }

  // TASK-directpurchase-11: GET /orders (admin, JWT)
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('status') status?: OrderStatus,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listOrders.execute({
      status,
      q,
      page:     page     ? parseInt(page, 10)     : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }
}
