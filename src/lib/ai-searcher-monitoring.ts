/**
 * AI Searcher Monitoring and Logging Service
 * 
 * This module provides comprehensive monitoring, logging, and alerting
 * capabilities for the AI-powered reference searcher system.
 */

import {
  AISearcherError,
  AISearcherErrorType,
  AISearcherErrorSeverity,
  ErrorMetrics
} from './ai-searcher-error-handling';

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'info' | 'performance' | 'user_action';
  category: 'search' | 'content_extraction' | 'query_generation' | 'fallback' | 'system';
  message: string;
  data?: any;
  conversationId?: string;
  sessionId?: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

export interface PerformanceMetrics {
  operationType: string;
  duration: number;
  success: boolean;
  retryCount: number;
  fallbackUsed: boolean;
  degradedMode: boolean;
  timestamp: Date;
  context?: any;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: ErrorMetrics, events: MonitoringEvent[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // minutes
  lastTriggered?: Date;
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'log' | 'email' | 'webhook' | 'user_notification';
  config: any;
}

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionPeriod: number; // days
  batchSize: number;
  flushInterval: number; // milliseconds
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableAlerts: boolean;
  maxEventsInMemory: number;
}

/**
 * AI Searcher Monitoring Service
 */
export class AISearcherMonitoringService {
  private static instance: AISearcherMonitoringService;
  private config: MonitoringConfig;
  private events: MonitoringEvent[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private errorMetrics: ErrorMetrics;

  private constructor(config: MonitoringConfig) {
    this.config = config;
    this.errorMetrics = this.initializeErrorMetrics();
    this.initializeDefaultAlertRules();
    
    if (config.enabled) {
      this.startPeriodicFlush();
    }
  }

  public static getInstance(config?: MonitoringConfig): AISearcherMonitoringService {
    if (!AISearcherMonitoringService.instance) {
      const defaultConfig: MonitoringConfig = {
        enabled: true,
        logLevel: 'info',
        retentionPeriod: 30,
        batchSize: 100,
        flushInterval: 30000, // 30 seconds
        enablePerformanceTracking: true,
        enableUserTracking: true,
        enableAlerts: true,
        maxEventsInMemory: 1000
      };
      
      AISearcherMonitoringService.instance = new AISearcherMonitoringService(
        config || defaultConfig
      );
    }
    return AISearcherMonitoringService.instance;
  }

  /**
   * Log an error event
   */
  public logError(error: AISearcherError): void {
    if (!this.config.enabled) return;

    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'error',
      category: this.getCategoryFromOperation(error.operation),
      message: error.message,
      data: {
        errorType: error.type,
        severity: error.severity,
        operation: error.operation,
        retryable: error.retryable,
        recoveryActions: error.recoveryActions.length,
        fallbackAvailable: error.fallbackAvailable,
        context: error.context
      },
      conversationId: error.conversationId,
      sessionId: error.sessionId,
      severity: this.mapSeverity(error.severity),
      tags: [
        'error',
        error.type,
        error.operation,
        error.severity
      ]
    };

    this.addEvent(event);
    this.updateErrorMetrics(error);
    this.checkAlertRules();
  }

  /**
   * Log a performance metric
   */
  public logPerformance(metric: PerformanceMetrics): void {
    if (!this.config.enabled || !this.config.enablePerformanceTracking) return;

    this.performanceMetrics.push(metric);

    // Also create a monitoring event for significant performance issues
    if (metric.duration > 30000 || metric.retryCount > 2) {
      const event: MonitoringEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        type: 'performance',
        category: this.getCategoryFromOperation(metric.operationType),
        message: `Slow operation: ${metric.operationType} took ${metric.duration}ms`,
        data: metric,
        severity: metric.duration > 60000 ? 'high' : 'medium',
        tags: [
          'performance',
          'slow',
          metric.operationType,
          metric.success ? 'success' : 'failure'
        ]
      };

      this.addEvent(event);
    }

