import { Injectable, Logger } from '@nestjs/common';
import { StorageService, UploadResult } from '../../../infrastructure/storage/storage.service';
import * as PDFDocument from 'pdfkit';

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
 * Uses pdfkit to produce a valid PDF document with proper formatting.
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
    const buffer = await this.buildPdf(data);

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
   * Builds a valid PDF document using pdfkit.
   */
  private async buildPdf(data: QuotePdfData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Presupuesto QUO-${data.quoteId.substring(0, 8).toUpperCase()}`,
          Author: 'ModulApp',
          Subject: 'Presupuesto / Quote',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const date = data.createdAt.toISOString().split('T')[0];
      const deliveryDate = data.estimatedDeliveryDate.toISOString().split('T')[0];
      const shortId = data.quoteId.substring(0, 8).toUpperCase();

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text('MODULA', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Presupuesto / Quote', { align: 'center' });
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#333333').lineWidth(1.5).stroke();
      doc.moveDown(1);

      // Quote reference and date
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Nro. Presupuesto: QUO-${shortId}`, { continued: false });
      doc.font('Helvetica').text(`Fecha: ${date}`);
      doc.moveDown(1);

      // Customer section
      doc.fontSize(12).font('Helvetica-Bold').text('Datos del cliente');
      doc.moveDown(0.3);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Nombre:    ${data.customerName}`)
        .text(`Email:     ${data.customerEmail}`)
        .text(`Teléfono:  ${data.customerPhone}`);
      doc.moveDown(1);

      // Work description section
      doc.fontSize(12).font('Helvetica-Bold').text('Detalle del trabajo');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(data.description, { width: 480 });
      doc.moveDown(1);

      // Pricing section
      doc.fontSize(12).font('Helvetica-Bold').text('Condiciones');
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Precio (USD):         $${data.priceUsd.toFixed(2)}`);
      doc.text(`Plazo de entrega:     ${data.leadTimeDays} días hábiles`);
      doc.text(`Fecha estimada:       ${deliveryDate}`);
      doc.text(`Validez:              ${data.validityHours} horas desde el envío`);
      doc.moveDown(1.5);

      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#999999').lineWidth(0.5).stroke();
      doc.moveDown(1);

      // Disclaimer
      doc
        .fontSize(9)
        .fillColor('#666666')
        .text('Este documento es un presupuesto informativo.', { align: 'center' })
        .text('No constituye un comprobante fiscal.', { align: 'center' })
        .text('El pago se realizará mediante PayPal al aceptar este presupuesto.', {
          align: 'center',
        });

      doc.end();
    });
  }
}
