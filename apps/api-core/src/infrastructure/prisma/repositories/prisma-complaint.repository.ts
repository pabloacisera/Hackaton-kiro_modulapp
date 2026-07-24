import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  Complaint,
  ComplaintStatus,
  ComplaintReferenceType,
} from '../../../modules/complaints/domain/complaint.entity';
import {
  IComplaintRepository,
  ListComplaintsFilter,
  PaginatedComplaints,
} from '../../../modules/complaints/repositories/complaint.repository.port';

@Injectable()
export class PrismaComplaintRepository implements IComplaintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Complaint | null> {
    const row = await this.prisma.complaint.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(filter: ListComplaintsFilter): Promise<PaginatedComplaints> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ComplaintWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.q) {
      where.OR = [
        { customerEmail: { contains: filter.q, mode: 'insensitive' } },
        { customerName: { contains: filter.q, mode: 'insensitive' } },
        { reason: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.complaint.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async save(complaint: Complaint): Promise<Complaint> {
    const props = complaint.toProps();
    const row = await this.prisma.complaint.create({
      data: {
        id: props.id,
        referenceType: props.referenceType,
        referenceId: props.referenceId,
        customerName: props.customerName,
        customerEmail: props.customerEmail,
        customerPhone: props.customerPhone,
        reason: props.reason,
        status: props.status,
        resolutionNotes: props.resolutionNotes,
        refundRequestId: props.refundRequestId,
        createdAt: props.createdAt,
        resolvedAt: props.resolvedAt,
      },
    });
    return this.toDomain(row);
  }

  async update(complaint: Complaint): Promise<Complaint> {
    const props = complaint.toProps();
    const row = await this.prisma.complaint.update({
      where: { id: props.id },
      data: {
        status: props.status,
        resolutionNotes: props.resolutionNotes,
        refundRequestId: props.refundRequestId,
        resolvedAt: props.resolvedAt,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    referenceType: string;
    referenceId: string | null;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    reason: string;
    status: string;
    resolutionNotes: string | null;
    refundRequestId: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }): Complaint {
    return new Complaint({
      id: row.id,
      referenceType: row.referenceType as ComplaintReferenceType,
      referenceId: row.referenceId,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      reason: row.reason,
      status: row.status as ComplaintStatus,
      resolutionNotes: row.resolutionNotes,
      refundRequestId: row.refundRequestId,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    });
  }
}
