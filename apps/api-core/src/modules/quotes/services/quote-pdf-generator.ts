import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadResult } from '../../../infrastructure/storage/storage.service';

export interface QuotePdfData {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  priceUsd: number;
  leadTimeDays: number;
  estimatedDeliveryDate: Date;
  validityHours: number;
  createdAt: Date;
}

/**
 * Generates and uploads a quote/budget PDF to Supabase Storage.
 *
 * The PDF is a plain-text formatted document (no external template).
 * Generated once when admin presents the quote (pending → quoted).
 * Never regenerated — state changes (rejected, expired) are tracked in the system, not the PDF.
 */
@Injectable()
export class QuotePdfGenerator {
  private readonly logger = new Logger(QuotePdfGenerator.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Generate a quote PDF and upload it to Supabase Storage.
   * Returns the public URL of the uploaded PDF.
   */
  async generate(data: QuotePdfData): Promise<UploadResult> {
    const pdfContent = this.buildPdfContent(data);
    const buffer = Buffer.from(pdfContent);

    const result = await this.storage.upload({
      folder: 'quotes',
      fileName: `presupuesto-${data.quoteId}.pdf`,
      data: buffer,
      contentType: 'application/pdf',
    });

    this.logger.log(`Quote PDF generated and uploaded: ${data.quoteId}`);
    return result;
  }

  /**
   * Builds the PDF content as a formatted text document.
   *
   * NOTE: This generates a plain text representation saved as .pdf.
   * For a proper PDF with formatting, integrate a library like pdfkit.
   * For now this provides the correct content and storage flow — the
   * visual rendering can be upgraded later without changing the API.
   */
  private buildPdfContent(data: QuotePdfData): string {
    const date = data.createdAt.toISOString().split('T')[0];
    const deliveryDate = data.estimatedDeliveryDate.toISOString().split('T')[0];
    const shortId = data.quoteId.substring(0, 8).toUpperCase();

    return [
      '═══════════════════════════════════════════════════════════════',
      '                MODULA — Presupuesto / Quote',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Fecha:                ${date}`,
      `Nro. Presupuesto:     QUO-${shortId}`,
      '',
      '─── Datos del cliente ─────────────────────────────────────────',
      `Nombre:               ${data.customerName}`,
      `Email:                ${data.customerEmail}`,
      `Teléfono:             ${data.customerPhone}`,
      '',
      '─── Detalle del trabajo ───────────────────────────────────────',
      '',
      `  ${data.description}`,
      '',
      '─── Condiciones ───────────────────────────────────────────────',
      '',
      `Precio (USD):         $${data.priceUsd.toFixed(2)}`,
      `Plazo de entrega:     ${data.leadTimeDays} días hábiles`,
      `Fecha estimada:       ${deliveryDate}`,
      '',
      `Validez:              ${data.validityHours} horas desde el envío`,
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'Este documento es un presupuesto informativo.',
      'No constituye un comprobante fiscal.',
      'El pago se realizará mediante PayPal al aceptar este presupuesto.',
      '',
      '═══════════════════════════════════════════════════════════════',
    ].join('\n');
  }
}
