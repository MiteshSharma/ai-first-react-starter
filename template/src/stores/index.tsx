import React from 'react';
import { TestStore } from './TestStore';

/**
 * Root store that combines all individual stores
 */
export class RootStore {
  public testStore: TestStore;

  constructor() {
    this.testStore = new TestStore();
  }
}

// Create store instance
const rootStore = new RootStore();

// Create React context for the store
const StoreContext = React.createContext<RootStore>(rootStore);

/**
 * Provider component to wrap your app
 */
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StoreContext.Provider value={rootStore}>
    {children}
  </StoreContext.Provider>
);

/**
 * Hook to access the root store
 */
export const useStore = (): RootStore => {
  const store = React.useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

// Export individual stores for direct access if needed
export { TestStore } from './TestStore';

export default rootStore;