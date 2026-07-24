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

/**
 * Seeds the in-memory catalog with sample prototypes and a default admin
 * user for development/testing. Only runs when NODE_ENV !== 'production'.
 *
 * Default admin credentials (override via env vars):
 *   email:    ADMIN_SEED_EMAIL    (default: admin@modulapp.com.com)
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
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') return;

    await this.seedAdmin();
    await this.seedPrototypes();
  }

  private async seedAdmin() {
    const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@modulapp.com.com';
    const password = process.env.ADMIN_SEED_PASSWORD ?? 'Password123456';

    const existing = await this.adminUserRepo.findByEmail(email);
    if (existing) return;

    const admin = await AdminUser.create(email, password);
    await this.adminUserRepo.save(admin);
    this.logger.log(`Seeded default admin user: ${email}`);
  }

  private async seedPrototypes() {
    const existing = await this.protoRepo.findAll({ page: 1, pageSize: 1 });
    if (existing.total > 0) return; // already seeded

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

    this.logger.log(`Seeded ${prototypes.length} prototypes for development`);
  }
}
