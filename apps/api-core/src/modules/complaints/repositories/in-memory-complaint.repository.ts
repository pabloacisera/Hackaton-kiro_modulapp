import { Complaint } from '../domain/complaint.entity';
import {
  IComplaintRepository,
  ListComplaintsFilter,
  PaginatedComplaints,
} from './complaint.repository.port';

export class InMemoryComplaintRepository implements IComplaintRepository {
  private complaints: Complaint[] = [];

  async findById(id: string): Promise<Complaint | null> {
    return this.complaints.find((c) => c.id === id) ?? null;
  }

  async findAll(filter: ListComplaintsFilter): Promise<PaginatedComplaints> {
    let items = [...this.complaints];

    if (filter.status) {
      items = items.filter((c) => c.status === filter.status);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerEmail.toLowerCase().includes(q) ||
          c.reason.toLowerCase().includes(q) ||
          (c.referenceId?.toLowerCase().includes(q) ?? false),
      );
    }

    const total = items.length;
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    items = items.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  async save(complaint: Complaint): Promise<Complaint> {
    this.complaints.push(complaint);
    return complaint;
  }

  async update(complaint: Complaint): Promise<Complaint> {
    const idx = this.complaints.findIndex((c) => c.id === complaint.id);
    if (idx === -1) throw new Error(`Complaint not found: ${complaint.id}`);
    this.complaints[idx] = complaint;
    return complaint;
  }
}
