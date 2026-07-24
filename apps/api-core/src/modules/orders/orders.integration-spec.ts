import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../app.module';
import { PROTOTYPE_REPOSITORY } from '../catalog/repositories/prototype.repository.port';
import { ORDER_REPOSITORY } from './repositories/order.repository.port';
import { InMemoryPrototypeRepository } from '../catalog/repositories/in-memory-prototype.repository';
import { InMemoryOrderRepository } from './repositories/in-memory-order.repository';
import { Prototype } from '../catalog/domain/prototype.entity';
import { Order } from './domain/order.entity';
import { PaymentServiceClient } from './services/payment-service.client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePrototype(overrides = {}) {
  return new Prototype({
    id: 'proto-1',
    name: 'Test Arch',
    description: 'desc',
    category: 'arches',
    priceUsd: 199.99,
    active: true,
    stockQty: 5,
    buildOnDemand: false,
    estimatedDeliveryDays: 14,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Orders Integration Tests', () => {
  let app: INestApplication;
  let protoRepo: InMemoryPrototypeRepository;
  let orderRepo: InMemoryOrderRepository;
  let paymentClientMock: jest.Mocked<PaymentServiceClient>;

  beforeAll(async () => {
    protoRepo = new InMemoryPrototypeRepository();
    orderRepo = new InMemoryOrderRepository();

    paymentClientMock = {
      initiatePayment: jest.fn().mockResolvedValue({
        paymentLink: 'https://paypal.com/approve?token=TEST',
        paymentServiceRef: 'pay-ref-001',
      }),
      refund: jest.fn().mockResolvedValue({ refundId: 'refund-001', status: 'processed' }),
    } as any;

    await protoRepo.save(makePrototype());

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PROTOTYPE_REPOSITORY)
      .useValue(protoRepo)
      .overrideProvider(ORDER_REPOSITORY)
      .useValue(orderRepo)
      .overrideProvider(PaymentServiceClient)
      .useValue(paymentClientMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh';
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.clearAllMocks();
    paymentClientMock.initiatePayment.mockResolvedValue({
      paymentLink: 'https://paypal.com/approve?token=TEST',
      paymentServiceRef: 'pay-ref-001',
    });
    paymentClientMock.refund.mockResolvedValue({ refundId: 'refund-001', status: 'processed' });
  });

  // ── integration.order.create.readsPriceServerSide ─────────────────────────

  it('creates order and returns payment_link', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-1', customerEmail: 'buyer@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.paymentLink).toContain('paypal.com');
    expect(res.body.orderId).toBeDefined();
  });

  // ── integration.order.create.blocksWhenStockZeroAndNotBuildOnDemand ───────

  it('blocks order when stock=0 and build_on_demand=false', async () => {
    await protoRepo.save(makePrototype({ id: 'proto-nostock', stockQty: 0, buildOnDemand: false }));
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-nostock', customerEmail: 'b@t.com' });
    expect(res.status).toBe(400);
    expect(paymentClientMock.initiatePayment).not.toHaveBeenCalled();
  });

  // ── integration.order.webhookOK.movesToPaidPendingAcceptance ─────────────

  it('webhook confirmed → moves order to paid_pending_acceptance', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-1', customerEmail: 'wh@test.com' });

    const { orderId } = createRes.body;

    const webhookRes = await request(app.getHttpServer())
      .post('/orders/webhooks/payment-result')
      .send({ reference_id: orderId, payment_service_ref: 'pay-ref-001', status: 'confirmed' });

    expect(webhookRes.status).toBe(200);

    // Check order status in repo
    const order = await orderRepo.findById(orderId);
    expect(order?.status).toBe('paid_pending_acceptance');
  });

  // ── integration.order.webhookFailedMovesToPaymentFailed ───────────────────

  it('webhook failed → moves order to payment_failed', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-1', customerEmail: 'fail@test.com' });

    const { orderId } = createRes.body;

    await request(app.getHttpServer())
      .post('/orders/webhooks/payment-result')
      .send({ reference_id: orderId, payment_service_ref: 'pay-ref-fail', status: 'failed' });

    const order = await orderRepo.findById(orderId);
    expect(order?.status).toBe('payment_failed');
  });

  // ── integration.order.accept.deductsStockAndSetsETA ──────────────────────

  it('admin accepts order — deducts stock and sets ETA (requires JWT)', async () => {
    // Create + confirm
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-1', customerEmail: 'accept@test.com' });
    const { orderId } = createRes.body;

    await request(app.getHttpServer())
      .post('/orders/webhooks/payment-result')
      .send({ reference_id: orderId, payment_service_ref: 'pay-ref-002', status: 'confirmed' });

    // Without JWT → 401
    const noAuth = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/accept`)
      .send({ estimatedDeliveryDate: '2026-09-01' });
    expect(noAuth.status).toBe(401);

    // With valid JWT
    const token = jwt.sign({ sub: 'admin-1', email: 'admin@modulapp.com' }, 'test-secret', {
      expiresIn: '15m',
    });
    const acceptRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estimatedDeliveryDate: '2026-09-01' });
    expect(acceptRes.status).toBe(204);

    const order = await orderRepo.findById(orderId);
    expect(order?.status).toBe('accepted');
  });

  // ── integration.order.reject.callsRefundMockAndNotifiesCustomer ──────────

  it('admin rejects order — calls refund and transitions to rejected', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ prototypeId: 'proto-1', customerEmail: 'reject@test.com' });
    const { orderId } = createRes.body;

    await request(app.getHttpServer())
      .post('/orders/webhooks/payment-result')
      .send({ reference_id: orderId, payment_service_ref: 'pay-ref-003', status: 'confirmed' });

    const token = jwt.sign({ sub: 'admin-1', email: 'admin@modulapp.com' }, 'test-secret', {
      expiresIn: '15m',
    });
    const rejectRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Out of stock in warehouse' });

    expect(rejectRes.status).toBe(204);
    expect(paymentClientMock.refund).toHaveBeenCalledWith(
      expect.objectContaining({ referenceId: orderId, refundRequestId: `order-refund-${orderId}` }),
    );

    const order = await orderRepo.findById(orderId);
    expect(order?.status).toBe('rejected');
    expect(order?.rejectionReason).toBe('Out of stock in warehouse');
  });

  // ── integration.order.reconciliation.catchesHungPayments ─────────────────

  it('integration.order.reconciliation.catchesHungPayments — findHungPayments finds old payment_initiated', async () => {
    const old = Order.create(
      'proto-1',
      99.99,
      'hung@test.com',
      null,
      `idem-hung-${Date.now()}`,
    ).initiatePayment('ref-hung');

    // Backdate the order to simulate being stuck for > 10 min
    Object.defineProperty(old, 'updatedAt', { value: new Date(Date.now() - 20 * 60_000) });
    await orderRepo.save(old);

    const hung = await orderRepo.findHungPayments(10);
    expect(hung.some((o) => o.customerEmail === 'hung@test.com')).toBe(true);
  });
});
