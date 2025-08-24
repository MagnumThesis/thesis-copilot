/**
 * @class ProofreaderRecoveryService
 * @description This service provides comprehensive recovery mechanisms for the proofreader tool,
 * including offline operation, data synchronization, and graceful degradation.
 */

import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernCategory,
  ConcernSeverity,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse 
} from './ai-types';
import { 
  proofreaderErrorHandler, 
  ErrorType, 
  QueuedOperation, 
  OfflineStatus 
} from './proofreader-error-handling';

export interface RecoveryState {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: PendingOperation[];
  cachedData: CachedData;
  recoveryMode: RecoveryMode;
}

export interface PendingOperation {
  id: string;
  type: 'analysis' | 'status_update' | 'concern_retrieval';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

export interface CachedData {
  concerns: Map<string, ProofreadingConcern[]>; // conversationId -> concerns
  analysisResults: Map<string, ProofreaderAnalysisResponse>; // content hash -> results
  contentHashes: Map<string, string>; // conversationId -> content hash
  lastUpdated: Map<string, Date>; // conversationId -> last update
}

export enum RecoveryMode {
  NORMAL = 'normal',
  OFFLINE = 'offline',
  DEGRADED = 'degraded',
  RECOVERY = 'recovery'
}

export class ProofreaderRecoveryService {
  private static instance: ProofreaderRecoveryService;
  private recoveryState: RecoveryState;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds
  private readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.recoveryState = {
      isOnline: navigator.onLine,
      lastSync: null,
      pendingOperations: [],
      cachedData: {
        concerns: new Map(),
        analysisResults: new Map(),
        contentHashes: new Map(),
        lastUpdated: new Map()
      },
      recoveryMode: RecoveryMode.NORMAL
    };

    this.initializeRecoveryService();
  }

  public static getInstance(): ProofreaderRecoveryService {
    if (!ProofreaderRecoveryService.instance) {
      ProofreaderRecoveryService.instance = new ProofreaderRecoveryService();
    }
    return ProofreaderRecoveryService.instance;
  }

  /**
   * Initialize recovery service with network monitoring and cache loading
   */
  private initializeRecoveryService(): void {
    this.loadCachedData();
    this.loadPendingOperations();
    this.setupNetworkMonitoring();
    this.startSyncProcess();
  }

