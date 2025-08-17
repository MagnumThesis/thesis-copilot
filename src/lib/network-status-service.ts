/**
 * Network Status Service
 * 
 * Provides comprehensive network status monitoring and offline capabilities
 * for the proofreader tool with connection quality assessment and retry logic.
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastOnline?: Date;
  latency?: number;
  bandwidth?: 'high' | 'medium' | 'low';
}

export interface ConnectionTest {
  timestamp: Date;
  success: boolean;
  latency?: number;
  responseTime?: number;
  error?: string;
}

export type NetworkStatusCallback = (status: NetworkStatus) => void;

/**
 * Network Status Service for monitoring connection quality and managing offline state
 */
export class NetworkStatusService {
  private static instance: NetworkStatusService;
  private status: NetworkStatus = {
    isOnline: navigator.onLine,
    connectionQuality: 'excellent'
  };
  private callbacks: Set<NetworkStatusCallback> = new Set();
  private testInterval?: number;
  private connectionTests: ConnectionTest[] = [];
  private maxTestHistory = 10;

  private constructor() {
    this.setupEventListeners();
    this.startConnectionTesting();
  }

  public static getInstance(): NetworkStatusService {
    if (!NetworkStatusService.instance) {
      NetworkStatusService.instance = new NetworkStatusService();
    }
    return NetworkStatusService.instance;
  }

  private setupEventListeners(): void {
    // Setup online/offline event listeners if available
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatusChange(true));
      window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }
  }

  private startConnectionTesting(): void {
    // Start periodic connection testing
    this.testInterval = window.setInterval(() => {
      this.performConnectionTest();
    }, 30000); // Test every 30 seconds
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.status.isOnline = isOnline;
    if (!isOnline) {
      this.status.connectionQuality = 'offline';
      this.status.lastOnline = new Date();
    }
    this.notifyCallbacks();
  }

  private async performConnectionTest(): Promise<void> {
    const test = await this.testConnection();
    this.connectionTests.push(test);
    
    // Keep only recent tests
    if (this.connectionTests.length > this.maxTestHistory) {
      this.connectionTests.shift();
    }
    
    // Update status based on test results
    this.updateStatusFromTests();
  }

  private updateStatusFromTests(): void {
    const recentTests = this.connectionTests.slice(-5);
    const successfulTests = recentTests.filter(t => t.success);
    
    if (successfulTests.length === 0) {
      this.status.connectionQuality = 'offline';
      this.status.isOnline = false;
    } else {
      this.status.isOnline = true;
      const avgLatency = successfulTests.reduce((sum, t) => sum + (t.responseTime || 0), 0) / successfulTests.length;
      
      if (avgLatency < 100) {
        this.status.connectionQuality = 'excellent';
      } else if (avgLatency < 300) {
        this.status.connectionQuality = 'good';
      } else {
        this.status.connectionQuality = 'poor';
      }
      
      this.status.latency = avgLatency;
    }
    
    this.notifyCallbacks();
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to network status changes
   */
  public subscribe(callback: NetworkStatusCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Test network connectivity with latency measurement
   */
  public async testConnection(): Promise<ConnectionTest> {
    const startTime = Date.now();
    const test: ConnectionTest = {
      timestamp: new Date(),
      success: false
    };

    try {
      // Use a lightweight endpoint or create a small image request
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      test.success = response.ok;
      test.responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        test.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      test.success = false;
      test.responseTime = Date.now() - startTime;
      test.error = error instanceof Error ? error.message : 'Network connection failed';
    }

    return test;
  }
}

// Export singleton instance
export const networkStatusService = NetworkStatusService.getInstance();