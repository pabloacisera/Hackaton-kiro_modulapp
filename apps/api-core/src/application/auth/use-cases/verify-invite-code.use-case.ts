import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

const MAX_ATTEMPTS = 5;

@Injectable()
export class VerifyInviteCodeUseCase {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  async execute(registrationToken: string, inviteCode: string): Promise<{ verified: boolean }> {
    // 1. Validate registration token exists
    const regData = await this.redis.get(`admin-reg:${registrationToken}`);
    if (!regData) {
      throw new BadRequestException('Registration link expired or invalid');
    }

    // Upstash returns already-parsed objects; handle both string and object
    const registration = typeof regData === 'string' ? JSON.parse(regData) : regData;

    // 2. Check attempts limit
    if (registration.attempts >= MAX_ATTEMPTS) {
      // Invalidate the registration entirely
      await this.redis.del(`admin-reg:${registrationToken}`);
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new registration link.',
      );
    }

    // 3. Hash the provided invite code and check against Redis
    const codeHash = crypto
      .createHash('sha256')
      .update(inviteCode.toUpperCase().trim())
      .digest('hex');
    const inviteData = await this.redis.get(`invite-code:${codeHash}`);

    if (!inviteData) {
      // Invalid code — increment attempts
      registration.attempts += 1;
      await this.redis.set(
        `admin-reg:${registrationToken}`,
        JSON.stringify(registration),
        'EX',
        900,
      );

      const remaining = MAX_ATTEMPTS - registration.attempts;
      throw new UnauthorizedException(
        `Invalid invitation code. ${remaining} attempt(s) remaining.`,
      );
    }

    // 4. Valid code! Delete invite code (single-use) and mark registration as verified
    await this.redis.del(`invite-code:${codeHash}`);

    registration.verified = true;
    await this.redis.set(
      `admin-reg:${registrationToken}`,
      JSON.stringify(registration),
      'EX',
      900, // Give 15 more minutes to set password
    );

    return { verified: true };
  }
}
