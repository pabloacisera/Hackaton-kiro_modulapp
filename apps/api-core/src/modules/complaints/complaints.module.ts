import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { COMPLAINT_REPOSITORY } from './repositories/complaint.repository.port';
import { InMemoryComplaintRepository } from './repositories/in-memory-complaint.repository';
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
  useClass: InMemoryComplaintRepository,
};

@Module({
  imports: [NotificationsModule],
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
