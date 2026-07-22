import { AdminUser } from './admin-user.entity';

describe('AdminUser entity', () => {
  describe('unit.admin-user.create', () => {
    it('unit.admin-user.create.validHash — hashes password with argon2', async () => {
      const user = await AdminUser.create('admin@modula.com', 'password123');
      expect(user.email).toBe('admin@modula.com');
      // argon2 hashes start with $argon2
      const props = user.toProps();
      expect(props.passwordHash).toMatch(/^\$argon2/);
    });

    it('unit.admin-user.create.rejectsPlainText — throws if password too short', async () => {
      await expect(AdminUser.create('admin@modula.com', 'short')).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });
  });

  describe('unit.admin-user.verifyPassword', () => {
    it('unit.admin-user.verifyPassword.correctHash — returns true for correct password', async () => {
      const user = await AdminUser.create('admin@modula.com', 'password123');
      const result = await user.verifyPassword('password123');
      expect(result).toBe(true);
    });

    it('unit.admin-user.verifyPassword.wrongHash — returns false for wrong password', async () => {
      const user = await AdminUser.create('admin@modula.com', 'password123');
      const result = await user.verifyPassword('wrongpassword');
      expect(result).toBe(false);
    });
  });

  describe('unit.admin-user.deactivate', () => {
    it('returns a new instance with active=false', async () => {
      const user = await AdminUser.create('admin@modula.com', 'password123');
      expect(user.active).toBe(true);
      const deactivated = user.deactivate();
      expect(deactivated.active).toBe(false);
      // Original unchanged
      expect(user.active).toBe(true);
    });
  });
});
