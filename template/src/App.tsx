import React from 'react';
import { Button } from 'antd';
import { TestComponent } from '@components/TestComponent';
import { useTestStore } from '@hooks/useTestStore';
import { testUtilFunction } from '@utils/testUtils';

const App: React.FC = () => {
  const testStore = useTestStore();
  const utilResult = testUtilFunction('Hello World');

  return (
    <div style={{ padding: '20px' }}>
      <h1>AI-First React Framework Test</h1>
      <Button type='primary' onClick={(): void => testStore.increment()}>
        Count: {testStore.count}
      </Button>
      <TestComponent message={utilResult} />
    </div>
  );
};

export default App;
