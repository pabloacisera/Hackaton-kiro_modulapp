import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { QUOTE_REPOSITORY } from './repositories/quote.repository.port';
import { PrismaQuoteRepository } from '../../infrastructure/prisma/repositories/prisma-quote.repository';
import { QuotesController } from './controllers/quotes.controller';
import { CreateQuoteUseCase } from './use-cases/create-quote.use-case';
import { PresentQuoteUseCase } from './use-cases/present-quote.use-case';
import { AcceptQuoteUseCase } from './use-cases/accept-quote.use-case';
import { RejectQuoteUseCase } from './use-cases/reject-quote.use-case';
import { ListQuotesUseCase } from './use-cases/list-quotes.use-case';
import { ArchiveQuoteUseCase } from './use-cases/archive-quote.use-case';
import { QuotePaymentWebhookUseCase } from './use-cases/quote-payment-webhook.use-case';
import { QuoteEmailService } from './services/quote-email.service';
import { QuoteTokenService } from './services/quote-token.service';
import { QuotePdfGenerator } from './services/quote-pdf-generator';
import { QuoteExpirationJob } from './jobs/quote-expiration.job';

const quoteRepoProvider = {
  provide: QUOTE_REPOSITORY,
  useClass: PrismaQuoteRepository,
};

@Module({
  imports: [NotificationsModule, forwardRef(() => OrdersModule), AuthModule],
  controllers: [QuotesController],
  providers: [
    quoteRepoProvider,
    CreateQuoteUseCase,
    PresentQuoteUseCase,
    AcceptQuoteUseCase,
    RejectQuoteUseCase,
    ListQuotesUseCase,
    ArchiveQuoteUseCase,
    QuotePaymentWebhookUseCase,
    QuoteEmailService,
    QuoteTokenService,
    QuotePdfGenerator,
    QuoteExpirationJob,
  ],
  exports: [QUOTE_REPOSITORY, QuoteExpirationJob],
})
export class QuotesModule {}
