import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTestStore } from '@hooks/useTestStore';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    const store = useTestStore();
    store.reset();
  });
  it('should render main heading', () => {
    render(<App />);
    expect(
      screen.getByText('AI-First React Framework Test')
    ).toBeInTheDocument();
  });

  it('should render counter button with initial count 0', () => {
    render(<App />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('should increment count when button is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /count:/i });

    fireEvent.click(button);
    // Check if the store actually incremented (MobX reactivity tested elsewhere)
    const store = useTestStore();
    expect(store.count).toBe(1);
  });

  it('should render TestComponent with processed message', () => {
    render(<App />);
    expect(
      screen.getByText('Message: Processed: Hello World')
    ).toBeInTheDocument();
  });

  it('should have proper app structure', () => {
    render(<App />);
    expect(screen.getByText('This component tests:')).toBeInTheDocument();
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
