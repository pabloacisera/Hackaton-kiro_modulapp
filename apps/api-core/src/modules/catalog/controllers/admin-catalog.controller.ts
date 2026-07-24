import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
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

// ── DTOs ─────────────────────────────────────────────────────────────────────

export class CreatePrototypeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(['modular_furniture', 'arches'])
  category: 'modular_furniture' | 'arches';

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  priceUsd: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQty: number;

  @IsBoolean()
  buildOnDemand: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDeliveryDays?: number | null;
}

export class UpdatePrototypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsEnum(['modular_furniture', 'arches'])
  category?: 'modular_furniture' | 'arches';

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  priceUsd?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQty?: number;

  @IsOptional()
  @IsBoolean()
  buildOnDemand?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedDeliveryDays?: number | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── Controller ───────────────────────────────────────────────────────────────

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

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /**
   * Create a new prototype.
   * POST /api/admin/catalog/prototypes
   */
  @Post('prototypes')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePrototypeDto) {
    const prototype = new Prototype({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      category: dto.category,
      priceUsd: dto.priceUsd,
      active: true,
      stockQty: dto.stockQty,
      buildOnDemand: dto.buildOnDemand,
      estimatedDeliveryDays: dto.estimatedDeliveryDays ?? null,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.protoRepo.save(prototype);

    await this.cache.invalidateListings();
    const props = saved.toProps();
    this.events.publishUpdated(props.id, props.priceUsd, props.stockQty);

    return this.toDto(saved);
  }

  /**
   * List all prototypes (active + inactive) for admin.
   * GET /api/admin/catalog/prototypes
   */
  @Get('prototypes')
  async listAll(
    @Query('q') q?: string,
    @Query('category') category?: 'modular_furniture' | 'arches',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.protoRepo.findAllAdmin({
      q: q || undefined,
      category: category || undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });

    return {
      items: result.items.map((p) => this.toDto(p)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  /**
   * Get a single prototype by ID.
   * GET /api/admin/catalog/prototypes/:id
   */
  @Get('prototypes/:id')
  async getById(@Param('id') id: string) {
    const prototype = await this.protoRepo.findById(id);
    if (!prototype) {
      throw new NotFoundException(`Prototype ${id} not found`);
    }
    return this.toDto(prototype);
  }

  /**
   * Update prototype fields (partial).
   * PATCH /api/admin/catalog/prototypes/:id
   */
  @Patch('prototypes/:id')
  async update(@Param('id') id: string, @Body() dto: UpdatePrototypeDto) {
    const existing = await this.protoRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Prototype ${id} not found`);
    }

    const props = existing.toProps();
    const updated = new Prototype({
      ...props,
      name: dto.name ?? props.name,
      description: dto.description ?? props.description,
      category: dto.category ?? props.category,
      priceUsd: dto.priceUsd ?? props.priceUsd,
      stockQty: dto.stockQty ?? props.stockQty,
      buildOnDemand: dto.buildOnDemand ?? props.buildOnDemand,
      estimatedDeliveryDays:
        dto.estimatedDeliveryDays !== undefined
          ? dto.estimatedDeliveryDays
          : props.estimatedDeliveryDays,
      updatedAt: new Date(),
    });

    const saved = await this.protoRepo.save(updated);

    await this.cache.invalidateListings();
    const savedProps = saved.toProps();
    this.events.publishUpdated(savedProps.id, savedProps.priceUsd, savedProps.stockQty);

    return this.toDto(saved);
  }

  /**
   * Deactivate a prototype (soft delete).
   * PATCH /api/admin/catalog/prototypes/:id/deactivate
   */
  @Patch('prototypes/:id/deactivate')
  async deactivate(@Param('id') id: string) {
    const existing = await this.protoRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Prototype ${id} not found`);
    }

    const deactivated = existing.deactivate();
    await this.protoRepo.save(deactivated);

    await this.cache.invalidateListings();
    this.events.publishDeactivated(id);

    return { id, active: false };
  }

  /**
   * Reactivate a previously deactivated prototype.
   * PATCH /api/admin/catalog/prototypes/:id/reactivate
   */
  @Patch('prototypes/:id/reactivate')
  async reactivate(@Param('id') id: string) {
    const existing = await this.protoRepo.findById(id);
    if (!existing) {
      throw new NotFoundException(`Prototype ${id} not found`);
    }

    const props = existing.toProps();
    const reactivated = new Prototype({
      ...props,
      active: true,
      updatedAt: new Date(),
    });

    const saved = await this.protoRepo.save(reactivated);

    await this.cache.invalidateListings();
    const savedProps = saved.toProps();
    this.events.publishUpdated(savedProps.id, savedProps.priceUsd, savedProps.stockQty);

    return this.toDto(saved);
  }

  // ── Image management (existing) ─────────────────────────────────────────

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

  // ── Helpers ──────────────────────────────────────────────────────────────

  private extractPathFromUrl(url: string): string | null {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match?.[1] ?? null;
  }

  private toDto(prototype: Prototype) {
    const props = prototype.toProps();
    return {
      id: props.id,
      name: props.name,
      description: props.description,
      category: props.category,
      priceUsd: props.priceUsd,
      active: props.active,
      stockQty: props.stockQty,
      buildOnDemand: props.buildOnDemand,
      estimatedDeliveryDays: props.estimatedDeliveryDays,
      images: props.images.map((img) => ({
        id: img.id,
        url: img.url,
        order: img.order,
      })),
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
