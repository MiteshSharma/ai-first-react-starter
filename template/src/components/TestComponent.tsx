import React from 'react';
import { Card } from 'antd';

/**
 * @component TestComponent
 * @description A test component to verify TypeScript, ESLint and path aliases
 * @category Test Components
 * @param {string} message - The message to display
 * @example
 * <TestComponent message="Hello World" />
 */
interface TestComponentProps {
  message: string;
}

export const TestComponent: React.FC<TestComponentProps> = ({ message }) => (
  <Card title='Test Component' style={{ marginTop: 16 }}>
    <p>Message: {message}</p>
    <p>This component tests:</p>
    <ul>
      <li>TypeScript interfaces</li>
      <li>Path aliases (@components/*)</li>
      <li>Ant Design integration</li>
      <li>JSDoc documentation</li>
    </ul>
  </Card>
);