    // Trim performance metrics if too many
    if (this.performanceMetrics.length > this.config.maxEventsInMemory) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.config.maxEventsInMemory / 2);
    }
  }

  /**
   * Log a user action
   */
  public logUserAction(
    action: string,
    data?: any,
    conversationId?: string,
    sessionId?: string,
    userId?: string
  ): void {
    if (!this.config.enabled || !this.config.enableUserTracking) return;

    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'user_action',
      category: 'system',
      message: `User action: ${action}`,
      data,
      conversationId,
      sessionId,
      userId,
      severity: 'low',
      tags: ['user_action', action]
    };

    this.addEvent(event);
  }

  /**
   * Log a warning
   */
  public logWarning(
    message: string,
    category: MonitoringEvent['category'],
    data?: any,
    context?: {
      conversationId?: string;
      sessionId?: string;
      userId?: string;
    }
  ): void {
    if (!this.config.enabled) return;

    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'warning',
      category,
      message,
      data,
      conversationId: context?.conversationId,
      sessionId: context?.sessionId,
      userId: context?.userId,
      severity: 'medium',
      tags: ['warning', category]
    };

    this.addEvent(event);
  }

  /**
   * Log an info message
   */
  public logInfo(
    message: string,
    category: MonitoringEvent['category'],
    data?: any,
    context?: {
      conversationId?: string;
      sessionId?: string;
      userId?: string;
    }
  ): void {
    if (!this.config.enabled || this.config.logLevel === 'error') return;

    const event: MonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'info',
      category,
      message,
      data,
      conversationId: context?.conversationId,
      sessionId: context?.sessionId,
      userId: context?.userId,
      severity: 'low',
      tags: ['info', category]
    };

    this.addEvent(event);
  }

  /**
   * Get current error metrics
   */
  public getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Get performance metrics summary
   */
  public getPerformanceMetrics(
    operationType?: string,
    timeRange?: { start: Date; end: Date }
  ): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
    retryRate: number;
    fallbackRate: number;
    degradedModeRate: number;
  } {
    let metrics = this.performanceMetrics;

    if (operationType) {
      metrics = metrics.filter(m => m.operationType === operationType);
    }

    if (timeRange) {
      metrics = metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (metrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
        retryRate: 0,
        fallbackRate: 0,
        degradedModeRate: 0
      };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = metrics.filter(m => m.success).length;
    const retryCount = metrics.filter(m => m.retryCount > 0).length;
    const fallbackCount = metrics.filter(m => m.fallbackUsed).length;
    const degradedCount = metrics.filter(m => m.degradedMode).length;

    return {
      averageDuration: totalDuration / metrics.length,
      successRate: successCount / metrics.length,
      totalOperations: metrics.length,
      retryRate: retryCount / metrics.length,
      fallbackRate: fallbackCount / metrics.length,
      degradedModeRate: degradedCount / metrics.length
    };
  }

  /**
   * Get recent events
   */
  public getRecentEvents(
    limit: number = 100,
    type?: MonitoringEvent['type'],
    category?: MonitoringEvent['category'],
    severity?: MonitoringEvent['severity']
  ): MonitoringEvent[] {
    let events = [...this.events];

    if (type) {
      events = events.filter(e => e.type === type);
    }

    if (category) {
      events = events.filter(e => e.category === category);
    }

    if (severity) {
      events = events.filter(e => e.severity === severity);
    }

    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  public removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  /**
   * Get alert rules
   */
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.flushTimer) {
      this.startPeriodicFlush();
    } else if (!this.config.enabled && this.flushTimer) {
      this.stopPeriodicFlush();
    }
  }

  /**
   * Flush events to persistent storage
   */
  public async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // In a real implementation, this would send events to a logging service
      // For now, we'll just log them to console based on log level
      const eventsToFlush = [...this.events];
      this.events = [];

      for (const event of eventsToFlush) {
        if (this.shouldLogEvent(event)) {
          this.logEventToConsole(event);
        }
      }

      // Also persist to localStorage for debugging (in browser environment)
      if (typeof localStorage !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('ai-searcher-logs') || '[]');
        const newLogs = [...existingLogs, ...eventsToFlush].slice(-1000); // Keep last 1000 events
        localStorage.setItem('ai-searcher-logs', JSON.stringify(newLogs));
      }

    } catch (error) {
      console.error('Failed to flush monitoring events:', error);
    }
  }

  /**
   * Clear all events and metrics
   */
  public clear(): void {
    this.events = [];
    this.performanceMetrics = [];
    this.errorMetrics = this.initializeErrorMetrics();
  }

  /**
   * Get system health status
   */
  public getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    metrics: {
      errorRate: number;
      averageResponseTime: number;
      fallbackRate: number;
      degradedModeRate: number;
    };
  } {
    const recentEvents = this.getRecentEvents(100);
    const recentErrors = recentEvents.filter(e => e.type === 'error');
    const recentPerformance = this.getPerformanceMetrics();

    const errorRate = recentErrors.length / Math.max(recentEvents.length, 1);
    const issues: string[] = [];

    // Check for issues
    if (errorRate > 0.1) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    if (recentPerformance.averageDuration > 30000) {
      issues.push(`Slow response times: ${(recentPerformance.averageDuration / 1000).toFixed(1)}s average`);
    }

    if (recentPerformance.fallbackRate > 0.2) {
      issues.push(`High fallback usage: ${(recentPerformance.fallbackRate * 100).toFixed(1)}%`);
    }

    if (recentPerformance.degradedModeRate > 0.1) {
      issues.push(`Degraded mode active: ${(recentPerformance.degradedModeRate * 100).toFixed(1)}%`);
    }

    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'degraded' : 'unhealthy';

    return {
      status,
      issues,
      metrics: {
        errorRate,
        averageResponseTime: recentPerformance.averageDuration,
        fallbackRate: recentPerformance.fallbackRate,
        degradedModeRate: recentPerformance.degradedModeRate
      }
    };
  }

  // Private methods

  private addEvent(event: MonitoringEvent): void {
    this.events.push(event);

    // Trim events if too many
    if (this.events.length > this.config.maxEventsInMemory) {
      this.events = this.events.slice(-this.config.maxEventsInMemory / 2);
    }
  }

  private updateErrorMetrics(error: AISearcherError): void {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsByType[error.type] = (this.errorMetrics.errorsByType[error.type] || 0) + 1;
    this.errorMetrics.errorsBySeverity[error.severity] = (this.errorMetrics.errorsBySeverity[error.severity] || 0) + 1;

    // Update most common errors
    this.updateMostCommonErrors();
  }

  private updateMostCommonErrors(): void {
    const errorCounts = Object.entries(this.errorMetrics.errorsByType)
      .map(([type, count]) => ({
        type: type as AISearcherErrorType,
        count,
        percentage: (count / this.errorMetrics.totalErrors) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.errorMetrics.mostCommonErrors = errorCounts;
  }

  private checkAlertRules(): void {
    if (!this.config.enableAlerts) return;

    const now = new Date();
    const recentEvents = this.getRecentEvents(1000);

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownPeriod * 60 * 1000) {
          continue;
        }
      }

      // Check condition
      if (rule.condition(this.errorMetrics, recentEvents)) {
        this.triggerAlert(rule);
        rule.lastTriggered = now;
      }
    }
  }

  private triggerAlert(rule: AlertRule): void {
    console.warn(`Alert triggered: ${rule.name}`);

    for (const action of rule.actions) {
      try {
        this.executeAlertAction(action, rule);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  private executeAlertAction(action: AlertAction, rule: AlertRule): void {
    switch (action.type) {
      case 'log':
        console.error(`ALERT: ${rule.name} - ${rule.severity}`);
        break;
      case 'user_notification':
        // In a real implementation, this would show a user notification
        console.warn(`User notification: ${rule.name}`);
        break;
      case 'webhook':
        // In a real implementation, this would send a webhook
        console.log(`Webhook would be sent for alert: ${rule.name}`);
        break;
      case 'email':
        // In a real implementation, this would send an email
        console.log(`Email would be sent for alert: ${rule.name}`);
        break;
    }
  }

  private initializeDefaultAlertRules(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics, events) => {
        const recentErrors = events.filter(e => 
          e.type === 'error' && 
          e.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
        );
        return recentErrors.length > 10;
      },
      severity: 'high',
      cooldownPeriod: 15,
      enabled: true,
      actions: [
        { type: 'log', config: {} },
        { type: 'user_notification', config: { message: 'High error rate detected' } }
      ]
    });

    // Service unavailable alert
    this.addAlertRule({
      id: 'service_unavailable',
      name: 'Service Unavailable',
      condition: (metrics, events) => {
        const serviceErrors = events.filter(e => 
          e.type === 'error' && 
          e.data?.errorType === AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR &&
          e.timestamp.getTime() > Date.now() - 2 * 60 * 1000 // Last 2 minutes
        );
        return serviceErrors.length > 3;
      },
      severity: 'critical',
      cooldownPeriod: 10,
      enabled: true,
      actions: [
        { type: 'log', config: {} },
        { type: 'user_notification', config: { message: 'Search service is unavailable' } }
      ]
    });

    // High degraded mode usage alert
    this.addAlertRule({
      id: 'high_degraded_mode',
      name: 'High Degraded Mode Usage',
      condition: (metrics, events) => {
        const performanceMetrics = this.getPerformanceMetrics();
        return performanceMetrics.degradedModeRate > 0.3; // More than 30%
      },
      severity: 'medium',
      cooldownPeriod: 30,
      enabled: true,
      actions: [
        { type: 'log', config: {} }
      ]
    });
  }

  private initializeErrorMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: {} as Record<AISearcherErrorType, number>,
      errorsBySeverity: {} as Record<AISearcherErrorSeverity, number>,
      retrySuccessRate: 0,
      fallbackSuccessRate: 0,
      averageRecoveryTime: 0,
      mostCommonErrors: []
    };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCategoryFromOperation(operation: string): MonitoringEvent['category'] {
    if (operation.includes('search')) return 'search';
    if (operation.includes('content') || operation.includes('extract')) return 'content_extraction';
    if (operation.includes('query') || operation.includes('generate')) return 'query_generation';
    if (operation.includes('fallback')) return 'fallback';
    return 'system';
  }

  private mapSeverity(severity: AISearcherErrorSeverity): MonitoringEvent['severity'] {
    switch (severity) {
      case AISearcherErrorSeverity.LOW: return 'low';
      case AISearcherErrorSeverity.MEDIUM: return 'medium';
      case AISearcherErrorSeverity.HIGH: return 'high';
      case AISearcherErrorSeverity.CRITICAL: return 'critical';
      default: return 'medium';
    }
  }

  private shouldLogEvent(event: MonitoringEvent): boolean {
    switch (this.config.logLevel) {
      case 'error':
        return event.type === 'error';
      case 'warn':
        return event.type === 'error' || event.type === 'warning';
      case 'info':
        return event.type === 'error' || event.type === 'warning' || event.type === 'info';
      case 'debug':
        return true;
      default:
        return true;
    }
  }

  private logEventToConsole(event: MonitoringEvent): void {
    const logMessage = `[AI-Searcher] ${event.message}`;
    const logData = {
      id: event.id,
      timestamp: event.timestamp,
      category: event.category,
      severity: event.severity,
      tags: event.tags,
      data: event.data
    };

    switch (event.type) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warning':
        console.warn(logMessage, logData);
        break;
      case 'info':
        console.info(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
        break;
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
}

export default AISearcherMonitoringService;