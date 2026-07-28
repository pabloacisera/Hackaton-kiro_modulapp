import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Quote, QuoteStatus } from '../../../modules/quotes/domain/quote.entity';
import {
  IQuoteRepository,
  ListQuotesFilter,
  PaginatedQuotes,
} from '../../../modules/quotes/repositories/quote.repository.port';

@Injectable()
export class PrismaQuoteRepository implements IQuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Quote | null> {
    const row = await this.prisma.quote.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByPaymentServiceRef(ref: string): Promise<Quote | null> {
    const row = await this.prisma.quote.findFirst({
      where: { paymentServiceRef: ref },
    });
    return row ? this.toDomain(row) : null;
  }

  async findExpiredQuotes(now: Date): Promise<Quote[]> {
    const rows = await this.prisma.quote.findMany({
      where: {
        status: 'quoted',
        quoteResponseDeadline: { lt: now },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaymentExpiredQuotes(now: Date): Promise<Quote[]> {
    const rows = await this.prisma.quote.findMany({
      where: {
        status: 'payment_initiated',
        paymentDeadline: { lt: now },
      },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(filter: ListQuotesFilter): Promise<PaginatedQuotes> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.QuoteWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    } else {
      // Default: exclude archived and discarded from listing
      where.status = { notIn: ['archived', 'discarded_incomplete_data'] };
    }
    if (filter.q) {
      where.OR = [
        { id: { contains: filter.q, mode: 'insensitive' } },
        { customerEmail: { contains: filter.q, mode: 'insensitive' } },
        { customerName: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      items: rows.map((r) => this.toDomain(r)),
      total,
      page,
      pageSize,
    };
  }

  async save(quote: Quote): Promise<Quote> {
    const props = quote.toProps();
    const row = await this.prisma.quote.create({
      data: {
        id: props.id,
        customerName: props.customerName,
        customerEmail: props.customerEmail,
        customerPhone: props.customerPhone,
        description: props.description,
        neededByDate: props.neededByDate,
        status: props.status,
        quotedPriceUsd: props.quotedPriceUsd,
        quotedLeadTimeDays: props.quotedLeadTimeDays,
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        quoteSentAt: props.quoteSentAt,
        quoteResponseDeadline: props.quoteResponseDeadline,
        paymentDeadline: props.paymentDeadline,
        acceptedAt: props.acceptedAt,
        rejectedAt: props.rejectedAt,
        paidAt: props.paidAt,
        rejectionReason: props.rejectionReason,
        actionTokenHash: props.actionTokenHash,
        actionTokenUsed: props.actionTokenUsed,
        paymentServiceRef: props.paymentServiceRef,
        createdAt: props.createdAt,
        updatedAt: props.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async update(quote: Quote): Promise<Quote> {
    const props = quote.toProps();
    const row = await this.prisma.quote.update({
      where: { id: props.id },
      data: {
        status: props.status,
        quotedPriceUsd: props.quotedPriceUsd,
        quotedLeadTimeDays: props.quotedLeadTimeDays,
        estimatedDeliveryDate: props.estimatedDeliveryDate,
        quoteSentAt: props.quoteSentAt,
        quoteResponseDeadline: props.quoteResponseDeadline,
        paymentDeadline: props.paymentDeadline,
        acceptedAt: props.acceptedAt,
        rejectedAt: props.rejectedAt,
        paidAt: props.paidAt,
        rejectionReason: props.rejectionReason,
        actionTokenHash: props.actionTokenHash,
        actionTokenUsed: props.actionTokenUsed,
        paymentServiceRef: props.paymentServiceRef,
        updatedAt: props.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async updatePdfUrl(quoteId: string, pdfUrl: string): Promise<void> {
    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { quotePdfUrl: pdfUrl },
    });
  }

  private toDomain(row: {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    neededByDate: Date;
    status: string;
    quotedPriceUsd: Prisma.Decimal | null;
    quotedLeadTimeDays: number | null;
    estimatedDeliveryDate: Date | null;
    quoteSentAt: Date | null;
    quoteResponseDeadline: Date | null;
    paymentDeadline: Date | null;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    paidAt: Date | null;
    rejectionReason: string | null;
    actionTokenHash: string | null;
    actionTokenUsed: boolean;
    paymentServiceRef: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Quote {
    return new Quote({
      id: row.id,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      description: row.description,
      neededByDate: row.neededByDate,
      status: row.status as QuoteStatus,
      quotedPriceUsd: row.quotedPriceUsd?.toNumber() ?? null,
      quotedLeadTimeDays: row.quotedLeadTimeDays,
      estimatedDeliveryDate: row.estimatedDeliveryDate,
      quoteSentAt: row.quoteSentAt,
      quoteResponseDeadline: row.quoteResponseDeadline,
      paymentDeadline: row.paymentDeadline,
      acceptedAt: row.acceptedAt,
      rejectedAt: row.rejectedAt,
      paidAt: row.paidAt,
      rejectionReason: row.rejectionReason,
      actionTokenHash: row.actionTokenHash,
      actionTokenUsed: row.actionTokenUsed,
      paymentServiceRef: row.paymentServiceRef,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
