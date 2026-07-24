import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Prototype } from '../modules/catalog/domain/prototype.entity';
import {
  IPrototypeRepository,
  PROTOTYPE_REPOSITORY,
} from '../modules/catalog/repositories/prototype.repository.port';
import { AdminUser } from '../domain/auth/entities/admin-user.entity';
import {
  IAdminUserRepository,
  ADMIN_USER_REPOSITORY,
} from '../domain/auth/repositories/admin-user.repository.port';
import { Supply } from '../modules/supplies/domain/supply.entity';
import {
  ISupplyRepository,
  SUPPLY_REPOSITORY,
} from '../modules/supplies/repositories/supply.repository.port';
import { Order } from '../modules/orders/domain/order.entity';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../modules/orders/repositories/order.repository.port';
import { Quote } from '../modules/quotes/domain/quote.entity';
import {
  IQuoteRepository,
  QUOTE_REPOSITORY,
} from '../modules/quotes/repositories/quote.repository.port';
import { Complaint } from '../modules/complaints/domain/complaint.entity';
import {
  IComplaintRepository,
  COMPLAINT_REPOSITORY,
} from '../modules/complaints/repositories/complaint.repository.port';

/**
 * Seeds the database with sample data for development/testing.
 * Only runs when NODE_ENV !== 'production'.
 * Idempotent: checks if data exists before inserting.
 *
 * Default admin credentials (override via env vars):
 *   email:    ADMIN_SEED_EMAIL    (default: admin@modulapp.com)
 *   password: ADMIN_SEED_PASSWORD (default: Password123456)
 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
    @Inject(SUPPLY_REPOSITORY)
    private readonly supplyRepo: ISupplyRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(QUOTE_REPOSITORY)
    private readonly quoteRepo: IQuoteRepository,
    @Inject(COMPLAINT_REPOSITORY)
    private readonly complaintRepo: IComplaintRepository,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;

    await this.seedAdmin();
    await this.seedPrototypes();
    await this.seedSupplies();
    await this.seedOrders();
    await this.seedQuotes();
    await this.seedComplaints();
  }

  // ── Admin ───────────────────────────────────────────────────────────────

  private async seedAdmin() {
    const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@modulapp.com';
    const password = process.env.ADMIN_SEED_PASSWORD ?? 'Password123456';

    const existing = await this.adminUserRepo.findByEmail(email);
    if (existing) return;

    const admin = await AdminUser.create(email, password);
    await this.adminUserRepo.save(admin);
    this.logger.log(`Seeded default admin: ${email}`);
  }

  // ── Prototypes ──────────────────────────────────────────────────────────

  private async seedPrototypes() {
    const existing = await this.protoRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return;

    const prototypes = [
      new Prototype({
        id: 'proto-001',
        name: 'Modular Bookshelf — MDF 18mm',
        description: 'Customizable bookshelf with 6 modular cubes. Fits any space.',
        category: 'modular_furniture',
        priceUsd: 149.99,
        active: true,
        stockQty: 12,
        buildOnDemand: false,
        estimatedDeliveryDays: 7,
        images: [{ id: 'img-1', url: '/images/bookshelf-1.jpg', order: 0 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Prototype({
        id: 'proto-002',
        name: 'TV Stand — Industrial Style',
        description: 'Low-profile TV stand with metal legs and MDF shelves. 180cm wide.',
        category: 'modular_furniture',
        priceUsd: 219.5,
        active: true,
        stockQty: 5,
        buildOnDemand: false,
        estimatedDeliveryDays: 10,
        images: [{ id: 'img-2', url: '/images/tv-stand-1.jpg', order: 0 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Prototype({
        id: 'proto-003',
        name: 'Wedding Arch — Classic White',
        description: 'Elegant 3m wooden arch for ceremonies. Includes fabric draping.',
        category: 'arches',
        priceUsd: 299.0,
        active: true,
        stockQty: 3,
        buildOnDemand: true,
        estimatedDeliveryDays: 14,
        images: [{ id: 'img-3', url: '/images/wedding-arch-1.jpg', order: 0 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Prototype({
        id: 'proto-004',
        name: 'Balloon Arch Frame — Round',
        description: 'Reusable metal frame for balloon arches. 2.5m diameter.',
        category: 'arches',
        priceUsd: 89.99,
        active: true,
        stockQty: 8,
        buildOnDemand: false,
        estimatedDeliveryDays: 5,
        images: [{ id: 'img-4', url: '/images/balloon-arch-1.jpg', order: 0 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      new Prototype({
        id: 'proto-005',
        name: 'Floating Shelf Set (3 pcs)',
        description: 'Set of 3 floating shelves in natural wood finish. Various sizes.',
        category: 'modular_furniture',
        priceUsd: 59.99,
        active: true,
        stockQty: 20,
        buildOnDemand: false,
        estimatedDeliveryDays: 3,
        images: [{ id: 'img-5', url: '/images/floating-shelves-1.jpg', order: 0 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];

    for (const proto of prototypes) {
      await this.protoRepo.save(proto);
    }
    this.logger.log(`Seeded ${prototypes.length} prototypes`);
  }

  // ── Supplies ────────────────────────────────────────────────────────────

  private async seedSupplies() {
    const existing = await this.supplyRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return;

    const now = new Date();
    const supplies = [
      new Supply({
        id: 'sup-001',
        sku: 'MDF-18-120x240',
        name: 'MDF Board 18mm 120x240cm',
        unit: 'unit',
        currentQty: 25,
        minStock: 10,
        unitCostUsd: 32.5,
        supplier: 'MaderasCo',
        createdAt: now,
        updatedAt: now,
      }),
      new Supply({
        id: 'sup-002',
        sku: 'PAINT-WHT-1L',
        name: 'White Lacquer Paint 1L',
        unit: 'unit',
        currentQty: 8,
        minStock: 5,
        unitCostUsd: 12.0,
        supplier: 'PinturasPro',
        createdAt: now,
        updatedAt: now,
      }),
      new Supply({
        id: 'sup-003',
        sku: 'SCREW-4x30-100',
        name: 'Wood Screws 4x30mm (100 pack)',
        unit: 'pack',
        currentQty: 3,
        minStock: 10,
        unitCostUsd: 4.5,
        supplier: 'FixAll',
        createdAt: now,
        updatedAt: now,
      }), // BELOW MINIMUM
      new Supply({
        id: 'sup-004',
        sku: 'HINGE-35MM',
        name: 'Cabinet Hinge 35mm',
        unit: 'unit',
        currentQty: 2,
        minStock: 20,
        unitCostUsd: 1.8,
        supplier: 'FixAll',
        createdAt: now,
        updatedAt: now,
      }), // BELOW MINIMUM
      new Supply({
        id: 'sup-005',
        sku: 'FABRIC-WHT-M2',
        name: 'White Draping Fabric',
        unit: 'm2',
        currentQty: 45,
        minStock: 15,
        unitCostUsd: 8.0,
        supplier: 'TelasFinas',
        createdAt: now,
        updatedAt: now,
      }),
      new Supply({
        id: 'sup-006',
        sku: 'EDGE-PVC-2MM',
        name: 'PVC Edge Band 2mm',
        unit: 'm',
        currentQty: 120,
        minStock: 50,
        unitCostUsd: 0.9,
        supplier: 'MaderasCo',
        createdAt: now,
        updatedAt: now,
      }),
    ];

    for (const supply of supplies) {
      await this.supplyRepo.save(supply);
    }
    this.logger.log(`Seeded ${supplies.length} supplies (2 below minimum)`);
  }

  // ── Orders (various states) ─────────────────────────────────────────────

  private async seedOrders() {
    const existing = await this.orderRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return;

    const now = new Date();

    // Order 1: accepted (complete flow)
    const order1 = Order.create(
      'proto-001',
      149.99,
      'cliente1@email.com',
      'María García',
      'idem-seed-001',
    );
    const o1paid = order1.initiatePayment('pay-ref-001').confirmPayment();
    const o1accepted = o1paid.accept(new Date(now.getTime() + 7 * 86400000));
    await this.orderRepo.save(o1accepted);

    // Order 2: paid pending acceptance
    const order2 = Order.create(
      'proto-002',
      219.5,
      'cliente2@email.com',
      'Juan Pérez',
      'idem-seed-002',
    );
    const o2paid = order2.initiatePayment('pay-ref-002').confirmPayment();
    await this.orderRepo.save(o2paid);

    // Order 3: rejected (refund triggered)
    const order3 = Order.create(
      'proto-004',
      89.99,
      'cliente3@email.com',
      'Ana López',
      'idem-seed-003',
    );
    const o3rejected = order3
      .initiatePayment('pay-ref-003')
      .confirmPayment()
      .reject('Out of stock, custom color not available');
    await this.orderRepo.save(o3rejected);

    // Order 4: payment failed
    const order4 = Order.create('proto-005', 59.99, 'cliente4@email.com', null, 'idem-seed-004');
    const o4failed = order4.initiatePayment('pay-ref-004').failPayment();
    await this.orderRepo.save(o4failed);

    this.logger.log('Seeded 4 orders (accepted, paid_pending, rejected, failed)');
  }

  // ── Quotes (various states) ─────────────────────────────────────────────

  private async seedQuotes() {
    const existing = await this.quoteRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return;

    const now = new Date();
    const inFuture = (days: number) => new Date(now.getTime() + days * 86400000);

    // Quote 1: pending (just submitted)
    const q1 = Quote.create(
      'Laura Fernández',
      'laura@example.com',
      '+54 9 11 5555-1234',
      'Custom hexagonal shelf unit, 2m tall, 6 hexagons, white finish',
      inFuture(30),
    );
    await this.quoteRepo.save(q1);

    // Quote 2: quoted (waiting customer response)
    const q2 = Quote.create(
      'Carlos Méndez',
      'carlos@example.com',
      '+54 9 351 4444-5678',
      'Balloon arch frame 3m + flower arrangement holders, gold finish',
      inFuture(14),
    );
    const q2quoted = q2.presentQuote(450.0, 10, inFuture(10), 'token-hash-seed-q2');
    await this.quoteRepo.save(q2quoted);

    // Quote 3: paid (complete flow)
    const q3 = Quote.create(
      'Valentina Ruiz',
      'valentina@example.com',
      '+54 9 261 3333-9876',
      'Wedding arch with attached flower boxes, rustic wood finish',
      inFuture(21),
    );
    const q3paid = q3
      .presentQuote(680.0, 14, inFuture(14), 'token-hash-seed-q3')
      .accept()
      .initiatePayment('pay-ref-q3')
      .confirmPayment();
    await this.quoteRepo.save(q3paid);

    // Quote 4: expired
    const q4 = Quote.create(
      'Roberto Díaz',
      'roberto@example.com',
      '+54 9 11 2222-3344',
      'Kids room modular storage, 5 cubes, pastel colors',
      inFuture(45),
    );
    const q4expired = q4.presentQuote(320.0, 7, inFuture(7), 'token-hash-seed-q4').expire();
    await this.quoteRepo.save(q4expired);

    this.logger.log('Seeded 4 quotes (pending, quoted, paid, expired)');
  }

  // ── Complaints ──────────────────────────────────────────────────────────

  private async seedComplaints() {
    const existing = await this.complaintRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return;

    // Complaint 1: received (new)
    const c1 = Complaint.create(
      'order',
      null,
      'María García',
      'cliente1@email.com',
      '+54 9 11 6666-7777',
      'Received product with scratches on the top surface',
    );
    await this.complaintRepo.save(c1);

    // Complaint 2: under review
    const c2 = Complaint.create(
      'quote',
      null,
      'Carlos Méndez',
      'carlos@example.com',
      '+54 9 351 4444-5678',
      'Color does not match what was agreed in the quote',
    );
    const c2review = c2.markUnderReview();
    await this.complaintRepo.save(c2review);

    // Complaint 3: resolved (other way — no refund)
    const c3 = Complaint.create(
      'order',
      null,
      'Ana López',
      'cliente3@email.com',
      null,
      'Package arrived damaged, product unusable',
    );
    const c3resolved = c3
      .markUnderReview()
      .resolve('Sent replacement product via courier', 'resolved_other_way');
    await this.complaintRepo.save(c3resolved);

    this.logger.log('Seeded 3 complaints (received, under_review, refund_approved)');
  }
}
