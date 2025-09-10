import { TestStore } from '../TestStore';

describe('TestStore', () => {
  let testStore: TestStore;

  beforeEach(() => {
    testStore = new TestStore();
  });

  it('should initialize with count 0', () => {
    expect(testStore.count).toBe(0);
  });

  it('should increment count', () => {
    testStore.increment();
    expect(testStore.count).toBe(1);
  });

  it('should decrement count', () => {
    testStore.decrement();
    expect(testStore.count).toBe(-1);
  });

  it('should reset count to 0', () => {
    testStore.increment();
    testStore.increment();
    expect(testStore.count).toBe(2);

    testStore.reset();
    expect(testStore.count).toBe(0);
  });
});
