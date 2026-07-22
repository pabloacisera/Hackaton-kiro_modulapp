import { RefreshToken } from './refresh-token.entity';

describe('RefreshToken entity', () => {
  const ADMIN_USER_ID = 'test-admin-uuid';
  const RAW_TOKEN = 'raw-secure-token-value';

  describe('unit.refresh-token.create', () => {
    it('unit.refresh-token.create.setsExpiry — sets expiry 30 days from now by default', () => {
      const token = RefreshToken.create(ADMIN_USER_ID, RAW_TOKEN);
      const now = new Date();
      const thirtyDaysLater = new Date(now);
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

      expect(token.expiresAt.getTime()).toBeGreaterThan(now.getTime());
      // Within a second of expected expiry
      expect(Math.abs(token.expiresAt.getTime() - thirtyDaysLater.getTime())).toBeLessThan(1000);
    });

    it('hashes the raw token — does not store plain token', () => {
      const token = RefreshToken.create(ADMIN_USER_ID, RAW_TOKEN);
      expect(token.tokenHash).not.toBe(RAW_TOKEN);
      expect(token.tokenHash).toBe(RefreshToken.hashToken(RAW_TOKEN));
    });

    it('starts as not revoked', () => {
      const token = RefreshToken.create(ADMIN_USER_ID, RAW_TOKEN);
      expect(token.revoked).toBe(false);
    });
  });

  describe('unit.refresh-token.isExpired', () => {
    it('unit.refresh-token.isExpired.false — not expired for future token', () => {
      const token = RefreshToken.create(ADMIN_USER_ID, RAW_TOKEN, 30);
      expect(token.isExpired()).toBe(false);
    });

    it('unit.refresh-token.isExpired.true — expired for past token', () => {
      const pastDate = new Date(Date.now() - 1000);
      const token = new RefreshToken({
        id: 'test-id',
        adminUserId: ADMIN_USER_ID,
        tokenHash: RefreshToken.hashToken(RAW_TOKEN),
        expiresAt: pastDate,
        revoked: false,
        createdAt: new Date(),
      });
      expect(token.isExpired()).toBe(true);
    });
  });

  describe('unit.refresh-token.revoke', () => {
    it('returns a new instance with revoked=true', () => {
      const token = RefreshToken.create(ADMIN_USER_ID, RAW_TOKEN);
      const revoked = token.revoke();
      expect(revoked.revoked).toBe(true);
      expect(token.revoked).toBe(false); // original unchanged
    });
  });
});
