import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestComponent } from '../TestComponent';

describe('TestComponent', () => {
  it('should render message correctly', () => {
    const testMessage = 'Hello World';
    render(<TestComponent message={testMessage} />);

    expect(screen.getByText(`Message: ${testMessage}`)).toBeInTheDocument();
  });

  it('should render test items list', () => {
    render(<TestComponent message='test' />);

    expect(screen.getByText('TypeScript interfaces')).toBeInTheDocument();
    expect(
      screen.getByText('Path aliases (@components/*)')
    ).toBeInTheDocument();
    expect(screen.getByText('Ant Design integration')).toBeInTheDocument();
  });

  it('should have proper card structure', () => {
    render(<TestComponent message='test' />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
