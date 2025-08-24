/**
 * Debounced Status Update Hook
 * Provides debounced status updates for proofreader concerns
 */

import { useCallback, useRef, useEffect } from 'react';
import { ConcernStatus } from '@/lib/ai-types';

export interface DebouncedStatusUpdateOptions {
  delay?: number; // Debounce delay in milliseconds
  maxWait?: number; // Maximum wait time before forcing update
  batchSize?: number; // Maximum number of updates to batch together
}

export interface StatusUpdateEntry {
  concernId: string;
  status: ConcernStatus;
  timestamp: number;
  retryCount: number;
}

/**
 * Hook for debounced status updates with batching and retry logic
 */
/**
 * @function useDebouncedStatusUpdate
 * @description Hook for debounced status updates with batching and retry logic.
 * @param {(concernId: string, status: ConcernStatus) => Promise<void>} updateFn - The function to call for updating the status.
 * @param {DebouncedStatusUpdateOptions} [options={}] - Options for debouncing and batching.
 * @returns {{debouncedUpdate: (concernId: string, status: ConcernStatus) => void, immediateUpdate: (concernId: string, status: ConcernStatus) => Promise<void>, flushUpdates: () => Promise<void>, cancelUpdates: () => void, getPendingInfo: () => {pendingCount: number, isProcessing: boolean, pendingConcerns: string[]}}}
 * - `debouncedUpdate`: A debounced function to update the status of a concern.
 * - `immediateUpdate`: A function to immediately update the status of a concern, bypassing debouncing.
 * - `flushUpdates`: A function to immediately process all pending updates in the queue.
 * - `cancelUpdates`: A function to cancel all pending updates and clear the queue.
 * - `getPendingInfo`: A function to get information about pending updates.
 */
export function useDebouncedStatusUpdate(
  updateFn: (concernId: string, status: ConcernStatus) => Promise<void>,
  options: DebouncedStatusUpdateOptions = {}
) {
  const {
    delay = 500,
    maxWait = 2000,
    batchSize = 10
  } = options;

  const updateQueue = useRef<Map<string, StatusUpdateEntry>>(new Map());
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const maxWaitTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isProcessing = useRef<boolean>(false);

  // Process batched updates
  const processBatch = useCallback(async () => {
    if (isProcessing.current || updateQueue.current.size === 0) {
      return;
    }

    isProcessing.current = true;

    try {
      // Get updates to process (up to batchSize)
      const updates = Array.from(updateQueue.current.values())
        .slice(0, batchSize);

      if (updates.length === 0) {
        return;
      }

      // Process updates in parallel with individual error handling
      const promises = updates.map(async (update) => {
        try {
          await updateFn(update.concernId, update.status);
          updateQueue.current.delete(update.concernId);
          
          // Clear timers for successful updates
          const timer = timers.current.get(update.concernId);
          const maxWaitTimer = maxWaitTimers.current.get(update.concernId);
          
          if (timer) {
            clearTimeout(timer);
            timers.current.delete(update.concernId);
          }
          
          if (maxWaitTimer) {
            clearTimeout(maxWaitTimer);
            maxWaitTimers.current.delete(update.concernId);
          }
          
        } catch (error) {
          console.error(`Status update failed for concern ${update.concernId}:`, error);
          
          // Implement retry logic
          update.retryCount++;
          
          if (update.retryCount < 3) {
            // Keep in queue for retry with exponential backoff
            const retryDelay = delay * Math.pow(2, update.retryCount);
            
            setTimeout(() => {
              if (updateQueue.current.has(update.concernId)) {
                processBatch();
              }
            }, retryDelay);
          } else {
            // Remove after max retries
            updateQueue.current.delete(update.concernId);
            console.error(`Status update failed after 3 retries for concern ${update.concernId}`);
          }
        }
      });

      await Promise.allSettled(promises);

      // Process remaining updates if any
      if (updateQueue.current.size > 0) {
        setTimeout(processBatch, 100);
      }

    } finally {
      isProcessing.current = false;
    }
  }, [updateFn, delay, batchSize]);

  // Debounced update function
  const debouncedUpdate = useCallback((concernId: string, status: ConcernStatus) => {
    // Add or update entry in queue
    updateQueue.current.set(concernId, {
      concernId,
      status,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Clear existing timers for this concern
    const existingTimer = timers.current.get(concernId);
    const existingMaxWaitTimer = maxWaitTimers.current.get(concernId);
    
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    if (existingMaxWaitTimer) {
      clearTimeout(existingMaxWaitTimer);
    }

    // Set up debounce timer
    const timer = setTimeout(() => {
      timers.current.delete(concernId);
      processBatch();
    }, delay);
    
    timers.current.set(concernId, timer);

    // Set up max wait timer to ensure updates don't wait too long
    const maxWaitTimer = setTimeout(() => {
      maxWaitTimers.current.delete(concernId);
      
      // Clear debounce timer and force processing
      const debounceTimer = timers.current.get(concernId);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        timers.current.delete(concernId);
      }
      
      processBatch();
    }, maxWait);
    
    maxWaitTimers.current.set(concernId, maxWaitTimer);

  }, [delay, maxWait, processBatch]);

  // Immediate update function (bypasses debouncing)
  const immediateUpdate = useCallback(async (concernId: string, status: ConcernStatus) => {
    // Remove from queue if exists
    updateQueue.current.delete(concernId);
    
    // Clear timers
    const timer = timers.current.get(concernId);
    const maxWaitTimer = maxWaitTimers.current.get(concernId);
    
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(concernId);
    }
    
    if (maxWaitTimer) {
      clearTimeout(maxWaitTimer);
      maxWaitTimers.current.delete(concernId);
    }

    // Execute immediately
    try {
      await updateFn(concernId, status);
    } catch (error) {
      console.error(`Immediate status update failed for concern ${concernId}:`, error);
      throw error;
    }
  }, [updateFn]);

  // Flush all pending updates
  const flushUpdates = useCallback(async () => {
    // Clear all timers
    for (const timer of timers.current.values()) {
      clearTimeout(timer);
    }
    for (const timer of maxWaitTimers.current.values()) {
      clearTimeout(timer);
    }
    
    timers.current.clear();
    maxWaitTimers.current.clear();

    // Process all remaining updates
    while (updateQueue.current.size > 0 && !isProcessing.current) {
      await processBatch();
    }
  }, [processBatch]);

  // Cancel all pending updates
  const cancelUpdates = useCallback(() => {
    // Clear all timers
    for (const timer of timers.current.values()) {
      clearTimeout(timer);
    }
    for (const timer of maxWaitTimers.current.values()) {
      clearTimeout(timer);
    }
    
    timers.current.clear();
    maxWaitTimers.current.clear();
    updateQueue.current.clear();
  }, []);

  // Get pending updates info
  const getPendingInfo = useCallback(() => {
    return {
      pendingCount: updateQueue.current.size,
      isProcessing: isProcessing.current,
      pendingConcerns: Array.from(updateQueue.current.keys())
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelUpdates();
    };
  }, [cancelUpdates]);

  return {
    debouncedUpdate,
    immediateUpdate,
    flushUpdates,
    cancelUpdates,
    getPendingInfo
  };
}

