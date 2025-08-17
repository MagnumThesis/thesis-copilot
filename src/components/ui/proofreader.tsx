"use client"

import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { Button } from "@/components/ui/shadcn/button"
import { Skeleton } from "@/components/ui/shadcn/skeleton"
import { Badge } from "@/components/ui/shadcn/badge"
import { AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { ConcernList } from "./concern-list"
import { AnalysisProgress } from "./analysis-progress"
import { ProofreadingConcern, ConcernStatus, ProofreaderAnalysisRequest, ProofreaderAnalysisResponse } from "@/lib/ai-types"
import { contentRetrievalService } from "@/lib/content-retrieval-service"
import { proofreaderErrorHandler, ErrorType } from "@/lib/proofreader-error-handling"
import { proofreaderRecoveryService, RecoveryMode } from "@/lib/proofreader-recovery-service"

interface ProofreaderProps {
  isOpen: boolean
  onClose: () => void
  currentConversation: { title: string; id: string }
}

interface ProofreaderState {
  concerns: ProofreadingConcern[]
  isAnalyzing: boolean
  lastAnalyzed: Date | null
  statusFilter: ConcernStatus | 'all'
  error: string | null
  analysisProgress: number
  analysisStatusMessage: string
  integrationStatus: {
    builderIntegration: {
      connected: boolean;
      hasContent: boolean;
      lastSync?: Date;
    };
    idealistIntegration: {
      connected: boolean;
      ideaCount: number;
      lastSync?: Date;
    };
  } | null
  recoveryState: {
    isOnline: boolean;
    recoveryMode: RecoveryMode;
    pendingOperations: number;
    lastSync: Date | null;
    cacheUsed: boolean;
  }
  errorHistory: Array<{
    timestamp: Date;
    type: ErrorType;
    message: string;
    operation: string;
  }>
}

export const Proofreader: React.FC<ProofreaderProps> = ({ 
  isOpen, 
  onClose, 
  currentConversation 
}) => {
  const [state, setState] = useState<ProofreaderState>({
    concerns: [],
    isAnalyzing: false,
    lastAnalyzed: null,
    statusFilter: 'all',
    error: null,
    analysisProgress: 0,
    analysisStatusMessage: 'Ready to analyze',
    integrationStatus: null,
    recoveryState: {
      isOnline: navigator.onLine,
      recoveryMode: RecoveryMode.NORMAL,
      pendingOperations: 0,
      lastSync: null,
      cacheUsed: false
    },
    errorHistory: []
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [retryCount, setRetryCount] = useState<number>(0)

  // Load existing concerns and check integration status when component mounts or when sheet opens
  useEffect(() => {
    if (isOpen) {
      loadConcerns()
      checkIntegrationStatus()
      updateRecoveryState()
    }
  }, [isOpen, currentConversation.id])

  // Monitor recovery state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOpen) {
        updateRecoveryState()
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [isOpen])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        recoveryState: {
          ...prev.recoveryState,
          isOnline: true
        }
      }))
      toast.success('Connection restored')
    }

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        recoveryState: {
          ...prev.recoveryState,
          isOnline: false,
          recoveryMode: RecoveryMode.OFFLINE
        }
      }))
      toast.warning('Working offline - changes will sync when connection is restored')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Set up content change subscription for real-time updates
  useEffect(() => {
    if (!isOpen) return

    const unsubscribe = contentRetrievalService.subscribeToContentChanges(
      currentConversation.id,
      (summary) => {
        // Update integration status when content changes
        checkIntegrationStatus()
        
        // If we have concerns and content has changed significantly, suggest re-analysis
        if (state.concerns.length > 0 && summary.hasContent) {
          setState(prev => ({
            ...prev,
            analysisStatusMessage: 'Content may have changed - consider re-analyzing'
          }))
        }
      }
    )

    return unsubscribe
  }, [isOpen, currentConversation.id, state.concerns.length])

  // Cleanup effect to cancel ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const loadConcerns = async () => {
    try {
      setLoading(true)
      setState(prev => ({ ...prev, error: null }))
      
      // Try to load from cache first if offline
      const cachedConcerns = proofreaderRecoveryService.getCachedConcerns(currentConversation.id)
      if (!navigator.onLine && cachedConcerns) {
        setState(prev => ({
          ...prev,
          concerns: cachedConcerns,
          lastAnalyzed: cachedConcerns.length > 0 ? new Date() : null,
          recoveryState: {
            ...prev.recoveryState,
            cacheUsed: true
          }
        }))
        toast.info(`Loaded ${cachedConcerns.length} concerns from cache (offline mode)`)
        setLoading(false)
        return
      }
      
      // Fetch existing concerns from API with error handling
      const response = await proofreaderErrorHandler.executeWithRetry(
        async () => {
          const res = await fetch(`/api/proofreader/concerns/${currentConversation.id}`)
          if (!res.ok) {
            throw new Error(`Failed to load concerns: ${res.statusText}`)
          }
          return res
        },
        'load_concerns',
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          retryableErrors: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT_ERROR]
        },
        currentConversation.id
      )
      
      const data = await response.json()
      const concerns: ProofreadingConcern[] = data.concerns || []
      
      // Cache the concerns for offline use
      proofreaderRecoveryService.cacheConcerns(currentConversation.id, concerns)
      
      setState(prev => ({
        ...prev,
        concerns,
        lastAnalyzed: concerns.length > 0 ? new Date() : null,
        recoveryState: {
          ...prev.recoveryState,
          cacheUsed: false
        }
      }))
      setRetryCount(0)
      
      if (concerns.length > 0) {
        toast.success(`Loaded ${concerns.length} existing concern${concerns.length === 1 ? '' : 's'}`)
      }
    } catch (err: any) {
      const classifiedError = proofreaderErrorHandler.classifyError(err, 'load_concerns', currentConversation.id)
      
      // Add to error history
      setState(prev => ({
        ...prev,
        errorHistory: [
          {
            timestamp: new Date(),
            type: classifiedError.type,
            message: classifiedError.message,
            operation: 'load_concerns'
          },
          ...prev.errorHistory.slice(0, 9) // Keep last 10 errors
        ]
      }))
      
      // Try cached data as fallback
      const cachedConcerns = proofreaderRecoveryService.getCachedConcerns(currentConversation.id)
      if (cachedConcerns) {
        setState(prev => ({
          ...prev,
          concerns: cachedConcerns,
          lastAnalyzed: cachedConcerns.length > 0 ? new Date() : null,
          error: null,
          recoveryState: {
            ...prev.recoveryState,
            cacheUsed: true
          }
        }))
        toast.warning(`Using cached data due to connection issues (${cachedConcerns.length} concerns)`)
      } else {
        setState(prev => ({ ...prev, error: classifiedError.userMessage }))
        toast.error(classifiedError.userMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const checkIntegrationStatus = async () => {
    try {
      const integrationStatus = await contentRetrievalService.getIntegrationStatus(currentConversation.id)
      setState(prev => ({ ...prev, integrationStatus }))
    } catch (error) {
      console.error("Failed to check integration status:", error)
      // Don't show error to user as this is background functionality
    }
  }

  const updateRecoveryState = () => {
    const recoveryState = proofreaderRecoveryService.getRecoveryState()
    setState(prev => ({
      ...prev,
      recoveryState: {
        isOnline: recoveryState.isOnline,
        recoveryMode: recoveryState.recoveryMode,
        pendingOperations: recoveryState.pendingOperations.length,
        lastSync: recoveryState.lastSync,
        cacheUsed: prev.recoveryState.cacheUsed
      }
    }))
  }

  const handleAnalyze = async () => {
    try {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null,
        analysisProgress: 0,
        analysisStatusMessage: 'Starting analysis...'
      }))

      // Create abort controller for cancellation support
      abortControllerRef.current = new AbortController();
      
      // Step 1: Retrieve content from Builder tool
      setState(prev => ({
        ...prev,
        analysisProgress: 10,
        analysisStatusMessage: 'Retrieving thesis content...'
      }))

      const contentResult = await contentRetrievalService.retrieveAllContent(currentConversation.id);
      
      if (!contentResult.success || !contentResult.builderContent) {
        throw new Error(contentResult.error || "No content available for analysis");
      }

      // Check if content is sufficient for analysis
      if (contentResult.builderContent.content.trim().length < 50) {
        throw new Error("Content is too short for meaningful analysis. Please add more content in the Builder tool.");
      }

      // Step 2: Load idea definitions
      setState(prev => ({
        ...prev,
        analysisProgress: 25,
        analysisStatusMessage: 'Loading idea definitions from Idealist tool...'
      }))

      const ideaDefinitions = contentResult.ideaDefinitions || [];
      
      // Provide feedback about integration status
      if (ideaDefinitions.length > 0) {
        setState(prev => ({
          ...prev,
          analysisStatusMessage: `Found ${ideaDefinitions.length} idea definition${ideaDefinitions.length === 1 ? '' : 's'} for context...`
        }))
      } else {
        setState(prev => ({
          ...prev,
          analysisStatusMessage: 'No idea definitions found - analysis will proceed without contextual information...'
        }))
      }

      // Step 3: Prepare analysis request
      setState(prev => ({
        ...prev,
        analysisProgress: 40,
        analysisStatusMessage: 'Preparing analysis request...'
      }))

      const analysisRequest: ProofreaderAnalysisRequest = {
        conversationId: currentConversation.id,
        documentContent: contentResult.builderContent.content,
        ideaDefinitions,
        analysisOptions: {
          includeGrammar: true,
          academicLevel: 'graduate' // Default level
        }
      };

      // Step 4: Use recovery service for analysis with fallback mechanisms
      setState(prev => ({
        ...prev,
        analysisProgress: 60,
        analysisStatusMessage: state.recoveryState.isOnline ? 'Analyzing content with AI...' : 'Performing offline analysis...'
      }))

      const analysisResult = await proofreaderRecoveryService.performAnalysisWithRecovery(analysisRequest);

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Analysis failed");
      }

      // Step 5: Process analysis results
      setState(prev => ({
        ...prev,
        analysisProgress: 85,
        analysisStatusMessage: 'Processing analysis results...'
      }))

      // Cache the concerns for offline use
      if (analysisResult.concerns) {
        proofreaderRecoveryService.cacheConcerns(currentConversation.id, analysisResult.concerns);
      }

      // Step 6: Update state with results
      setState(prev => ({
        ...prev,
        analysisProgress: 100,
        analysisStatusMessage: analysisResult.analysisMetadata?.fallbackUsed 
          ? 'Analysis completed using fallback method!' 
          : 'Analysis completed successfully!',
        concerns: analysisResult.concerns || [],
        isAnalyzing: false,
        lastAnalyzed: new Date(),
        recoveryState: {
          ...prev.recoveryState,
          cacheUsed: analysisResult.analysisMetadata?.cacheUsed || false
        }
      }))

      const concernCount = analysisResult.concerns?.length || 0;
      const fallbackUsed = analysisResult.analysisMetadata?.fallbackUsed;
      const cacheUsed = analysisResult.analysisMetadata?.cacheUsed;
      
      if (concernCount === 0) {
        toast.success(fallbackUsed ? "Basic analysis completed! No concerns found." : "Analysis completed! No concerns found.");
      } else {
        const message = `${fallbackUsed ? 'Basic analysis' : 'Analysis'} completed! Found ${concernCount} concern${concernCount === 1 ? '' : 's'} to review.`;
        const toastMessage = cacheUsed ? `${message} (using cached result)` : message;
        toast.success(toastMessage);
      }
      
      // Show additional info for fallback/offline analysis
      if (fallbackUsed && !state.recoveryState.isOnline) {
        toast.info("Offline analysis provides basic feedback. Connect to internet for comprehensive AI analysis.");
      }
      
      // Reset progress after a delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          analysisProgress: 0,
          analysisStatusMessage: 'Ready to analyze'
        }))
      }, 3000)

    } catch (err: any) {
      const classifiedError = proofreaderErrorHandler.classifyError(err, 'analysis', currentConversation.id)
      
      // Add to error history
      setState(prev => ({
        ...prev,
        errorHistory: [
          {
            timestamp: new Date(),
            type: classifiedError.type,
            message: classifiedError.message,
            operation: 'analysis'
          },
          ...prev.errorHistory.slice(0, 9)
        ]
      }))
      
      let errorMessage = classifiedError.userMessage;
      
      if (err.name === 'AbortError') {
        errorMessage = "Analysis was cancelled.";
      }
      
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
        analysisStatusMessage: errorMessage,
        analysisProgress: 0
      }))
      
      if (err.name !== 'AbortError') {
        toast.error(errorMessage);
        
        // Suggest recovery actions based on error type
        if (classifiedError.type === ErrorType.NETWORK_ERROR) {
          toast.info("Try using offline analysis mode or check your connection");
        } else if (classifiedError.type === ErrorType.AI_SERVICE_ERROR) {
          toast.info("AI service may be temporarily unavailable. Basic analysis is still available.");
        }
      }
    }
  }

  // Add abort controller ref for cancellation support
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleCancelAnalysis = () => {
    // Cancel ongoing request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      analysisProgress: 0,
      analysisStatusMessage: 'Analysis cancelled'
    }))
    toast.info("Analysis cancelled")
  }

  const handleStatusChange = async (concernId: string, status: ConcernStatus) => {
    // Optimistically update UI first
    const previousConcerns = state.concerns
    setState(prev => ({
      ...prev,
      concerns: prev.concerns.map(concern =>
        concern.id === concernId
          ? { ...concern, status, updatedAt: new Date() }
          : concern
      )
    }))
    
    try {
      // Use recovery service for status updates with offline queueing
      const result = await proofreaderRecoveryService.updateConcernStatusWithRecovery(concernId, status);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update concern status')
      }
      
      // Update cached concerns
      const updatedConcerns = state.concerns.map(concern =>
        concern.id === concernId
          ? { ...concern, status, updatedAt: new Date() }
          : concern
      );
      proofreaderRecoveryService.cacheConcerns(currentConversation.id, updatedConcerns);
      
      const statusText = status.replace('_', ' ');
      if (state.recoveryState.isOnline) {
        toast.success(`Concern marked as ${statusText}`)
      } else {
        toast.success(`Concern marked as ${statusText} (will sync when online)`)
      }
      
      // Update recovery state
      updateRecoveryState();
      
    } catch (err: any) {
      const classifiedError = proofreaderErrorHandler.classifyError(err, 'status_update', currentConversation.id)
      
      // Add to error history
      setState(prev => ({
        ...prev,
        errorHistory: [
          {
            timestamp: new Date(),
            type: classifiedError.type,
            message: classifiedError.message,
            operation: 'status_update'
          },
          ...prev.errorHistory.slice(0, 9)
        ]
      }))
      
      // Rollback optimistic update on error
      setState(prev => ({ ...prev, concerns: previousConcerns }))
      
      toast.error(classifiedError.userMessage)
    }
  }

  const handleFilterChange = (filter: ConcernStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: filter }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Proofreader</SheetTitle>
          <SheetDescription>
            AI-powered proofreading analysis for your thesis proposal
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          {/* Recovery Status Bar */}
          <div className="py-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {state.recoveryState.isOnline ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className={state.recoveryState.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {state.recoveryState.isOnline ? 'Online' : 'Offline'}
                </span>
                {state.recoveryState.recoveryMode !== RecoveryMode.NORMAL && (
                  <Badge variant="outline" className="text-xs">
                    {state.recoveryState.recoveryMode}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {state.recoveryState.pendingOperations > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {state.recoveryState.pendingOperations} pending
                  </Badge>
                )}
                {state.recoveryState.cacheUsed && (
                  <Badge variant="outline" className="text-xs">
                    Cached
                  </Badge>
                )}
              </div>
            </div>
            
            {state.recoveryState.lastSync && (
              <div className="text-xs text-muted-foreground">
                Last sync: {state.recoveryState.lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Error Display with Recovery Options */}
          {state.error && (
            <div className="py-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-red-800">{state.error}</div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setState(prev => ({ ...prev, error: null }))}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                      {!state.isAnalyzing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAnalyze}
                          className="text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error History (collapsible) */}
          {state.errorHistory.length > 0 && (
            <details className="py-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Recent errors ({state.errorHistory.length})
              </summary>
              <div className="mt-2 space-y-1">
                {state.errorHistory.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-xs p-2 bg-muted/30 rounded border">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {error.type}
                      </Badge>
                      <span className="text-muted-foreground">
                        {error.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {error.operation}: {error.message}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
          
          {loading ? (
            <div className="py-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {/* Analysis Progress */}
              <AnalysisProgress
                isAnalyzing={state.isAnalyzing}
                progress={state.analysisProgress}
                statusMessage={state.analysisStatusMessage}
                onCancel={handleCancelAnalysis}
                error={state.error}
                success={state.analysisProgress === 100 && !state.isAnalyzing}
                onRetry={handleAnalyze}
                onDismissError={() => setState(prev => ({ ...prev, error: null }))}
                isOnline={state.recoveryState.isOnline}
                fallbackUsed={state.recoveryState.recoveryMode === RecoveryMode.DEGRADED || state.recoveryState.recoveryMode === RecoveryMode.OFFLINE}
                cacheUsed={state.recoveryState.cacheUsed}
                errorType={state.errorHistory.length > 0 ? state.errorHistory[0].type : undefined}
                recoveryOptions={[
                  ...(state.error && !state.recoveryState.isOnline ? [{
                    label: 'Try Offline Analysis',
                    action: handleAnalyze,
                    variant: 'secondary' as const
                  }] : []),
                  ...(state.errorHistory.length > 0 ? [{
                    label: 'Clear Error History',
                    action: () => setState(prev => ({ ...prev, errorHistory: [] })),
                    variant: 'outline' as const
                  }] : [])
                ]}
              />

              {/* Integration Status */}
              {state.integrationStatus && (
                <div className="p-3 bg-muted/30 rounded-lg border text-sm">
                  <div className="font-medium mb-2">Tool Integration Status</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Builder Tool:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        state.integrationStatus.builderIntegration.connected && state.integrationStatus.builderIntegration.hasContent
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {state.integrationStatus.builderIntegration.connected 
                          ? state.integrationStatus.builderIntegration.hasContent 
                            ? 'Connected with content' 
                            : 'Connected but no content'
                          : 'Not connected'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Idealist Tool:</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        state.integrationStatus.idealistIntegration.connected
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {state.integrationStatus.idealistIntegration.connected 
                          ? `${state.integrationStatus.idealistIntegration.ideaCount} idea${state.integrationStatus.idealistIntegration.ideaCount === 1 ? '' : 's'}`
                          : 'Not connected'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Analysis Info */}
              {state.lastAnalyzed && (
                <div className="text-xs text-muted-foreground text-center">
                  Last analyzed: {state.lastAnalyzed.toLocaleString()}
                </div>
              )}

              {/* Concerns List */}
              <ConcernList
                concerns={state.concerns}
                onStatusChange={handleStatusChange}
                statusFilter={state.statusFilter}
                onFilterChange={handleFilterChange}
              />
            </div>
          )}
        </ScrollArea>

        {/* Analysis Button */}
        {!state.isAnalyzing && (
          <div className="mt-4">
            <Button 
              onClick={handleAnalyze} 
              className="w-full"
              disabled={loading}
            >
              {state.concerns.length > 0 ? "Re-analyze Content" : "Analyze Content"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}