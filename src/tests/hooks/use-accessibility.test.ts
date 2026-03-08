import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  useAccessibility,
  useFocusRestore,
  useLiveRegion,
  useSkipLinks,
} from '../../hooks/use-accessibility';

describe('use-accessibility hooks', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.body.className = '';
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('useAccessibility', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('detects user preferences via matchMedia', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.preferences).toEqual({
        prefersReducedMotion: true,
        prefersHighContrast: false,
        prefersColorScheme: 'dark',
        fontSize: 'medium'
      });
    });

    it('updates preferences when media query changes', () => {
      const listeners: Record<string, EventListener[]> = {};

      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: false,
          media: query,
          addEventListener: (event: string, listener: EventListener) => {
            if (!listeners[query]) listeners[query] = [];
            listeners[query].push(listener);
          },
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.preferences.prefersReducedMotion).toBe(false);

      act(() => {
        window.matchMedia = vi.fn().mockImplementation((query) => {
          return {
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
          };
        });

        listeners['(prefers-reduced-motion: reduce)']?.forEach(listener => listener({} as Event));
      });

      expect(result.current.preferences.prefersReducedMotion).toBe(true);
    });

    it('announces messages by creating and removing a live region', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('Test message', 'assertive');
      });

      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.textContent).toBe('Test message');
      expect(result.current.announcements).toContain('Test message');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
    });

    it('does not announce if announceChanges is false', () => {
      const { result } = renderHook(() => useAccessibility({ announceChanges: false }));

      act(() => {
        result.current.announce('Test message');
      });

      expect(document.querySelector('[aria-live]')).toBeNull();
      expect(result.current.announcements).not.toContain('Test message');
    });

    it('traps focus within a container', () => {
      const { result } = renderHook(() => useAccessibility());

      const container = document.createElement('div');
      const firstInput = document.createElement('input');
      const secondInput = document.createElement('input');
      const lastInput = document.createElement('input');

      container.appendChild(firstInput);
      container.appendChild(secondInput);
      container.appendChild(lastInput);
      document.body.appendChild(container);

      let cleanup: () => void;
      act(() => {
        cleanup = result.current.trapFocus(container);
      });

      expect(document.activeElement).toBe(firstInput);

      lastInput.focus();
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      Object.defineProperty(tabEvent, 'preventDefault', { value: vi.fn() });
      act(() => {
        container.dispatchEvent(tabEvent);
      });

      expect(tabEvent.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(firstInput);

      firstInput.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
      Object.defineProperty(shiftTabEvent, 'preventDefault', { value: vi.fn() });
      act(() => {
        container.dispatchEvent(shiftTabEvent);
      });

      expect(shiftTabEvent.preventDefault).toHaveBeenCalled();
      expect(document.activeElement).toBe(lastInput);

      act(() => {
        cleanup();
      });
    });

    it('returns accessibility classes based on preferences', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useAccessibility());

      expect(result.current.getAccessibilityClasses()).toBe('motion-reduce high-contrast color-scheme-no-preference font-size-medium');
    });

    it('does not return classes if options disable them', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      const { result } = renderHook(() => useAccessibility({ respectMotionPreferences: false, respectContrastPreferences: false }));

      expect(result.current.getAccessibilityClasses()).toBe('color-scheme-no-preference font-size-medium');
    });

    it('generates unique ids', () => {
      const { result } = renderHook(() => useAccessibility());
      const id1 = result.current.generateId();
      const id2 = result.current.generateId('custom');

      expect(id1).toMatch(/^a11y-[a-z0-9]+$/);
      expect(id2).toMatch(/^custom-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('applies and cleans up classes on document.body based on preferences', () => {
      const listeners: Record<string, EventListener[]> = {};

      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: high)',
          media: query,
          addEventListener: (event: string, listener: EventListener) => {
            if (!listeners[query]) listeners[query] = [];
            listeners[query].push(listener);
          },
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      renderHook(() => useAccessibility());

      // Should have initial classes applied
      expect(document.body.classList.contains('motion-reduce')).toBe(true);
      expect(document.body.classList.contains('high-contrast')).toBe(true);
      expect(document.body.classList.contains('color-scheme-no-preference')).toBe(true);
      expect(document.body.classList.contains('font-size-medium')).toBe(true);

      act(() => {
        // Change matchMedia to light mode and no contrast/motion reduce
        window.matchMedia = vi.fn().mockImplementation((query) => {
          return {
            matches: query === '(prefers-color-scheme: light)',
            media: query,
          };
        });

        listeners['(prefers-reduced-motion: reduce)']?.forEach(listener => listener({} as Event));
        listeners['(prefers-contrast: high)']?.forEach(listener => listener({} as Event));
        listeners['(prefers-color-scheme: light)']?.forEach(listener => listener({} as Event));
      });

      // Assert side-effects on document.body.classList
      expect(document.body.classList.contains('motion-reduce')).toBe(false);
      expect(document.body.classList.contains('high-contrast')).toBe(false);
      expect(document.body.classList.contains('color-scheme-light')).toBe(true);
      expect(document.body.classList.contains('color-scheme-no-preference')).toBe(false);
      expect(document.body.classList.contains('font-size-medium')).toBe(true);
    });

    it('respects options when applying classes to document.body', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: query === '(prefers-reduced-motion: reduce)' || query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });
      window.matchMedia = mockMatchMedia;

      renderHook(() => useAccessibility({ respectMotionPreferences: false, respectContrastPreferences: false }));

      expect(document.body.classList.contains('motion-reduce')).toBe(false);
      expect(document.body.classList.contains('high-contrast')).toBe(false);
      expect(document.body.classList.contains('color-scheme-no-preference')).toBe(true);
    });
  });

  describe('useFocusRestore', () => {
    it('saves and restores focus', () => {
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      document.body.appendChild(button1);
      document.body.appendChild(button2);

      button1.focus();
      expect(document.activeElement).toBe(button1);

      const { result } = renderHook(() => useFocusRestore());

      act(() => {
        result.current.saveFocus();
      });

      button2.focus();
      expect(document.activeElement).toBe(button2);

      act(() => {
        result.current.restoreFocus();
      });

      expect(document.activeElement).toBe(button1);

      button2.focus();
      act(() => {
        result.current.restoreFocus();
      });
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('useLiveRegion', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('creates and manages a live region', () => {
      const { result, unmount } = renderHook(() => useLiveRegion());

      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.classList.contains('sr-only')).toBe(true);

      act(() => {
        result.current.announce('Test live region', 'assertive');
      });

      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
      expect(liveRegion?.textContent).toBe('Test live region');

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(liveRegion?.textContent).toBe('');

      unmount();

      expect(document.querySelector('[aria-live]')).toBeNull();
    });
  });

  describe('useSkipLinks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('shows skip links on Tab and hides on blur', () => {
      const targets = [{ id: 'main', label: 'Skip to main' }];
      const { result } = renderHook(() => useSkipLinks(targets));

      expect(result.current.isVisible).toBe(false);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      act(() => {
        document.dispatchEvent(tabEvent);
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        document.dispatchEvent(new FocusEvent('focusout'));
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('skips to target element', () => {
      const target = document.createElement('div');
      target.id = 'main-content';
      target.tabIndex = -1;
      target.scrollIntoView = vi.fn();
      document.body.appendChild(target);

      const targets = [{ id: 'main-content', label: 'Skip to main' }];
      const { result } = renderHook(() => useSkipLinks(targets));

      act(() => {
        result.current.skipTo('main-content');
      });

      expect(document.activeElement).toBe(target);
      expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });
  });
});
