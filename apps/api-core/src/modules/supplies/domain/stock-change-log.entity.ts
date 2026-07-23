/**
 * TASK-stock-1: SupplyStockChangeLog — records every quantity change.
 */

export type StockChangeSource = 'manual' | 'excel_import' | 'order_consumption';

export interface StockChangeLogProps {
  id: string;
  supplyId: string;
  previousQty: number;
  newQty: number;
  source: StockChangeSource;
  actor: string;
  createdAt: Date;
}

export class SupplyStockChangeLog {
  readonly id: string;
  readonly supplyId: string;
  readonly previousQty: number;
  readonly newQty: number;
  readonly source: StockChangeSource;
  readonly actor: string;
  readonly createdAt: Date;

  constructor(props: StockChangeLogProps) {
    Object.assign(this, props);
  }

  static create(
    supplyId: string,
    previousQty: number,
    newQty: number,
    source: StockChangeSource,
    actor: string,
  ): SupplyStockChangeLog {
    return new SupplyStockChangeLog({
      id: crypto.randomUUID(),
      supplyId,
      previousQty,
      newQty,
      source,
      actor,
      createdAt: new Date(),
    });
  }
}
