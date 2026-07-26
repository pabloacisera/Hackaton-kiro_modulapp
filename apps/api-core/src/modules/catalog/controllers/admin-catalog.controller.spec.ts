import {
  AdminCatalogController,
  CreatePrototypeDto,
  UpdatePrototypeDto,
} from './admin-catalog.controller';
import { Prototype } from '../domain/prototype.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminCatalogController', () => {
  let controller: AdminCatalogController;
  let protoRepo: any;
  let storage: any;
  let events: any;
  let cache: any;
  let importExcel: any;
  let confirmImport: any;

  const mockPrototype = new Prototype({
    id: 'proto-test',
    name: 'Test Shelf',
    description: 'A test prototype for unit testing',
    category: 'modular_furniture',
    priceUsd: 100,
    active: true,
    stockQty: 5,
    buildOnDemand: false,
    estimatedDeliveryDays: 7,
    images: [
      {
        id: 'img-existing',
        url: 'https://supabase.co/storage/v1/object/public/bucket/products/old.jpg',
        order: 0,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    protoRepo = {
      findById: jest.fn(),
      findAllAdmin: jest.fn(),
      save: jest.fn().mockImplementation((p) => p),
    };
    storage = {
      upload: jest.fn().mockResolvedValue({
        publicUrl: 'https://supabase.co/storage/v1/object/public/bucket/products/123-test.jpg',
        path: 'products/123-test.jpg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    events = { publishUpdated: jest.fn(), publishDeactivated: jest.fn() };
    cache = { invalidateListings: jest.fn() };
    importExcel = { execute: jest.fn() };
    confirmImport = { execute: jest.fn() };

    controller = new AdminCatalogController(
      protoRepo,
      storage,
      events,
      cache,
      importExcel,
      confirmImport,
    );
  });

  // ── CREATE ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a prototype and returns DTO', async () => {
      protoRepo.save.mockImplementation((p: Prototype) => p);

      const dto: CreatePrototypeDto = {
        name: 'New Bookshelf',
        description: 'A beautiful modular bookshelf for any room',
        category: 'modular_furniture',
        priceUsd: 149.99,
        stockQty: 10,
        buildOnDemand: false,
        estimatedDeliveryDays: 7,
      };

      const result = await controller.create(dto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('New Bookshelf');
      expect(result.priceUsd).toBe(149.99);
      expect(result.active).toBe(true);
      expect(result.images).toEqual([]);
      expect(protoRepo.save).toHaveBeenCalled();
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishUpdated).toHaveBeenCalledWith(expect.any(String), 149.99, 10);
    });
  });

  // ── LIST ALL (ADMIN) ───────────────────────────────────────────────────────

  describe('listAll', () => {
    it('returns paginated list including inactive prototypes', async () => {
      const inactiveProto = new Prototype({
        ...mockPrototype.toProps(),
        id: 'proto-inactive',
        active: false,
      });

      protoRepo.findAllAdmin.mockResolvedValue({
        items: [mockPrototype, inactiveProto],
        total: 2,
        page: 1,
        pageSize: 20,
      });

      const result = await controller.listAll(undefined, undefined, '1', '20');

      expect(result.items).toHaveLength(2);
      expect(result.items[0].active).toBe(true);
      expect(result.items[1].active).toBe(false);
      expect(result.total).toBe(2);
      expect(protoRepo.findAllAdmin).toHaveBeenCalledWith({
        q: undefined,
        category: undefined,
        page: 1,
        pageSize: 20,
      });
    });
  });

  // ── GET BY ID ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns prototype DTO for valid ID', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);

      const result = await controller.getById('proto-test');

      expect(result.id).toBe('proto-test');
      expect(result.name).toBe('Test Shelf');
    });

    it('throws NotFoundException for invalid ID', async () => {
      protoRepo.findById.mockResolvedValue(null);

      await expect(controller.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── UPDATE ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates partial fields and returns updated DTO', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);
      protoRepo.save.mockImplementation((p: Prototype) => p);

      const dto: UpdatePrototypeDto = { priceUsd: 200, stockQty: 15 };

      const result = await controller.update('proto-test', dto);

      expect(result.priceUsd).toBe(200);
      expect(result.stockQty).toBe(15);
      expect(result.name).toBe('Test Shelf'); // unchanged
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishUpdated).toHaveBeenCalledWith('proto-test', 200, 15);
    });

    it('throws NotFoundException if prototype not found', async () => {
      protoRepo.findById.mockResolvedValue(null);

      await expect(controller.update('nonexistent', { priceUsd: 50 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── DEACTIVATE ─────────────────────────────────────────────────────────────

  describe('deactivate', () => {
    it('sets active=false and publishes deactivated event', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);
      protoRepo.save.mockImplementation((p: Prototype) => p);

      const result = await controller.deactivate('proto-test');

      expect(result).toEqual({ id: 'proto-test', active: false });
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishDeactivated).toHaveBeenCalledWith('proto-test');
    });

    it('throws NotFoundException if prototype not found', async () => {
      protoRepo.findById.mockResolvedValue(null);

      await expect(controller.deactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── REACTIVATE ─────────────────────────────────────────────────────────────

  describe('reactivate', () => {
    it('sets active=true and publishes updated event', async () => {
      const inactiveProto = new Prototype({
        ...mockPrototype.toProps(),
        active: false,
      });
      protoRepo.findById.mockResolvedValue(inactiveProto);
      protoRepo.save.mockImplementation((p: Prototype) => p);

      const result = await controller.reactivate('proto-test');

      expect(result.active).toBe(true);
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishUpdated).toHaveBeenCalledWith('proto-test', 100, 5);
    });

    it('throws NotFoundException if prototype not found', async () => {
      protoRepo.findById.mockResolvedValue(null);

      await expect(controller.reactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── IMAGE UPLOAD (existing) ────────────────────────────────────────────────

  describe('uploadImage', () => {
    it('uploads image and returns new image data', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);

      const file = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'photo.jpg',
      } as Express.Multer.File;

      const result = await controller.uploadImage('proto-test', file);

      expect(result).toHaveProperty('id');
      expect(result.url).toBe(
        'https://supabase.co/storage/v1/object/public/bucket/products/123-test.jpg',
      );
      expect(result.order).toBe(1);
      expect(storage.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'products',
          contentType: 'image/jpeg',
        }),
      );
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishUpdated).toHaveBeenCalledWith('proto-test', 100, 5);
    });

    it('throws BadRequestException if no file', async () => {
      await expect(controller.uploadImage('proto-test', undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for invalid mime type', async () => {
      const file = {
        buffer: Buffer.from('data'),
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'doc.pdf',
      } as Express.Multer.File;

      await expect(controller.uploadImage('proto-test', file)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if file too large', async () => {
      const file = {
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
        size: 10 * 1024 * 1024,
        originalname: 'huge.png',
      } as Express.Multer.File;

      await expect(controller.uploadImage('proto-test', file)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if prototype not found', async () => {
      protoRepo.findById.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
        size: 1024,
        originalname: 'img.png',
      } as Express.Multer.File;

      await expect(controller.uploadImage('nonexistent', file)).rejects.toThrow(NotFoundException);
    });
  });

  // ── IMAGE DELETE (existing) ────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('deletes image from storage and prototype', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);

      const result = await controller.deleteImage('proto-test', 'img-existing');

      expect(result).toEqual({ deleted: true });
      expect(storage.delete).toHaveBeenCalledWith('products/old.jpg');
      expect(protoRepo.save).toHaveBeenCalled();
      expect(cache.invalidateListings).toHaveBeenCalled();
      expect(events.publishUpdated).toHaveBeenCalledWith('proto-test', 100, 5);
    });

    it('throws NotFoundException if prototype not found', async () => {
      protoRepo.findById.mockResolvedValue(null);
      await expect(controller.deleteImage('nonexistent', 'img-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if image not found', async () => {
      protoRepo.findById.mockResolvedValue(mockPrototype);
      await expect(controller.deleteImage('proto-test', 'nonexistent-img')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
