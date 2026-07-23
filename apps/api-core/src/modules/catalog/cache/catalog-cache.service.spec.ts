import { CatalogCacheService } from './catalog-cache.service';

describe('CatalogCacheService', () => {
  let redis: { get: jest.Mock; set: jest.Mock; keys: jest.Mock; del: jest.Mock };
  let service: CatalogCacheService;

  beforeEach(() => {
    redis = { get: jest.fn(), set: jest.fn(), keys: jest.fn(), del: jest.fn() };
    service = new CatalogCacheService(redis);
  });

  it('cache hit returns parsed data', async () => {
    redis.get.mockResolvedValue(JSON.stringify({ items: [{ id: 'p-1' }] }));
    const result = await service.get('key');
    expect(result).toEqual({ items: [{ id: 'p-1' }] });
  });

  it('cache miss returns null', async () => {
    redis.get.mockResolvedValue(null);
    expect(await service.get('key')).toBeNull();
  });

  it('set stores serialized value with TTL', async () => {
    await service.set('mykey', { items: [] });
    expect(redis.set).toHaveBeenCalledWith(
      'mykey', expect.any(String), 'EX', 60);
  });

  it('invalidateListings deletes all catalog:list:* keys', async () => {
    redis.keys.mockResolvedValue(['catalog:list:{}', 'catalog:list:{"category":"arches"}']);
    await service.invalidateListings();
    expect(redis.del).toHaveBeenCalledWith(
      'catalog:list:{}', 'catalog:list:{"category":"arches"}');
  });

  it('invalidateListings does nothing when no keys match', async () => {
    redis.keys.mockResolvedValue([]);
    await service.invalidateListings();
    expect(redis.del).not.toHaveBeenCalled();
  });
});
