import { AdminCatalogController } from './admin-catalog.controller';
import { Prototype } from '../domain/prototype.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminCatalogController', () => {
  let controller: AdminCatalogController;
  let protoRepo: any;
  let storage: any;
  let events: any;
  let cache: any;

  const mockPrototype = new Prototype({
    id: 'proto-test',
    name: 'Test Shelf',
    description: 'A test prototype',
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
      save: jest.fn().mockImplementation((p) => p),
    };
    storage = {
      upload: jest.fn().mockResolvedValue({
        publicUrl: 'https://supabase.co/storage/v1/object/public/bucket/products/123-test.jpg',
        path: 'products/123-test.jpg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    events = { publishUpdated: jest.fn() };
    cache = { invalidateListings: jest.fn() };

    // Instantiate directly to bypass guard DI
    controller = new AdminCatalogController(protoRepo, storage, events, cache);
  });

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
        size: 10 * 1024 * 1024, // 10 MB
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
