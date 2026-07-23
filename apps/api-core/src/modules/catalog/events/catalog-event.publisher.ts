import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface CatalogEvent {
  type: 'prototype.updated' | 'prototype.deactivated';
  payload: {
    id: string;
    priceUsd?: number;
    stockQty?: number;
    active?: boolean;
  };
}

/**
 * TASK-catalog-4: In-process event bus for catalog SSE events.
 * Controllers subscribe to this stream and forward events to SSE clients.
 */
@Injectable()
export class CatalogEventPublisher {
  private readonly subject = new Subject<CatalogEvent>();

  readonly events$ = this.subject.asObservable();

  publishUpdated(id: string, priceUsd: number, stockQty: number): void {
    this.subject.next({
      type: 'prototype.updated',
      payload: { id, priceUsd, stockQty, active: true },
    });
  }

  publishDeactivated(id: string): void {
    this.subject.next({
      type: 'prototype.deactivated',
      payload: { id, active: false },
    });
  }
}