/**
 * Hook for optimistic status updates with rollback capability
 */
/**
 * @function useOptimisticStatusUpdate
 * @description Hook for optimistic status updates with rollback capability.
 * @param {(concernId: string, status: ConcernStatus) => Promise<void>} updateFn - The function to call for updating the status.
 * @param {(concernId: string, status: ConcernStatus) => void} [onOptimisticUpdate] - Callback function to be called immediately when an optimistic update is applied.
 * @param {(concernId: string, previousStatus: ConcernStatus) => void} [onRollback] - Callback function to be called when an optimistic update needs to be rolled back.
 * @returns {{optimisticUpdate: (concernId: string, newStatus: ConcernStatus, previousStatus: ConcernStatus) => Promise<void>, optimisticImmediateUpdate: (concernId: string, newStatus: ConcernStatus, previousStatus: ConcernStatus) => Promise<void>, flushUpdates: () => Promise<void>, cancelUpdates: () => void, getPendingInfo: () => {pendingCount: number, isProcessing: boolean, pendingConcerns: string[]}, getPendingOptimisticUpdates: () => string[]}}
 * - `optimisticUpdate`: A function to perform an optimistic status update with debouncing.
 * - `optimisticImmediateUpdate`: A function to perform an optimistic status update immediately.
 * - `flushUpdates`: A function to immediately process all pending updates in the queue.
 * - `cancelUpdates`: A function to cancel all pending updates and clear the queue.
 * - `getPendingInfo`: A function to get information about pending updates.
 * - `getPendingOptimisticUpdates`: A function to get a list of concern IDs that have pending optimistic updates.
 */
export function useOptimisticStatusUpdate(
  updateFn: (concernId: string, status: ConcernStatus) => Promise<void>,
  onOptimisticUpdate?: (concernId: string, status: ConcernStatus) => void,
  onRollback?: (concernId: string, previousStatus: ConcernStatus) => void
) {
  const pendingUpdates = useRef<Map<string, ConcernStatus>>(new Map());
  
  const {
    debouncedUpdate,
    immediateUpdate,
    flushUpdates,
    cancelUpdates,
    getPendingInfo
  } = useDebouncedStatusUpdate(updateFn);

  const optimisticUpdate = useCallback(async (
    concernId: string, 
    newStatus: ConcernStatus,
    previousStatus: ConcernStatus
  ) => {
    // Store previous status for potential rollback
    pendingUpdates.current.set(concernId, previousStatus);
    
    // Apply optimistic update immediately
    onOptimisticUpdate?.(concernId, newStatus);

    try {
      // Perform actual update
      await debouncedUpdate(concernId, newStatus);
      
      // Remove from pending on success
      pendingUpdates.current.delete(concernId);
      
    } catch (error) {
      // Rollback on failure
      const rollbackStatus = pendingUpdates.current.get(concernId);
      if (rollbackStatus) {
        onRollback?.(concernId, rollbackStatus);
        pendingUpdates.current.delete(concernId);
      }
      
      throw error;
    }
  }, [debouncedUpdate, onOptimisticUpdate, onRollback]);

  const optimisticImmediateUpdate = useCallback(async (
    concernId: string, 
    newStatus: ConcernStatus,
    previousStatus: ConcernStatus
  ) => {
    // Store previous status for potential rollback
    pendingUpdates.current.set(concernId, previousStatus);
    
    // Apply optimistic update immediately
    onOptimisticUpdate?.(concernId, newStatus);

    try {
      // Perform actual update immediately
      await immediateUpdate(concernId, newStatus);
      
      // Remove from pending on success
      pendingUpdates.current.delete(concernId);
      
    } catch (error) {
      // Rollback on failure
      const rollbackStatus = pendingUpdates.current.get(concernId);
      if (rollbackStatus) {
        onRollback?.(concernId, rollbackStatus);
        pendingUpdates.current.delete(concernId);
      }
      
      throw error;
    }
  }, [immediateUpdate, onOptimisticUpdate, onRollback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingUpdates.current.clear();
    };
  }, []);

  return {
    optimisticUpdate,
    optimisticImmediateUpdate,
    flushUpdates,
    cancelUpdates,
    getPendingInfo,
    getPendingOptimisticUpdates: () => Array.from(pendingUpdates.current.keys())
  };
}