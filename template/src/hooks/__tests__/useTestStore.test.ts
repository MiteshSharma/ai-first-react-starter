import { TestStore } from '@stores/TestStore';
import { useTestStore } from '../useTestStore';

describe('useTestStore', () => {
  it('should return TestStore instance', () => {
    const store = useTestStore();
    expect(store).toBeInstanceOf(TestStore);
  });

  it('should return the same store instance on multiple calls', () => {
    const store1 = useTestStore();
    const store2 = useTestStore();
    expect(store1).toBe(store2);
  });

  it('should have working store methods', () => {
    const store = useTestStore();
    expect(store.count).toBe(0);

    store.increment();
    expect(store.count).toBe(1);
  });
});
