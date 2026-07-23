import { BadRequestException } from '@nestjs/common';
import { CreateOrderUseCase } from './create-order.use-case';
import { IOrderRepository } from '../repositories/order.repository.port';
import { IPrototypeRepository } from '../../catalog/repositories/prototype.repository.port';
import { Prototype } from '../../catalog/domain/prototype.entity';
import { PaymentServiceClient } from '../services/payment-service.client';
import { Order } from '../domain/order.entity';

function makePrototype(overrides = {}) {
  return new Prototype({
    id: 'proto-1', name: 'Arch', description: 'd', category: 'arches',
    priceUsd: 199.99, active: true, stockQty: 5, buildOnDemand: false,
    estimatedDeliveryDays: 14, images: [], createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  });
}

describe('CreateOrderUseCase', () => {
  let orderRepo: jest.Mocked<IOrderRepository>;
  let protoRepo: jest.Mocked<IPrototypeRepository>;
  let paymentClient: jest.Mocked<PaymentServiceClient>;
  let useCase: CreateOrderUseCase;

  beforeEach(() => {
    orderRepo = {
      findById: jest.fn(), findByIdempotencyKey: jest.fn(),
      findByPaymentServiceRef: jest.fn(), findHungPayments: jest.fn(),
      findAll: jest.fn(), save: jest.fn(), update: jest.fn(),
    } as any;
    protoRepo = { findAll: jest.fn(), findById: jest.fn(), save: jest.fn() } as any;
    paymentClient = { initiatePayment: jest.fn(), refund: jest.fn() } as any;

    useCase = new CreateOrderUseCase(orderRepo, protoRepo, paymentClient);
  });

  it('integration.order.create.readsPriceServerSide — uses DB price, not client price', async () => {
    protoRepo.findById.mockResolvedValue(makePrototype({ priceUsd: 199.99 }));
    paymentClient.initiatePayment.mockResolvedValue({ paymentLink: 'https://paypal.com/approve', paymentServiceRef: 'ref-1' });
    orderRepo.save.mockImplementation(async (o) => o);
    orderRepo.update.mockImplementation(async (o) => o);

    await useCase.execute({ prototypeId: 'proto-1', customerEmail: 'c@t.com' });

    expect(paymentClient.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountUsd: 199.99 }),
    );
  });

  it('integration.order.create.blocksWhenStockZeroAndNotBuildOnDemand', async () => {
    protoRepo.findById.mockResolvedValue(
      makePrototype({ stockQty: 0, buildOnDemand: false }),
    );
    await expect(
      useCase.execute({ prototypeId: 'proto-1', customerEmail: 'c@t.com' }),
    ).rejects.toThrow(BadRequestException);
    expect(paymentClient.initiatePayment).not.toHaveBeenCalled();
  });

  it('allows purchase when buildOnDemand=true and stock=0', async () => {
    protoRepo.findById.mockResolvedValue(
      makePrototype({ stockQty: 0, buildOnDemand: true }),
    );
    paymentClient.initiatePayment.mockResolvedValue({ paymentLink: 'https://paypal.com', paymentServiceRef: 'ref-2' });
    orderRepo.save.mockImplementation(async (o) => o);
    orderRepo.update.mockImplementation(async (o) => o);

    const result = await useCase.execute({ prototypeId: 'proto-1', customerEmail: 'c@t.com' });
    expect(result.paymentLink).toBeDefined();
  });

  it('integration.order.create.callsPaymentServiceMock — initiates payment with correct payload', async () => {
    protoRepo.findById.mockResolvedValue(makePrototype());
    paymentClient.initiatePayment.mockResolvedValue({ paymentLink: 'https://paypal.com', paymentServiceRef: 'ref-3' });
    orderRepo.save.mockImplementation(async (o) => o);
    orderRepo.update.mockImplementation(async (o) => o);

    await useCase.execute({ prototypeId: 'proto-1', customerEmail: 'buyer@test.com' });

    expect(paymentClient.initiatePayment).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId:   expect.any(String),
        origin:        'order',
        amountUsd:     199.99,
        customerEmail: 'buyer@test.com',
      }),
    );
  });

  it('throws when prototype not found', async () => {
    protoRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ prototypeId: 'missing', customerEmail: 'c@t.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when prototype is inactive', async () => {
    protoRepo.findById.mockResolvedValue(makePrototype({ active: false }));
    await expect(
      useCase.execute({ prototypeId: 'proto-1', customerEmail: 'c@t.com' }),
    ).rejects.toThrow(BadRequestException);
  });
});
