import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { JwtAuthGuard } from '../../../interface/auth/guards/jwt-auth.guard';
import { SupplyCrudUseCase } from '../use-cases/supply-crud.use-case';
import { ImportSupplyExcelUseCase } from '../use-cases/import-supply-excel.use-case';
import { ConfirmSupplyImportUseCase } from '../use-cases/confirm-supply-import.use-case';

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateSupplyDto {
  @IsString() @IsNotEmpty() sku!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() unit!: string;
  @IsNumber() @Min(0) currentQty!: number;
  @IsNumber() @Min(0) minStock!: number;
  @IsNumber() @Min(0) unitCostUsd!: number;
  @IsOptional() @IsString() supplier?: string;
}

class UpdateSupplyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() @Min(0) currentQty?: number;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) unitCostUsd?: number;
  @IsOptional() @IsString() supplier?: string;
}

class ImportExcelDto {
  @IsNotEmpty() rows!: Record<string, unknown>[];
}

class ConfirmImportDto {
  @IsString() @IsNotEmpty() previewId!: string;
}

// ── Controller ────────────────────────────────────────────────────────────────

@Controller('admin/supplies')
@UseGuards(JwtAuthGuard)
export class SuppliesController {
  constructor(
    private readonly crud: SupplyCrudUseCase,
    private readonly importExcel: ImportSupplyExcelUseCase,
    private readonly confirmImport: ConfirmSupplyImportUseCase,
  ) {}

  // TASK-stock-2: GET /api/admin/supplies (listing with filters)
  @Get()
  async list(
    @Query('search') search?: string,
    @Query('supplier') supplier?: string,
    @Query('belowMin') belowMin?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.crud.list({
      search,
      supplier,
      belowMin: belowMin === 'true',
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  // TASK-stock-2: GET /api/admin/supplies/:id
  @Get(':id')
  async findById(@Param('id') id: string) {
    const supply = await this.crud.findById(id);
    if (!supply) throw new Error(`Supply not found: ${id}`);
    return supply.toProps();
  }

  // TASK-stock-2: POST /api/admin/supplies
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSupplyDto) {
    const supply = await this.crud.create(dto, 'admin');
    return supply.toProps();
  }

  // TASK-stock-2: PATCH /api/admin/supplies/:id
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSupplyDto) {
    const supply = await this.crud.update(id, dto, 'admin');
    return supply.toProps();
  }

  // TASK-stock-2: DELETE /api/admin/supplies/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.crud.delete(id);
  }

  // TASK-stock-4: POST /api/admin/supplies/import-excel (preview)
  @Post('import-excel')
  async importPreview(@Body() dto: ImportExcelDto) {
    return this.importExcel.preview(dto.rows);
  }

  // TASK-stock-5: POST /api/admin/supplies/import-excel/confirm
  @Post('import-excel/confirm')
  async importConfirm(@Body() dto: ConfirmImportDto) {
    return this.confirmImport.execute(dto.previewId, 'admin-excel-import');
  }

  // TASK-stock-6: GET /api/admin/supplies/export-excel
  // Returns JSON representation (in production: generate xlsx with exceljs)
  @Get('export-excel')
  async exportExcel() {
    const result = await this.crud.list({ pageSize: 10000 });
    return {
      headers: ['sku', 'name', 'unit', 'current_qty', 'min_stock', 'unit_cost_usd', 'supplier'],
      rows: result.items.map((s) => ({
        sku: s.sku,
        name: s.name,
        unit: s.unit,
        current_qty: s.currentQty,
        min_stock: s.minStock,
        unit_cost_usd: s.unitCostUsd,
        supplier: s.supplier ?? '',
      })),
    };
  }
}
