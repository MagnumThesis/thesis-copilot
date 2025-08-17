/**
 * Keyboard Navigation Hook
 * Provides keyboard navigation functionality for concern management
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface KeyboardNavigationOptions {
  items: Array<{ id: string; element?: HTMLElement }>;
  onActivate?: (id: string, index: number) => void;
  onEscape?: () => void;
  loop?: boolean; // Whether to loop from last to first item
  orientation?: 'horizontal' | 'vertical' | 'both';
  disabled?: boolean;
}

export interface KeyboardNavigationResult {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  registerItem: (id: string, element: HTMLElement) => void;
  unregisterItem: (id: string) => void;
}

/**
 * Hook for managing keyboard navigation in lists and grids
 */
export function useKeyboardNavigation(
  options: KeyboardNavigationOptions
): KeyboardNavigationResult {
  const {
    items,
    onActivate,
    onEscape,
    loop = true,
    orientation = 'vertical',
    disabled = false
  } = options;

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Register/unregister items
  const registerItem = useCallback((id: string, element: HTMLElement) => {
    itemRefs.current.set(id, element);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemRefs.current.delete(id);
  }, []);

  // Focus management functions
  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      const item = items[index];
      const element = itemRefs.current.get(item.id) || item.element;
      if (element) {
        element.focus();
        setFocusedIndex(index);
      }
    }
  }, [items]);

  const focusNext = useCallback(() => {
    if (disabled || items.length === 0) return;
    
    let nextIndex = focusedIndex + 1;
    if (nextIndex >= items.length) {
      nextIndex = loop ? 0 : items.length - 1;
    }
    focusItem(nextIndex);
  }, [focusedIndex, items.length, loop, disabled, focusItem]);

  const focusPrevious = useCallback(() => {
    if (disabled || items.length === 0) return;
    
    let prevIndex = focusedIndex - 1;
    if (prevIndex < 0) {
      prevIndex = loop ? items.length - 1 : 0;
    }
    focusItem(prevIndex);
  }, [focusedIndex, items.length, loop, disabled, focusItem]);

  const focusFirst = useCallback(() => {
    if (disabled || items.length === 0) return;
    focusItem(0);
  }, [disabled, items.length, focusItem]);

  const focusLast = useCallback(() => {
    if (disabled || items.length === 0) return;
    focusItem(items.length - 1);
  }, [disabled, items.length, focusItem]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    const { key, ctrlKey, metaKey } = event;
    const isModified = ctrlKey || metaKey;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          focusNext();
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          focusPrevious();
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          focusNext();
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          focusPrevious();
        }
        break;

      case 'Home':
        event.preventDefault();
        focusFirst();
        break;

      case 'End':
        event.preventDefault();
        focusLast();
        break;

      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < items.length) {
          event.preventDefault();
          const item = items[focusedIndex];
          onActivate?.(item.id, focusedIndex);
        }
        break;

      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;

      // Page navigation
      case 'PageDown':
        if (!isModified) {
          event.preventDefault();
          const jumpSize = Math.min(10, Math.floor(items.length / 4));
          const nextIndex = Math.min(items.length - 1, focusedIndex + jumpSize);
          focusItem(nextIndex);
        }
        break;

      case 'PageUp':
        if (!isModified) {
          event.preventDefault();
          const jumpSize = Math.min(10, Math.floor(items.length / 4));
          const prevIndex = Math.max(0, focusedIndex - jumpSize);
          focusItem(prevIndex);
        }
        break;
    }
  }, [
    disabled,
    orientation,
    focusedIndex,
    items,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    onActivate,
    onEscape,
    focusItem
  ]);

  // Update focused index when items change
  useEffect(() => {
    if (focusedIndex >= items.length) {
      setFocusedIndex(items.length > 0 ? items.length - 1 : -1);
    }
  }, [items.length, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    handleKeyDown,
    registerItem,
    unregisterItem
  };
}

/**
 * Hook for roving tabindex pattern
 */
export function useRovingTabIndex(
  items: Array<{ id: string; disabled?: boolean }>,
  defaultFocusedIndex: number = 0
) {
  const [focusedIndex, setFocusedIndex] = useState(defaultFocusedIndex);

  const getTabIndex = useCallback((index: number) => {
    return index === focusedIndex ? 0 : -1;
  }, [focusedIndex]);

  const getAriaSelected = useCallback((index: number) => {
    return index === focusedIndex;
  }, [focusedIndex]);

  const moveFocus = useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    const enabledItems = items.map((item, index) => ({ ...item, index }))
      .filter(item => !item.disabled);

    if (enabledItems.length === 0) return;

    let newIndex: number;
    const currentEnabledIndex = enabledItems.findIndex(item => item.index === focusedIndex);

    switch (direction) {
      case 'next':
        newIndex = currentEnabledIndex < enabledItems.length - 1 
          ? enabledItems[currentEnabledIndex + 1].index
          : enabledItems[0].index;
        break;
      case 'previous':
        newIndex = currentEnabledIndex > 0 
          ? enabledItems[currentEnabledIndex - 1].index
          : enabledItems[enabledItems.length - 1].index;
        break;
      case 'first':
        newIndex = enabledItems[0].index;
        break;
      case 'last':
        newIndex = enabledItems[enabledItems.length - 1].index;
        break;
      default:
        return;
    }

    setFocusedIndex(newIndex);
  }, [items, focusedIndex]);

  return {
    focusedIndex,
    setFocusedIndex,
    getTabIndex,
    getAriaSelected,
    moveFocus
  };
}