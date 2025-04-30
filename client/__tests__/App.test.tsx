import React from 'react';
import { render } from '@testing-library/react-native';
import App from '@/App';

// Mock any dependencies that might cause issues
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });
});
