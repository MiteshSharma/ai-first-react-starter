import { TestStore } from '@stores/TestStore';

// Simple store instance for testing
const testStore = new TestStore();

/**
 * @hook useTestStore
 * @description Hook to access the test store
 * @returns {TestStore} The test store instance
 */
export const useTestStore = (): TestStore => testStore;
