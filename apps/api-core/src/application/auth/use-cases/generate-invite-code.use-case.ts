import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const INVITE_CODE_TTL = 900; // 15 minutes

@Injectable()
export class GenerateInviteCodeUseCase {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  async execute(createdBy: string): Promise<{ code: string; expiresIn: number }> {
    // Generate 8-char alphanumeric code (uppercase for readability)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g., "A3X9K7M2"

    // Hash the code before storing (so even Redis access doesn't expose codes)
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    // Store in Redis with TTL
    await this.redis.set(
      `invite-code:${codeHash}`,
      JSON.stringify({ createdBy, createdAt: new Date().toISOString() }),
      'EX',
      INVITE_CODE_TTL,
    );

    return { code, expiresIn: INVITE_CODE_TTL };
  }
}
