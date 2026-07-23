import { NotFoundException } from '@nestjs/common';
import { HandlePaymentWebhookUseCase } from './handle-payment-webhook.use-case';
import { IOrderRepository } from '../repositories/order.repository.port';
import { IPrototypeRepository } from '../../catalog/repositories/prototype.repository.port';
import { NotificationsService } from '../../notifications/notifications.service';
import { OrderEmailService } from '../services/order-email.service';
import { Order } from '../domain/order.entity';

function makeOrder(status: Order['status'] = 'payment_initiated') {
  const o = Order.create('proto-1', 149.99, 'c@t.com', null, 'idem-1');
  if (status === 'payment_initiated') return o.initiatePayment('ref');
  return o;
}

describe('HandlePaymentWebhookUseCase', () => {
  let orderRepo: jest.Mocked<IOrderRepository>;
  let protoRepo: jest.Mocked<IPrototypeRepository>;
  let notifications: jest.Mocked<NotificationsService>;
  let emailService: jest.Mocked<OrderEmailService>;
  let useCase: HandlePaymentWebhookUseCase;

  beforeEach(() => {
    orderRepo = { findById: jest.fn(), update: jest.fn(), save: jest.fn(),
      findAll: jest.fn(), findByIdempotencyKey: jest.fn(),
      findByPaymentServiceRef: jest.fn(), findHungPayments: jest.fn() } as any;
    protoRepo = { findById: jest.fn(), findAll: jest.fn(), save: jest.fn() } as any;
    notifications = { notifyAdmins: jest.fn().mockResolvedValue({}) } as any;
    emailService = {
      sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
      sendOrderRejection: jest.fn(),
    } as any;

    useCase = new HandlePaymentWebhookUseCase(
      orderRepo, protoRepo, notifications, emailService,
    );
  });

  it('integration.order.webhookOK.movesToPaidPendingAcceptance', async () => {
    const order = makeOrder();
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.update.mockImplementation(async (o) => o);
    protoRepo.findById.mockResolvedValue(null);

    await useCase.execute({ referenceId: order.id, paymentServiceRef: 'ref-1', status: 'confirmed' });

    expect(orderRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'paid_pending_acceptance' }),
    );
    expect(notifications.notifyAdmins).toHaveBeenCalledWith(
      'new_purchase', expect.any(String), expect.stringContaining(order.id),
    );
  });

  it('integration.order.webhookFailed.movesToPaymentFailed', async () => {
    const order = makeOrder();
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.update.mockImplementation(async (o) => o);

    await useCase.execute({ referenceId: order.id, paymentServiceRef: 'ref-1', status: 'failed' });

    expect(orderRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'payment_failed' }),
    );
    expect(notifications.notifyAdmins).not.toHaveBeenCalled();
  });

  it('sends confirmation email on payment confirmed', async () => {
    const order = makeOrder();
    orderRepo.findById.mockResolvedValue(order);
    orderRepo.update.mockImplementation(async (o) => o);
    protoRepo.findById.mockResolvedValue(null);

    await useCase.execute({ referenceId: order.id, paymentServiceRef: 'ref', status: 'confirmed' });

    // Email is async fire-and-forget — verify it was called
    await new Promise(r => setTimeout(r, 10)); // flush micro-tasks
    expect(emailService.sendPaymentConfirmation).toHaveBeenCalledWith(
      'c@t.com', order.id, 149.99, null,
    );
  });

  it('throws NotFoundException for unknown order', async () => {
    orderRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ referenceId: 'unknown', paymentServiceRef: '', status: 'confirmed' }),
    ).rejects.toThrow(NotFoundException);
  });
});
