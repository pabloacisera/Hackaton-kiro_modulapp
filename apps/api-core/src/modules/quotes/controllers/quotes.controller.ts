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
  BadRequestException,
} from '@nestjs/common';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { CreateQuoteUseCase } from '../use-cases/create-quote.use-case';
import { PresentQuoteUseCase } from '../use-cases/present-quote.use-case';
import { AcceptQuoteUseCase } from '../use-cases/accept-quote.use-case';
import { RejectQuoteUseCase } from '../use-cases/reject-quote.use-case';
import { ListQuotesUseCase } from '../use-cases/list-quotes.use-case';
import { ArchiveQuoteUseCase } from '../use-cases/archive-quote.use-case';
import { QuotePaymentWebhookUseCase } from '../use-cases/quote-payment-webhook.use-case';
import { QuoteStatus } from '../domain/quote.entity';
import * as crypto from 'crypto';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateQuoteDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  neededByDate?: string;
}

class PresentQuoteDto {
  @IsNumber()
  @Min(0.01)
  priceUsd!: number;

  @IsNumber()
  @Min(1)
  leadTimeDays!: number;

  @IsDateString()
  @IsNotEmpty()
  estimatedDeliveryDate!: string;
}

class QuotePaymentWebhookDto {
  @IsString()
  @IsNotEmpty()
  payment_service_ref!: string;

  @IsIn(['confirmed', 'failed'])
  @IsNotEmpty()
  status!: 'confirmed' | 'failed';
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('api/quotes')
export class QuotesController {
  constructor(
    private readonly createQuote: CreateQuoteUseCase,
    private readonly presentQuote: PresentQuoteUseCase,
    private readonly acceptQuote: AcceptQuoteUseCase,
    private readonly rejectQuote: RejectQuoteUseCase,
    private readonly listQuotes: ListQuotesUseCase,
    private readonly archiveQuote: ArchiveQuoteUseCase,
    private readonly paymentWebhook: QuotePaymentWebhookUseCase,
  ) {}

  // TASK-quoteB-3: POST /api/quotes (public — customer submits request)
  @Post()
  async create(@Body() dto: CreateQuoteDto) {
    const result = await this.createQuote.execute({
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      description: dto.description,
      neededByDate: dto.neededByDate,
    });

    if (result.discarded) {
      return {
        status: 'discarded',
        message:
          'Your request is missing required information (name, email, or phone). Our team has been notified.',
        quoteId: result.quote.id,
      };
    }

    return {
      status: 'pending',
      message: 'Your request has been received. Check your email for confirmation.',
      quoteId: result.quote.id,
    };
  }

  // TASK-quoteB-6: PATCH /api/quotes/:id/present (admin, JWT)
  @Patch(':id/present')
  @UseGuards(JwtAuthGuard)
  async present(@Param('id') id: string, @Body() dto: PresentQuoteDto) {
    const quote = await this.presentQuote.execute({
      quoteId: id,
      priceUsd: dto.priceUsd,
      leadTimeDays: dto.leadTimeDays,
      estimatedDeliveryDate: dto.estimatedDeliveryDate,
    });
    return { status: quote.status, quoteId: quote.id };
  }

  // TASK-quoteB-9: GET /api/quotes/:id/accept (public — customer magic link)
  @Get(':id/accept')
  async accept(@Param('id') id: string, @Query('token') token?: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const result = await this.acceptQuote.execute(id, token);

    if (result.expired) {
      return {
        status: 'expired',
        message: 'This quote has expired. Please request a new one.',
      };
    }

    if (result.alreadyProcessed) {
      return {
        status: result.quote.status,
        message: 'This action has already been processed.',
      };
    }

    return {
      status: 'accepted',
      message: 'Quote accepted! Complete your payment within 24 hours.',
      paymentUrl: result.paymentUrl,
      quoteId: result.quote.id,
    };
  }

  // TASK-quoteB-10: GET /api/quotes/:id/reject (public — customer magic link)
  @Get(':id/reject')
  async reject(@Param('id') id: string, @Query('token') token?: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const result = await this.rejectQuote.execute(id, token);

    if (result.expired) {
      return {
        status: 'expired',
        message: 'This quote has expired.',
      };
    }

    if (result.alreadyProcessed) {
      return {
        status: result.quote.status,
        message: 'This action has already been processed.',
      };
    }

    return {
      status: 'rejected',
      message: 'Quote rejected. Thank you for letting us know.',
      quoteId: result.quote.id,
    };
  }

  // TASK-quoteB-webhook: POST /api/quotes/webhooks/payment-result (internal)
  @Post('webhooks/payment-result')
  @HttpCode(HttpStatus.OK)
  async paymentResult(
    @Body() dto: QuotePaymentWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    this.verifyWebhookSignature(dto, signature);
    await this.paymentWebhook.execute(dto.payment_service_ref, dto.status === 'confirmed');
    return { received: true };
  }

  private verifyWebhookSignature(body: unknown, signature?: string): void {
    const secret = process.env.WEBHOOK_SHARED_SECRET;
    if (!secret) {
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

  // TASK-quoteB-16: GET /api/quotes (admin, JWT — listing with filters)
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('status') status?: QuoteStatus,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listQuotes.execute({
      status,
      q,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  // TASK-quoteB-15: PATCH /api/quotes/:id/archive (admin, JWT)
  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(@Param('id') id: string) {
    await this.archiveQuote.execute(id);
  }
}
