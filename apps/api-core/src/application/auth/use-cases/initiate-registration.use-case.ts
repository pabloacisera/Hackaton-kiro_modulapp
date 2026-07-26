import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  ADMIN_USER_REPOSITORY,
  IAdminUserRepository,
} from '../../../domain/auth/repositories/admin-user.repository.port';
import { QUEUE_EMAIL_SEND, JOB_SEND_EMAIL } from '../../../infrastructure/queue/queue.constants';

const REGISTRATION_TOKEN_TTL = 900; // 15 minutes

@Injectable()
export class InitiateRegistrationUseCase {
  constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepo: IAdminUserRepository,
    @Inject('REDIS_CLIENT') private readonly redis: any,
    @InjectQueue(QUEUE_EMAIL_SEND) private readonly emailQueue: Queue,
  ) {}

  async execute(email: string, baseUrl: string): Promise<void> {
    // Check if email already exists
    const existing = await this.adminUserRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Generate registration token (UUID)
    const registrationToken = crypto.randomUUID();

    // Store in Redis: binding token → email, with attempts counter
    await this.redis.set(
      `admin-reg:${registrationToken}`,
      JSON.stringify({ email, attempts: 0, verified: false, createdAt: new Date().toISOString() }),
      'EX',
      REGISTRATION_TOKEN_TTL,
    );

    // Build verification URL
    const verifyUrl = `${baseUrl}/register/verify?token=${registrationToken}`;

    // Send email via queue
    await this.emailQueue.add(JOB_SEND_EMAIL, {
      to: email,
      subject: 'ModulApp — Completa tu registro de administrador',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Registro de Administrador</h2>
          <p>Has solicitado registrarte como administrador en ModulApp.</p>
          <p>Haz click en el siguiente enlace para continuar con tu registro:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Continuar registro
          </a>
          <p style="color: #6b7280; font-size: 14px;">Este enlace expira en 15 minutos.</p>
          <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este registro, ignora este correo.</p>
        </div>
      `,
    });
  }
}
