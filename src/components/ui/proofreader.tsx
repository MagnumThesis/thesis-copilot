"use client"

import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { Button } from "@/components/ui/shadcn/button"
import { Skeleton } from "@/components/ui/shadcn/skeleton"
import { ConcernList } from "./concern-list"
import { AnalysisProgress } from "./analysis-progress"
import { ProofreadingConcern, ConcernStatus, ProofreaderAnalysisRequest, ProofreaderAnalysisResponse } from "@/lib/ai-types"
import { contentRetrievalService } from "@/lib/content-retrieval-service"

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
    analysisStatusMessage: 'Ready to analyze'
  })

  const [loading, setLoading] = useState<boolean>(true)
  const [retryCount, setRetryCount] = useState<number>(0)

  // Load existing concerns when component mounts or when sheet opens
  useEffect(() => {
    if (isOpen) {
      loadConcerns()
    }
  }, [isOpen, currentConversation.id])

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
      
      // Fetch existing concerns from API
      const response = await fetch(`/api/proofreader/concerns/${currentConversation.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load concerns: ${response.statusText}`)
      }
      
      const data = await response.json()
      const concerns: ProofreadingConcern[] = data.concerns || []
      
      setState(prev => ({
        ...prev,
        concerns,
        lastAnalyzed: concerns.length > 0 ? new Date() : null
      }))
      setRetryCount(0)
      
      if (concerns.length > 0) {
        toast.success(`Loaded ${concerns.length} existing concern${concerns.length === 1 ? '' : 's'}`)
      }
    } catch (err: any) {
      console.error("Failed to load concerns:", err)
      
      // Handle different error scenarios
      let errorMessage = "Failed to load concerns. Please try again."
      
      if (err.message.includes('404')) {
        // No concerns found is not really an error
        setState(prev => ({ ...prev, concerns: [] }))
        setLoading(false)
        return
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection."
      }
      
      setState(prev => ({ ...prev, error: errorMessage }))
      
      // Implement retry mechanism with exponential backoff
      if (retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount) // 2s, 4s, 8s
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadConcerns()
        }, delay)
        
        toast.error(`${errorMessage} Retrying in ${delay / 1000} seconds...`)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
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
        analysisStatusMessage: 'Loading idea definitions...'
      }))

      const ideaDefinitions = contentResult.ideaDefinitions || [];

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

      // Step 4: Send analysis request to backend
      setState(prev => ({
        ...prev,
        analysisProgress: 60,
        analysisStatusMessage: 'Analyzing content structure...'
      }))

      const response = await fetch('/api/proofreader/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
      }

      // Step 5: Process analysis results
      setState(prev => ({
        ...prev,
        analysisProgress: 85,
        analysisStatusMessage: 'Processing analysis results...'
      }))

      const analysisResult: ProofreaderAnalysisResponse = await response.json();

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Analysis failed");
      }

      // Step 6: Update state with results
      setState(prev => ({
        ...prev,
        analysisProgress: 100,
        analysisStatusMessage: 'Analysis completed successfully!',
        concerns: analysisResult.concerns || [],
        isAnalyzing: false,
        lastAnalyzed: new Date()
      }))

      const concernCount = analysisResult.concerns?.length || 0;
      if (concernCount === 0) {
        toast.success("Analysis completed! No concerns found.");
      } else {
        toast.success(`Analysis completed! Found ${concernCount} concern${concernCount === 1 ? '' : 's'} to review.`);
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
      console.error("Failed to analyze content:", err)
      
      // Handle different types of errors
      let errorMessage = "Failed to analyze content. Please try again.";
      
      if (err.name === 'AbortError') {
        errorMessage = "Analysis was cancelled.";
      } else if (err.message) {
        errorMessage = err.message;
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
      // Update status via API
      const response = await fetch(`/api/proofreader/concerns/${concernId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update concern status')
      }
      
      toast.success(`Concern marked as ${status.replace('_', ' ')}`)
    } catch (err: any) {
      console.error("Failed to update concern status:", err)
      
      // Rollback optimistic update on error
      setState(prev => ({ ...prev, concerns: previousConcerns }))
      
      let errorMessage = "Failed to update concern status. Please try again."
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again."
      }
      
      toast.error(errorMessage)
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
          {state.error && (
            <div className="py-4 text-center text-red-500">
              {state.error}
            </div>
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
              />

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