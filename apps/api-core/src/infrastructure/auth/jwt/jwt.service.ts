import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  generateAccessToken(adminUserId: string, email: string): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    return jwt.sign({ sub: adminUserId, email }, secret, { expiresIn: '15m' });
  }

  verifyAccessToken(token: string): { sub: string; email: string } {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    const payload = jwt.verify(token, secret) as { sub: string; email: string };
    return { sub: payload.sub, email: payload.email };
  }
}
