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
      const response = await fetch('/api/hea