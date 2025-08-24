/**
 * Accessibility Hook
 * Provides accessibility utilities and preferences detection
 */

import { useEffect, useState, useCallback } from 'react';

export interface AccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: 'light' | 'dark' | 'no-preference';
  fontSize: 'small' | 'medium' | 'large';
}

export interface AccessibilityOptions {
  announceChanges?: boolean;
  respectMotionPreferences?: boolean;
  respectContrastPreferences?: boolean;
  enableKeyboardTraps?: boolean;
}

/**
 * Hook for managing accessibility preferences and utilities
 */
/**
 * @function useAccessibility
 * @description Hook for managing accessibility preferences and utilities.
 * @param {AccessibilityOptions} [options={}] - Options for accessibility features.
 * @returns {{preferences: AccessibilityPreferences, announce: (message: string, priority?: 'polite' | 'assertive') => void, trapFocus: (container: HTMLElement) => () => void, getAccessibilityClasses: () => string, generateId: (prefix?: string) => string, announcements: string[]}}
 * - `preferences`: Current accessibility preferences.
 * - `announce`: Function to announce messages to screen readers.
 * - `trapFocus`: Function to trap focus within a given container.
 * - `getAccessibilityClasses`: Function to get CSS classes based on preferences.
 * - `generateId`: Function to generate unique IDs for ARIA relationships.
 * - `announcements`: List of announcements made.
 */
export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    announceChanges = true,
    respectMotionPreferences = true,
    respectContrastPreferences = true,
    enableKeyboardTraps = true
  } = options;

  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersColorScheme: 'no-preference',
    fontSize: 'medium'
  });

  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Detect user preferences
  useEffect(() => {
    const updatePreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      
      let prefersColorScheme: 'light' | 'dark' | 'no-preference' = 'no-preference';
      if (prefersDark) prefersColorScheme = 'dark';
      else if (prefersLight) prefersColorScheme = 'light';

      setPreferences(prev => ({
        ...prev,
        prefersReducedMotion,
        prefersHighContrast,
        prefersColorScheme
      }));
    };

    updatePreferences();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-color-scheme: light)')
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences));
    };
  }, []);

  // Announce changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    setAnnouncements(prev => [...prev, message]);

    // Create temporary live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'sr-only');
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, [announceChanges]);

  // Focus management utilities
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!enableKeyboardTraps) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardTraps]);

  // Get accessible classes based on preferences
  const getAccessibilityClasses = useCallback(() => {
    const classes: string[] = [];

    if (respectMotionPreferences && preferences.prefersReducedMotion) {
      classes.push('motion-reduce');
    }

    if (respectContrastPreferences && preferences.prefersHighContrast) {
      classes.push('high-contrast');
    }

    classes.push(`color-scheme-${preferences.prefersColorScheme}`);
    classes.push(`font-size-${preferences.fontSize}`);

    return classes.join(' ');
  }, [preferences, respectMotionPreferences, respectContrastPreferences]);

  // Generate unique IDs for ARIA relationships
  const generateId = useCallback((prefix: string = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  return {
    preferences,
    announce,
    trapFocus,
    getAccessibilityClasses,
    generateId,
    announcements
  };
}

/**
 * Hook for managing focus restoration
 */
/**
 * @function useFocusRestore
 * @description Hook for managing focus restoration.
 * @returns {{saveFocus: () => void, restoreFocus: () => void}}
 * - `saveFocus`: Function to save the currently focused element.
 * - `restoreFocus`: Function to restore focus to the previously saved element.
 */
export function useFocusRestore() {
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    setPreviousFocus(document.activeElement as HTMLElement);
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
    setPreviousFocus(null);
  }, [previousFocus]);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for managing live regions
 */
/**
 * @function useLiveRegion
 * @description Hook for managing live regions.
 * @returns {{announce: (message: string, priority?: 'polite' | 'assertive') => void}}
 * - `announce`: Function to announce messages in the live region.
 */
export function useLiveRegion() {
  const [liveRegion, setLiveRegion] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create persistent live region
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    region.setAttribute('class', 'sr-only');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';

    document.body.appendChild(region);
    setLiveRegion(region);

    return () => {
      if (document.body.contains(region)) {
        document.body.removeChild(region);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegion) return;

    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [liveRegion]);

  return { announce };
}

/**
 * Hook for skip links functionality
 */
/**
 * @function useSkipLinks
 * @description Hook for skip links functionality.
 * @param {Array<{ id: string; label: string }>} targets - An array of target elements for skip links.
 * @returns {{isVisible: boolean, skipTo: (targetId: string) => void, targets: Array<{ id: string; label: string }>}}
 * - `isVisible`: Whether the skip links are visible.
 * - `skipTo`: Function to skip to a target element.
 * - `targets`: The target elements for skip links.
 */
export function useSkipLinks(targets: Array<{ id: string; label: string }>) {
  const [isVisible, setIsVisible] = useState(false);

  const skipTo = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Show skip links on Tab key
    if (event.key === 'Tab' && !event.shiftKey) {
      setIsVisible(true);
    }
  }, []);

  const handleBlur = useCallback(() => {
    // Hide skip links when focus moves away
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isSkipLink = activeElement?.closest('[data-skip-link]');
      if (!isSkipLink) {
        setIsVisible(false);
      }
    }, 100);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [handleKeyDown, handleBlur]);

  return {
    isVisible,
    skipTo,
    targets
  };
}