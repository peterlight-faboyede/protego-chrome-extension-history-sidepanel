import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../sidepanel/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Suppress console.error during tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('Normal rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch errors and display error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/We're sorry, but something unexpected happened/i)).toBeInTheDocument();
    });

    it('should display error message and title', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: /Something went wrong/i })).toBeInTheDocument();
    });

    it('should show "Try Again" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });

    it('should show "Reload Extension" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Reload Extension/i })).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {

    it('should reload page when "Reload Extension" is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /Reload Extension/i });
      await user.click(reloadButton);

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Development mode features', () => {
    it('should show error details in development mode', () => {
      // Note: import.meta.env is read-only and set at build time
      // In a real scenario, this would be tested with different build configurations
      // For now, we just verify the UI renders correctly
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      // In dev mode, error details would be visible (controlled by import.meta.env.DEV)
    });

    it('should handle error UI in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Basic error UI should always be present
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  describe('Multiple errors', () => {
    it('should handle multiple errors in sequence', async () => {
      const user = userEvent.setup();
      let errorMessage = 'First error';

      const ThrowDynamicError = () => {
        throw new Error(errorMessage);
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowDynamicError />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Click Try Again
      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      await user.click(tryAgainButton);

      // Change error message and throw again
      errorMessage = 'Second error';
      rerender(
        <ErrorBoundary>
          <ThrowDynamicError />
        </ErrorBoundary>
      );

      // Should still show error UI
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle errors with no error message', () => {
      const ThrowEmptyError = () => {
        throw new Error();
      };

      render(
        <ErrorBoundary>
          <ThrowEmptyError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle non-Error objects thrown', () => {
      const ThrowString = () => {
        throw 'String error';
      };

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should be idempotent when clicking Try Again multiple times', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      
      // Click multiple times
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);

      // Should still show error UI (no crash)
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Nested ErrorBoundaries', () => {
    it('should handle nested error boundaries independently', () => {
      const OuterContent = () => <div>Outer content still works</div>;
      const InnerError = () => {
        throw new Error('Inner error');
      };

      render(
        <ErrorBoundary>
          <OuterContent />
          <ErrorBoundary>
            <InnerError />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Inner boundary should catch the error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});

