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

  it('generates PDF content with all quote data', async () => {
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

  it('includes customer details in PDF content', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const content = uploadCall.data.toString();

    expect(content).toContain('Laura Fernández');
    expect(content).toContain('laura@example.com');
    expect(content).toContain('+54 9 11 5555-1234');
  });

  it('includes pricing and delivery info in PDF content', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const content = uploadCall.data.toString();

    expect(content).toContain('$450.00');
    expect(content).toContain('10 días hábiles');
    expect(content).toContain('2026-08-03');
    expect(content).toContain('48 horas');
  });

  it('includes description in PDF content', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const content = uploadCall.data.toString();

    expect(content).toContain('Custom hexagonal shelf unit');
  });

  it('includes non-fiscal disclaimer', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const content = uploadCall.data.toString();

    expect(content).toContain('presupuesto informativo');
    expect(content).toContain('No constituye un comprobante fiscal');
  });

  it('includes quote reference number', async () => {
    await generator.generate(sampleData);

    const uploadCall = storage.upload.mock.calls[0][0];
    const content = uploadCall.data.toString();

    expect(content).toContain('QUO-QUOTE-AB');
  });
});
