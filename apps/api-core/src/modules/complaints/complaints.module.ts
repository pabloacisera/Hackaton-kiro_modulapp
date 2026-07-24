import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { COMPLAINT_REPOSITORY } from './repositories/complaint.repository.port';
import { PrismaComplaintRepository } from '../../infrastructure/prisma/repositories/prisma-complaint.repository';
import { ComplaintsController } from './controllers/complaints.controller';
import {
  CreateComplaintUseCase,
  ListComplaintsUseCase,
  ReviewComplaintUseCase,
  ApproveRefundUseCase,
  ResolveComplaintUseCase,
} from './use-cases/complaint.use-cases';
import { ComplaintEmailService } from './services/complaint-email.service';

const complaintRepoProvider = {
  provide: COMPLAINT_REPOSITORY,
  useClass: PrismaComplaintRepository,
};

@Module({
  imports: [
    HttpModule.register({ timeout: 10_000 }),
    NotificationsModule,
    forwardRef(() => OrdersModule),
    AuthModule,
  ],
  controllers: [ComplaintsController],
  providers: [
    complaintRepoProvider,
    CreateComplaintUseCase,
    ListComplaintsUseCase,
    ReviewComplaintUseCase,
    ApproveRefundUseCase,
    ResolveComplaintUseCase,
    ComplaintEmailService,
  ],
  exports: [COMPLAINT_REPOSITORY],
})
export class ComplaintsModule {}
