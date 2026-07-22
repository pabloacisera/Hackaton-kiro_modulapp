import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisMock: {
    incr: jest.Mock;
    expire: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(() => {
    redisMock = {
      incr: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };
    service = new RateLimitService(redisMock);
  });

  it('unit.rate-limit.incrementAndCount — increment returns correct count', async () => {
    redisMock.incr.mockResolvedValue(3);

    const count = await service.increment('test-key', 900);

    expect(redisMock.incr).toHaveBeenCalledWith('test-key');
    // expire is only called when count === 1
    expect(redisMock.expire).not.toHaveBeenCalled();
    expect(count).toBe(3);
  });

  it('unit.rate-limit.incrementAndCount — sets expire on first increment', async () => {
    redisMock.incr.mockResolvedValue(1);

    const count = await service.increment('test-key', 900);

    expect(redisMock.incr).toHaveBeenCalledWith('test-key');
    expect(redisMock.expire).toHaveBeenCalledWith('test-key', 900);
    expect(count).toBe(1);
  });

  it('unit.rate-limit.blocksAfterMaxAttempts — isBlocked returns true when count >= 5', async () => {
    redisMock.get.mockResolvedValue('5');

    const blocked = await service.isBlocked('test-key', 5);

    expect(blocked).toBe(true);
  });

  it('unit.rate-limit.blocksAfterMaxAttempts — isBlocked returns false when count < 5', async () => {
    redisMock.get.mockResolvedValue('4');

    const blocked = await service.isBlocked('test-key', 5);

    expect(blocked).toBe(false);
  });

  it('unit.rate-limit.resetsAfterWindow — reset deletes the key', async () => {
    redisMock.del.mockResolvedValue(1);

    await service.reset('test-key');

    expect(redisMock.del).toHaveBeenCalledWith('test-key');
  });
});
