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
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import {
  CreateComplaintUseCase,
  ListComplaintsUseCase,
  ReviewComplaintUseCase,
  ApproveRefundUseCase,
  ResolveComplaintUseCase,
} from '../use-cases/complaint.use-cases';
import { ComplaintReferenceType, ComplaintStatus } from '../domain/complaint.entity';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateComplaintDto {
  @IsIn(['order', 'quote', 'unknown'])
  @IsNotEmpty()
  referenceType!: ComplaintReferenceType;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  customerEmail!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

class ResolveComplaintDto {
  @IsString()
  @IsNotEmpty()
  resolutionNotes!: string;

  @IsIn(['resolved_other_way', 'rejected'])
  @IsNotEmpty()
  status!: 'resolved_other_way' | 'rejected';
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('api/complaints')
export class ComplaintsController {
  constructor(
    private readonly createComplaint: CreateComplaintUseCase,
    private readonly listComplaints: ListComplaintsUseCase,
    private readonly reviewComplaint: ReviewComplaintUseCase,
    private readonly approveRefund: ApproveRefundUseCase,
    private readonly resolveComplaint: ResolveComplaintUseCase,
  ) {}

  // TASK-complaint-2: POST /api/complaints (public)
  @Post()
  async create(@Body() dto: CreateComplaintDto) {
    const complaint = await this.createComplaint.execute({
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      reason: dto.reason,
    });
    return {
      status: 'received',
      message: 'Your complaint has been registered. Check your email for a receipt.',
      complaintId: complaint.id,
    };
  }

  // TASK-complaint-5: GET /api/complaints (admin, JWT)
  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('status') status?: ComplaintStatus,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listComplaints.execute({
      status,
      q,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  // TASK-complaint-review: PATCH /api/complaints/:id/review (admin, JWT)
  @Patch(':id/review')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async review(@Param('id') id: string) {
    const complaint = await this.reviewComplaint.execute(id);
    return { status: complaint.status, complaintId: complaint.id };
  }

  // TASK-complaint-6: PATCH /api/complaints/:id/approve-refund (admin, JWT)
  @Patch(':id/approve-refund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refund(@Param('id') id: string) {
    const complaint = await this.approveRefund.execute(id);
    return {
      status: complaint.status,
      complaintId: complaint.id,
      refundRequestId: complaint.refundRequestId,
    };
  }

  // TASK-complaint-7: PATCH /api/complaints/:id/resolve (admin, JWT)
  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resolve(@Param('id') id: string, @Body() dto: ResolveComplaintDto) {
    const complaint = await this.resolveComplaint.execute(id, dto.resolutionNotes, dto.status);
    return { status: complaint.status, complaintId: complaint.id };
  }
}
