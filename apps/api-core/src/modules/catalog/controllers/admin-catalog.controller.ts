import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { StorageService } from '../../../infrastructure/storage/storage.service';
import {
  IPrototypeRepository,
  PROTOTYPE_REPOSITORY,
} from '../repositories/prototype.repository.port';
import { Inject } from '@nestjs/common';
import { Prototype } from '../domain/prototype.entity';
import { CatalogEventPublisher } from '../events/catalog-event.publisher';
import { CatalogCacheService } from '../cache/catalog-cache.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('admin/catalog')
@UseGuards(JwtAuthGuard)
export class AdminCatalogController {
  constructor(
    @Inject(PROTOTYPE_REPOSITORY)
    private readonly protoRepo: IPrototypeRepository,
    private readonly storage: StorageService,
    private readonly events: CatalogEventPublisher,
    private readonly cache: CatalogCacheService,
  ) {}

  /**
   * Upload an image for a prototype.
   * POST /api/admin/catalog/prototypes/:id/images
   */
  @Post('prototypes/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Param('id') prototypeId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    }

    const prototype = await this.protoRepo.findById(prototypeId);
    if (!prototype) {
      throw new NotFoundException(`Prototype ${prototypeId} not found`);
    }

    // Upload to Supabase Storage
    const ext = file.originalname.split('.').pop() || 'jpg';
    const result = await this.storage.upload({
      folder: 'products',
      fileName: `${prototypeId}.${ext}`,
      data: file.buffer,
      contentType: file.mimetype,
    });

    // Add the image to the prototype
    const currentImages = prototype.toProps().images;
    const newImage = {
      id: crypto.randomUUID(),
      url: result.publicUrl,
      order: currentImages.length,
    };

    const updatedPrototype = new Prototype({
      ...prototype.toProps(),
      images: [...currentImages, newImage],
      updatedAt: new Date(),
    });

    await this.protoRepo.save(updatedPrototype);

    // Invalidate cache and publish event
    await this.cache.invalidateListings();
    const props = updatedPrototype.toProps();
    this.events.publishUpdated(props.id, props.priceUsd, props.stockQty);

    return {
      id: newImage.id,
      url: newImage.url,
      order: newImage.order,
    };
  }

  /**
   * Delete an image from a prototype.
   * DELETE /api/admin/catalog/prototypes/:prototypeId/images/:imageId
   */
  @Delete('prototypes/:prototypeId/images/:imageId')
  async deleteImage(@Param('prototypeId') prototypeId: string, @Param('imageId') imageId: string) {
    const prototype = await this.protoRepo.findById(prototypeId);
    if (!prototype) {
      throw new NotFoundException(`Prototype ${prototypeId} not found`);
    }

    const props = prototype.toProps();
    const image = props.images.find((img) => img.id === imageId);
    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    // Delete from Supabase Storage (extract path from URL)
    const storagePath = this.extractPathFromUrl(image.url);
    if (storagePath) {
      await this.storage.delete(storagePath);
    }

    // Remove image from prototype
    const updatedImages = props.images
      .filter((img) => img.id !== imageId)
      .map((img, idx) => ({ ...img, order: idx }));

    const updatedPrototype = new Prototype({
      ...props,
      images: updatedImages,
      updatedAt: new Date(),
    });

    await this.protoRepo.save(updatedPrototype);

    await this.cache.invalidateListings();
    this.events.publishUpdated(props.id, props.priceUsd, props.stockQty);

    return { deleted: true };
  }

  private extractPathFromUrl(url: string): string | null {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match?.[1] ?? null;
  }
}
