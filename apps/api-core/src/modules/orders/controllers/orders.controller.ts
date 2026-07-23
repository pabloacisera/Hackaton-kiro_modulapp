import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsDateString,
} from 'class-validator';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { AcceptOrderUseCase } from '../use-cases/accept-order.use-case';
import { RejectOrderUseCase } from '../use-cases/reject-order.use-case';
import { ListOrdersUseCase } from '../use-cases/list-orders.use-case';
import { HandlePaymentWebhookUseCase } from '../use-cases/handle-payment-webhook.use-case';
import { OrderStatus } from '../domain/order.entity';
import * as crypto from 'crypto';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  prototypeId!: string;

  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}

class AcceptOrderDto {
  @IsDateString()
  @IsNotEmpty()
  estimatedDeliveryDate!: string; // ISO date string
}

class RejectOrderDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

class PaymentResultWebhookDto {
  @IsUUID()
  @IsNotEmpty()
  reference_id!: string;

  @IsString()
  @IsNotEmpty()
  payment_service_ref!: string;

  @IsIn(['confirmed', 'failed'])
  @IsNotEmpty()
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
      prototypeId: dto.prototypeId,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
    });
  }

  // TASK-directpurchase-5: Webhook from payment-service (internal — HMAC auth)
  @Post('webhooks/payment-result')
  @HttpCode(HttpStatus.OK)
  async paymentWebhook(
    @Body() dto: PaymentResultWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    this.verifyWebhookSignature(dto, signature);
    await this.webhookHandler.execute({
      referenceId: dto.reference_id,
      paymentServiceRef: dto.payment_service_ref,
      status: dto.status,
    });
    return { received: true };
  }

  /**
   * Verifies HMAC-SHA256 signature from payment-service.
   * Shared secret via WEBHOOK_SHARED_SECRET env var.
   */
  private verifyWebhookSignature(body: unknown, signature?: string): void {
    const secret = process.env.WEBHOOK_SHARED_SECRET;
    if (!secret) {
      // In development without secret configured, log warning but allow
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Webhook signature verification not configured');
      }
      return;
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    const payload = JSON.stringify(body);
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
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
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }
}
