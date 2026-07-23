import { CatalogEventPublisher } from './catalog-event.publisher';

describe('CatalogEventPublisher', () => {
  let publisher: CatalogEventPublisher;

  beforeEach(() => { publisher = new CatalogEventPublisher(); });

  it('emits prototype.updated event with correct payload', (done) => {
    publisher.events$.subscribe((event) => {
      expect(event.type).toBe('prototype.updated');
      expect(event.payload.id).toBe('p-1');
      expect(event.payload.priceUsd).toBe(199.99);
      done();
    });
    publisher.publishUpdated('p-1', 199.99, 5);
  });

  it('emits prototype.deactivated event', (done) => {
    publisher.events$.subscribe((event) => {
      expect(event.type).toBe('prototype.deactivated');
      expect(event.payload.id).toBe('p-2');
      expect(event.payload.active).toBe(false);
      done();
    });
    publisher.publishDeactivated('p-2');
  });
});
