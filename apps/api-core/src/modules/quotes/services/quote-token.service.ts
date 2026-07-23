import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface QuoteTokenPayload {
  quoteId: string;
  action: 'pending';
  exp?: number;
}

/**
 * TASK-quoteB-7: Signed one-time-use token generation (JWT) for accept/reject.
 * Tokens are signed with a secret, include quote_id and expiration matching
 * the 48h response deadline.
 */
@Injectable()
export class QuoteTokenService {
  private readonly logger = new Logger(QuoteTokenService.name);
  private readonly secret: string;

  constructor() {
    this.secret = process.env.QUOTE_TOKEN_SECRET || 'quote-token-dev-secret';
  }

  /**
   * Generate a signed JWT token for a quote's accept/reject action.
   * Returns { token, tokenHash } — tokenHash is stored in the DB for verification.
   */
  generateToken(quoteId: string, expiresAt: Date): { token: string; tokenHash: string } {
    const payload: QuoteTokenPayload = {
      quoteId,
      action: 'pending',
    };

    const token = jwt.sign(payload, this.secret, {
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });

    const tokenHash = this.hashToken(token);

    this.logger.debug(`Generated action token for quote ${quoteId}`);
    return { token, tokenHash };
  }

  /**
   * Verify and decode a token. Returns the payload or throws.
   */
  verifyToken(token: string): QuoteTokenPayload {
    try {
      const payload = jwt.verify(token, this.secret) as QuoteTokenPayload;
      return payload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw err;
    }
  }

  /**
   * Hash a token for storage (SHA-256).
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
