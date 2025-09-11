import { useStore } from '../stores';

/**
 * @hook useTestStore
 * @description Hook to access the test store from context
 * @returns {TestStore} The test store instance
 */
export const useTestStore = () => {
  const rootStore = useStore();
  return rootStore.testStore;
};
