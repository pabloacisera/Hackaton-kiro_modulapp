import { QuotePdfGenerator, QuotePdfData } from './quote-pdf-generator';

describe('QuotePdfGenerator', () => {
  let generator: QuotePdfGenerator;
  let storage: any;

  const sampleData: QuotePdfData = {
    quoteId: 'quote-abc-123',
    customerName: 'Laura Fernández',
    customerEmail: 'laura@example.com',
    customerPhone: '+54 9 11 5555-1234',
    description: 'Custom hexagonal shelf unit, 2m tall, 6 hexagons, white finish',
    priceUsd: 450.0,
    leadTimeDays: 10,
    estimatedDeliveryDate: new Date('2026-08-03'),
    validityHours: 48,
    createdAt: new Date('2026-07-24'),
  };

  beforeEach(() => {
    storage = {
      upload: jest.fn().mockResolvedValue({
        publicUrl: 'https://supabase.co/storage/v1/object/public/bucket/quotes/123-presupuesto.pdf',
        path: 'quotes/123-presupuesto.pdf',
      }),
    };
    generator = new QuotePdfGenerator(storage);
  });

  it('generates a valid PDF (starts with %PDF header)', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const pdfBuffer: Buffer = uploadCall.data;

    // A valid PDF always starts with %PDF-
    const header = pdfBuffer.slice(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('uploads to correct folder with correct content type', async () => {
    const result = await generator.generate(sampleData);

    expect(result.publicUrl).toBe(
      'https://supabase.co/storage/v1/object/public/bucket/quotes/123-presupuesto.pdf',
    );
    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'quotes',
        fileName: expect.stringContaining('presupuesto-quote-abc-123.pdf'),
        contentType: 'application/pdf',
      }),
    );
  });

  it('generates a non-trivial PDF buffer', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const pdfBuffer: Buffer = uploadCall.data;

    // A real PDF with content should be at least a few KB
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('includes quote reference in PDF metadata', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const pdfContent = uploadCall.data.toString('latin1');

    // pdfkit embeds the title in the PDF info dictionary
    expect(pdfContent).toContain('QUO-QUOTE-AB');
  });
});