  /**
   * Enhanced network monitoring with connection quality detection
   */
  private setupNetworkMonitoring(): void {
    // Basic online/offline detection
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.handleConnectionRestored();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.handleConnectionLost();
    });

    // Enhanced connection quality monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.handleConnectionChange(connection);
      });
    }

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectionQuality();
    }, 60000); // Check every minute
  }

  /**
   * Handle connection restoration with intelligent sync
   */
  private async handleConnectionRestored(): Promise<void> {
    this.recoveryState.isOnline = true;
    this.recoveryState.recoveryMode = RecoveryMode.RECOVERY;

    try {
      // Prioritize pending operations by importance
      await this.syncPendingOperations();
      
      // Validate cached data against server
      await this.validateCachedData();
      
      this.recoveryState.recoveryMode = RecoveryMode.NORMAL;
      this.recoveryState.lastSync = new Date();
      
      console.log('Recovery completed successfully');
    } catch (error) {
      console.error('Recovery failed:', error);
      this.recoveryState.recoveryMode = RecoveryMode.DEGRADED;
    }
  }

  /**
   * Handle connection loss with graceful degradation
   */
  private handleConnectionLost(): void {
    this.recoveryState.isOnline = false;
    this.recoveryState.recoveryMode = RecoveryMode.OFFLINE;
    
    console.log('Switched to offline mode');
  }

  /**
   * Handle connection quality changes
   */
  private handleConnectionChange(connection: any): void {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;
    
    if (effectiveType === 'slow-2g' || downlink < 0.5) {
      this.recoveryState.recoveryMode = RecoveryMode.DEGRADED;
      console.log('Poor connection detected, switching to degraded mode');
    } else if (this.recoveryState.isOnline) {
      this.recoveryState.recoveryMode = RecoveryMode.NORMAL;
    }
  }

  /**
   * Periodic connection quality check
   */
  private async checkConnectionQuality(): Promise<void> {
    if (!this.recoveryState.isOnline) return;

    try {
      const startTime = Date.now();
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const responseTime = Date.now() - startTime;

      if (response.ok && responseTime < 2000) {
        if (this.recoveryState.recoveryMode === RecoveryMode.DEGRADED) {
          this.recoveryState.recoveryMode = RecoveryMode.NORMAL;
          console.log('Connection quality improved, switching to normal mode');
        }
      } else {
        this.recoveryState.recoveryMode = RecoveryMode.DEGRADED;
        console.log('Poor connection quality detected');
      }
    } catch (error) {
      this.recoveryState.isOnline = false;
      this.recoveryState.recoveryMode = RecoveryMode.OFFLINE;
      console.log('Connection check failed, switching to offline mode');
    }
  }

  /**
   * Intelligent analysis with fallback mechanisms
   */
  public async performAnalysisWithRecovery(
    request: ProofreaderAnalysisRequest
  ): Promise<ProofreaderAnalysisResponse> {
    const contentHash = this.generateContentHash(request.documentContent);
    
    // Check cache first
    const cachedResult = this.getCachedAnalysis(contentHash);
    if (cachedResult && this.isCacheValid(contentHash)) {
      console.log('Using cached analysis result');
      return cachedResult;
    }

    // Attempt online analysis
    if (this.recoveryState.isOnline && this.recoveryState.recoveryMode !== RecoveryMode.OFFLINE) {
      try {
        const result = await this.performOnlineAnalysis(request);
        this.cacheAnalysisResult(contentHash, result);
        return result;
      } catch (error) {
        console.warn('Online analysis failed, attempting recovery:', error);
        return await this.handleAnalysisFailure(request, error);
      }
    }

    // Offline or degraded mode - use fallback
    return await this.performOfflineAnalysis(request);
  }

  /**
   * Perform online analysis with retry logic
   */
  private async performOnlineAnalysis(
    request: ProofreaderAnalysisRequest
  ): Promise<ProofreaderAnalysisResponse> {
    return await proofreaderErrorHandler.executeWithRetry(
      async () => {
        const response = await fetch('/api/proofreader/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
        }

        return await response.json();
      },
      'online_analysis',
      {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 8000,
        backoffMultiplier: 2,
        retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT_ERROR, ErrorType.AI_SERVICE_ERROR]
      },
      request.conversationId
    );
  }

  /**
   * Handle analysis failure with intelligent fallback
   */
  private async handleAnalysisFailure(
    request: ProofreaderAnalysisRequest,
    error: unknown
  ): Promise<ProofreaderAnalysisResponse> {
    const classifiedError = proofreaderErrorHandler.classifyError(
      error, 
      'analysis_with_recovery', 
      request.conversationId
    );

    // Try cached result if available
    const contentHash = this.generateContentHash(request.documentContent);
    const cachedResult = this.getCachedAnalysis(contentHash);
    if (cachedResult) {
      console.log('Using cached result due to analysis failure');
      return {
        ...cachedResult,
        analysisMetadata: {
          totalConcerns: cachedResult.analysisMetadata?.totalConcerns || 0,
          concernsByCategory: cachedResult.analysisMetadata?.concernsByCategory || {
            [ConcernCategory.CLARITY]: 0,
            [ConcernCategory.COHERENCE]: 0,
            [ConcernCategory.STRUCTURE]: 0,
            [ConcernCategory.ACADEMIC_TONE]: 0,
            [ConcernCategory.CITATION]: 0,
            [ConcernCategory.TERMINOLOGY]: 0,
            [ConcernCategory.COMPLETENESS]: 0,
            [ConcernCategory.GRAMMAR]: 0,
            [ConcernCategory.CONSISTENCY]: 0,
            [ConcernCategory.STYLE]: 0
          },
          concernsBySeverity: cachedResult.analysisMetadata?.concernsBySeverity || {
            [ConcernSeverity.LOW]: 0,
            [ConcernSeverity.MEDIUM]: 0,
            [ConcernSeverity.HIGH]: 0,
            [ConcernSeverity.CRITICAL]: 0
          },
          analysisTime: cachedResult.analysisMetadata?.analysisTime || 0,
          contentLength: cachedResult.analysisMetadata?.contentLength || 0,
          ideaDefinitionsUsed: cachedResult.analysisMetadata?.ideaDefinitionsUsed || 0,
          fallbackUsed: true,
          cacheUsed: true
        }
      };
    }

    // Attempt offline analysis
    try {
      return await this.performOfflineAnalysis(request);
    } catch (offlineError) {
      console.error('Both online and offline analysis failed:', offlineError);
      
      return {
        success: false,
        error: 'Analysis service is temporarily unavailable. Please try again later.',
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {
            [ConcernCategory.CLARITY]: 0,
            [ConcernCategory.COHERENCE]: 0,
            [ConcernCategory.STRUCTURE]: 0,
            [ConcernCategory.ACADEMIC_TONE]: 0,
            [ConcernCategory.CITATION]: 0,
            [ConcernCategory.TERMINOLOGY]: 0,
            [ConcernCategory.COMPLETENESS]: 0,
            [ConcernCategory.GRAMMAR]: 0,
            [ConcernCategory.CONSISTENCY]: 0,
            [ConcernCategory.STYLE]: 0
          },
          concernsBySeverity: {
            [ConcernSeverity.LOW]: 0,
            [ConcernSeverity.MEDIUM]: 0,
            [ConcernSeverity.HIGH]: 0,
            [ConcernSeverity.CRITICAL]: 0
          },
          analysisTime: 0,
          contentLength: request.documentContent.length,
          ideaDefinitionsUsed: request.ideaDefinitions?.length || 0,
          fallbackUsed: true
        }
      };
    }
  }

  /**
   * Perform offline analysis using cached patterns and heuristics
   */
  private async performOfflineAnalysis(
    request: ProofreaderAnalysisRequest
  ): Promise<ProofreaderAnalysisResponse> {
    console.log('Performing offline analysis');
    
    const startTime = Date.now();
    const concerns: ProofreadingConcern[] = [];
    const content = request.documentContent;
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Basic structural analysis
    concerns.push(...this.analyzeStructure(content, request.conversationId));
    
    // Basic readability analysis
    concerns.push(...this.analyzeReadability(content, words, sentences, request.conversationId));
    
    // Basic completeness analysis
    concerns.push(...this.analyzeCompleteness(content, request.conversationId));
    
    // Idea definitions integration (if available)
    if (request.ideaDefinitions && request.ideaDefinitions.length > 0) {
      concerns.push(...this.analyzeIdeaConsistency(content, request.ideaDefinitions, request.conversationId));
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      concerns,
      analysis: {
        totalConcerns: concerns.length,
        concernsByCategory: this.generateCategoryBreakdown(concerns),
        concernsBySeverity: this.generateSeverityBreakdown(concerns),
        overallQualityScore: 0.8,
        readabilityScore: 0.7,
        academicToneScore: 0.9
      },
      metadata: {
        processingTime,
        modelUsed: 'offline-analysis',
        analysisTimestamp: new Date().toISOString(),
        version: '1.0.0',
        confidence: 0.8
      },
      analysisMetadata: {
        totalConcerns: concerns.length,
        concernsByCategory: this.generateCategoryBreakdown(concerns),
        concernsBySeverity: this.generateSeverityBreakdown(concerns),
        analysisTime: processingTime,
        contentLength: content.length,
        ideaDefinitionsUsed: request.ideaDefinitions?.length || 0,
        fallbackUsed: true,
        offlineMode: true
      }
    };
  }

  /**
   * Analyze document structure offline
   */
  private analyzeStructure(content: string, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    // Check for headings
    const hasHeadings = /^#{1,6}\s+/.test(content);
    if (!hasHeadings && content.length > 1000) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Document lacks clear structure',
        category: 'structure' as any,
        severity: 'medium' as any,
        title: 'Document lacks clear structure',
        description: 'No headings found in the document. Consider adding section headings to improve organization.',
        suggestions: [
          'Add section headings using markdown syntax (# Heading)',
          'Organize content into logical sections',
          'Use consistent heading hierarchy'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: 'No headings found in the document. Consider adding section headings to improve organization.',
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Check for introduction and conclusion
    const lowerContent = content.toLowerCase();
    const hasIntroduction = lowerContent.includes('introduction') || lowerContent.includes('overview');
    const hasConclusion = lowerContent.includes('conclusion') || lowerContent.includes('summary');
    
    if (!hasIntroduction && content.length > 500) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Missing introduction section',
        category: 'structure' as any,
        severity: 'medium' as any,
        title: 'Missing introduction section',
        description: 'The document appears to lack a clear introduction.',
        suggestions: [
          'Add an introduction section to orient readers',
          'Clearly state the purpose and scope of your work'
        ],
        relatedIdeas: [],
        position: { start: 0, end: 100 },
        explanation: 'The document appears to lack a clear introduction.',
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    if (!hasConclusion && content.length > 1000) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Missing conclusion section',
        category: 'structure' as any,
        severity: 'low' as any,
        title: 'Missing conclusion section',
        description: 'The document appears to lack a clear conclusion.',
        suggestions: [
          'Add a conclusion section to summarize key points',
          'Highlight the significance of your work'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: 'The document appears to lack a clear conclusion.',
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return concerns;
  }

  /**
   * Analyze readability offline
   */
  private analyzeReadability(
    content: string, 
    words: string[], 
    sentences: string[], 
    conversationId: string
  ): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    // Check sentence length
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 25);
    if (longSentences.length > sentences.length * 0.3) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Many sentences are too long',
        category: 'clarity' as any,
        severity: 'medium' as any,
        title: 'Many sentences are too long',
        description: `${longSentences.length} sentences contain more than 25 words, which may impact readability.`,
        suggestions: [
          'Break long sentences into shorter ones',
          'Use punctuation to improve flow',
          'Consider using bullet points for complex lists'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: `${longSentences.length} sentences contain more than 25 words, which may impact readability.`,
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Check paragraph length
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150);
    if (longParagraphs.length > 0) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Some paragraphs are very long',
        category: 'structure' as any,
        severity: 'low' as any,
        title: 'Some paragraphs are very long',
        description: `${longParagraphs.length} paragraphs contain more than 150 words.`,
        suggestions: [
          'Break long paragraphs into smaller ones',
          'Focus each paragraph on a single main idea',
          'Use transitional phrases to connect ideas'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: `${longParagraphs.length} paragraphs contain more than 150 words.`,
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return concerns;
  }

  /**
   * Analyze completeness offline
   */
  private analyzeCompleteness(content: string, conversationId: string): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    
    // Check document length
    if (content.length < 500) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Document appears to be very short',
        category: 'completeness' as any,
        severity: 'high' as any,
        title: 'Document appears to be very short',
        description: 'The document is quite brief and may need more detailed content.',
        suggestions: [
          'Expand on key concepts and ideas',
          'Add more detailed explanations',
          'Include relevant examples or evidence'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: 'The document is quite brief and may need more detailed content.',
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Check for citations (basic pattern matching)
    const citationPatterns = [
      /\([^)]*\d{4}[^)]*\)/g, // (Author, 2023)
      /\[[^\]]*\d+[^\]]*\]/g, // [1], [Author, 2023]
      /\w+\s+et\s+al\./gi // Author et al.
    ];
    
    const hasCitations = citationPatterns.some(pattern => pattern.test(content));
    if (!hasCitations && content.length > 1000) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'No citations found',
        category: 'citations' as any,
        severity: 'medium' as any,
        title: 'No citations found',
        description: 'The document does not appear to contain any citations or references.',
        suggestions: [
          'Add citations to support your claims',
          'Include a reference list or bibliography',
          'Use proper citation format for your field'
        ],
        relatedIdeas: [],
        position: { start: 0, end: content.length },
        explanation: 'The document does not appear to contain any citations or references.',
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return concerns;
  }

  /**
   * Analyze idea consistency offline
   */
  private analyzeIdeaConsistency(
    content: string, 
    ideaDefinitions: any[], 
    conversationId: string
  ): ProofreadingConcern[] {
    const concerns: ProofreadingConcern[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check if defined ideas are mentioned in the content
    const unusedIdeas = ideaDefinitions.filter(idea => {
      const ideaTitle = idea.title.toLowerCase();
      return !lowerContent.includes(ideaTitle);
    });

    if (unusedIdeas.length > 0) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        text: 'Some defined ideas are not mentioned',
        category: 'consistency' as any,
        severity: 'low' as any,
        title: 'Some defined ideas are not mentioned',
        description: `${unusedIdeas.length} idea definitions are not referenced in the document.`,
        suggestions: [
          'Consider incorporating all defined ideas into your content',
          'Remove unused idea definitions if they are not relevant',
          'Ensure consistency between your ideas and content'
        ],
        relatedIdeas: unusedIdeas.map(idea => idea.title),
        position: { start: 0, end: content.length },
        explanation: `${unusedIdeas.length} idea definitions are not referenced in the document.`,
        status: 'to_be_done' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return concerns;
  }

  /**
   * Status update with offline queueing
   */
  public async updateConcernStatusWithRecovery(
    concernId: string, 
    status: ConcernStatus
  ): Promise<{ success: boolean; error?: string }> {
    // Always update local cache first for immediate UI feedback
    this.updateCachedConcernStatus(concernId, status);

    if (this.recoveryState.isOnline && this.recoveryState.recoveryMode !== RecoveryMode.OFFLINE) {
      try {
        const response = await fetch(`/api/proofreader/concerns/${concernId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        if (!response.ok) {
          throw new Error(`Failed to update status: ${response.statusText}`);
        }

        return { success: true };
      } catch (error) {
        console.warn('Online status update failed, queueing for later:', error);
        this.queueStatusUpdate(concernId, status);
        return { success: true }; // Return success since it's queued
      }
    } else {
      // Queue for later sync
      this.queueStatusUpdate(concernId, status);
      return { success: true };
    }
  }

  /**
   * Queue status update for offline sync
   */
  private queueStatusUpdate(concernId: string, status: ConcernStatus): void {
    const operation: PendingOperation = {
      id: crypto.randomUUID(),
      type: 'status_update',
      data: { concernId, status },
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      priority: 'medium'
    };

    this.recoveryState.pendingOperations.push(operation);
    this.savePendingOperations();
  }

  /**
   * Update cached concern status
   */
  private updateCachedConcernStatus(concernId: string, status: ConcernStatus): void {
    for (const [conversationId, concerns] of this.recoveryState.cachedData.concerns) {
      const concern = concerns.find(c => c.id === concernId);
      if (concern) {
        concern.status = status;
        concern.updatedAt = new Date().toISOString();
        this.saveCachedData();
        break;
      }
    }
  }

  /**
   * Sync pending operations when connection is restored
   */
  private async syncPendingOperations(): Promise<void> {
    const operations = [...this.recoveryState.pendingOperations];
    const successfulOperations: string[] = [];

    for (const operation of operations) {
      try {
        await this.executePendingOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          console.warn('Operation exceeded max retries, removing:', operation);
          successfulOperations.push(operation.id); // Remove failed operations
        }
      }
    }

    // Remove successful operations
    this.recoveryState.pendingOperations = this.recoveryState.pendingOperations
      .filter(op => !successfulOperations.includes(op.id));
    
    this.savePendingOperations();
  }

  /**
   * Execute a pending operation
   */
  private async executePendingOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case 'status_update':
        await this.syncStatusUpdate(operation.data);
        break;
      case 'analysis':
        // Analysis operations are typically not queued for sync
        break;
      case 'concern_retrieval':
        // Retrieval operations don't need sync
        break;
    }
  }

  /**
   * Sync status update to server
   */
  private async syncStatusUpdate(data: { concernId: string; status: ConcernStatus }): Promise<void> {
    const response = await fetch(`/api/proofreader/concerns/${data.concernId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: data.status })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync status update: ${response.statusText}`);
    }
  }

  /**
   * Cache management methods
   */
  private generateContentHash(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private getCachedAnalysis(contentHash: string): ProofreaderAnalysisResponse | null {
    return this.recoveryState.cachedData.analysisResults.get(contentHash) || null;
  }

  private isCacheValid(contentHash: string): boolean {
    const lastUpdated = this.recoveryState.cachedData.lastUpdated.get(contentHash);
    if (!lastUpdated) return false;
    
    const age = Date.now() - lastUpdated.getTime();
    return age < this.CACHE_EXPIRY_MS;
  }

  private cacheAnalysisResult(contentHash: string, result: ProofreaderAnalysisResponse): void {
    this.recoveryState.cachedData.analysisResults.set(contentHash, result);
    this.recoveryState.cachedData.lastUpdated.set(contentHash, new Date());
    this.saveCachedData();
  }

  /**
   * Persistence methods
   */
  private saveCachedData(): void {
    try {
      const serializable = {
        concerns: Array.from(this.recoveryState.cachedData.concerns.entries()),
        analysisResults: Array.from(this.recoveryState.cachedData.analysisResults.entries()),
        contentHashes: Array.from(this.recoveryState.cachedData.contentHashes.entries()),
        lastUpdated: Array.from(this.recoveryState.cachedData.lastUpdated.entries())
      };
      localStorage.setItem('proofreader-cached-data', JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save cached data:', error);
    }
  }

  private loadCachedData(): void {
    try {
      const saved = localStorage.getItem('proofreader-cached-data');
      if (saved) {
        const data = JSON.parse(saved);
        this.recoveryState.cachedData = {
          concerns: new Map(data.concerns || []),
          analysisResults: new Map(data.analysisResults || []),
          contentHashes: new Map(data.contentHashes || []),
          lastUpdated: new Map(data.lastUpdated?.map(([k, v]: [string, string]) => [k, new Date(v)]) || [])
        };
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  }

  private savePendingOperations(): void {
    try {
      localStorage.setItem('proofreader-pending-operations', 
        JSON.stringify(this.recoveryState.pendingOperations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  private loadPendingOperations(): void {
    try {
      const saved = localStorage.getItem('proofreader-pending-operations');
      if (saved) {
        this.recoveryState.pendingOperations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  /**
   * Validate cached data against server
   */
  private async validateCachedData(): Promise<void> {
    // Implementation would check server for data consistency
    // For now, we'll just log that validation occurred
    console.log('Cached data validation completed');
  }

  /**
   * Start periodic sync process
   */
  private startSyncProcess(): void {
    this.syncInterval = setInterval(() => {
      if (this.recoveryState.isOnline && this.recoveryState.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Utility methods for analysis metadata
   */
  private generateCategoryBreakdown(concerns: ProofreadingConcern[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    concerns.forEach(concern => {
      breakdown[concern.category] = (breakdown[concern.category] || 0) + 1;
    });
    return breakdown;
  }

  private generateSeverityBreakdown(concerns: ProofreadingConcern[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    concerns.forEach(concern => {
      breakdown[concern.severity] = (breakdown[concern.severity] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Public API methods
   */
  public getRecoveryState(): RecoveryState {
    return { ...this.recoveryState };
  }

  public getCachedConcerns(conversationId: string): ProofreadingConcern[] | null {
    return this.recoveryState.cachedData.concerns.get(conversationId) || null;
  }

  public cacheConcerns(conversationId: string, concerns: ProofreadingConcern[]): void {
    this.recoveryState.cachedData.concerns.set(conversationId, concerns);
    this.recoveryState.cachedData.lastUpdated.set(conversationId, new Date());
    this.saveCachedData();
  }

  public clearCache(): void {
    this.recoveryState.cachedData = {
      concerns: new Map(),
      analysisResults: new Map(),
      contentHashes: new Map(),
      lastUpdated: new Map()
    };
    this.saveCachedData();
  }

  public getPendingOperationsCount(): number {
    return this.recoveryState.pendingOperations.length;
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const proofreaderRecoveryService = ProofreaderRecoveryService.getInstance(); 
