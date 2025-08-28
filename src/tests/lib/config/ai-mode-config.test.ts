import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  AIModeManagerConfig
} from './ai-mode-config';

describe('ai-mode-config', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      const expectedConfig: Required<AIModeManagerConfig> = {
        maxRetries: 3,
        timeout: 30000,
        debounceMs: 300,
        enableGracefulDegradation: true,
        showErrorNotifications: true,
        enableCaching: true,
        enableOptimisticUpdates: true,
        enableContextOptimization: true,
      };

      expect(DEFAULT_CONFIG).toEqual(expectedConfig);
    });
  });
});