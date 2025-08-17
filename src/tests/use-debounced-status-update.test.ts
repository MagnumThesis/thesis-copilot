/**
 * Debounced Status Update Hook Tests
 * Tests for the debounced status update hook implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedStatusUpdate, useOptimisticStatusUpdate } from '../hooks/use-debounced-status-update';
import { ConcernStatus } from '../lib/ai-types';

describe('useDebouncedStatusUpdate', () => {
  let mockUpdateFn: vi.MockedFunction<(concernId: string, status: ConcernStatus) => Promi