import { Complaint, ComplaintStatus } from '../domain/complaint.entity';

export interface ListComplaintsFilter {
  status?: ComplaintStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedComplaints {
  items: Complaint[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IComplaintRepository {
  findById(id: string): Promise<Complaint | null>;
  findAll(filter: ListComplaintsFilter): Promise<PaginatedComplaints>;
  save(complaint: Complaint): Promise<Complaint>;
  update(complaint: Complaint): Promise<Complaint>;
}

export const COMPLAINT_REPOSITORY = Symbol('IComplaintRepository');
