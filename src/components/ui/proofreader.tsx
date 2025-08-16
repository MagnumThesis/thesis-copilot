"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { Button } from "@/components/ui/shadcn/button"
import { Skeleton } from "@/components/ui/shadcn/skeleton"
import { ConcernList } from "./concern-list"
import { AnalysisProgress } from "./analysis-progress"
import { ProofreadingConcern, ConcernStatus } from "@/lib/ai-types"

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

  const loadConcerns = async () => {
    try {
      setLoading(true)
      setState(prev => ({ ...prev, error: null }))
      
      // TODO: Replace with actual API call to fetch concerns
      // const concerns = await fetchConcerns(currentConversation.id)
      
      // For now, use empty array - this will be implemented in backend tasks
      const concerns: ProofreadingConcern[] = []
      
      setState(prev => ({
        ...prev,
        concerns,
        lastAnalyzed: concerns.length > 0 ? new Date() : null
      }))
      setRetryCount(0)
      
      if (concerns.length > 0) {
        toast.success("Concerns loaded successfully!")
      }
    } catch (err) {
      console.error("Failed to load concerns:", err)
      const errorMessage = "Failed to load concerns. Please try again."
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error(errorMessage)
      
      // Implement retry mechanism
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadConcerns()
        }, 2000 * (retryCount + 1))
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

      // Simulate analysis progress
      const progressSteps = [
        { progress: 10, message: 'Retrieving thesis content...' },
        { progress: 25, message: 'Loading idea definitions...' },
        { progress: 50, message: 'Analyzing content structure...' },
        { progress: 75, message: 'Generating concerns...' },
        { progress: 90, message: 'Finalizing results...' },
        { progress: 100, message: 'Analysis complete!' }
      ]

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setState(prev => ({
          ...prev,
          analysisProgress: step.progress,
          analysisStatusMessage: step.message
        }))
      }

      // TODO: Replace with actual API call to analyze content
      // const result = await analyzeContent(currentConversation.id)
      
      // For now, simulate successful analysis with empty results
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastAnalyzed: new Date(),
        analysisProgress: 100,
        analysisStatusMessage: 'Analysis completed successfully!'
      }))

      toast.success("Analysis completed! No concerns found.")
      
      // Reset progress after a delay
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          analysisProgress: 0,
          analysisStatusMessage: 'Ready to analyze'
        }))
      }, 3000)

    } catch (err) {
      console.error("Failed to analyze content:", err)
      const errorMessage = "Failed to analyze content. Please try again."
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
        analysisStatusMessage: errorMessage
      }))
      toast.error(errorMessage)
    }
  }

  const handleCancelAnalysis = () => {
    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      analysisProgress: 0,
      analysisStatusMessage: 'Analysis cancelled'
    }))
    toast.info("Analysis cancelled")
  }

  const handleStatusChange = async (concernId: string, status: ConcernStatus) => {
    try {
      // TODO: Replace with actual API call to update concern status
      // await updateConcernStatus(concernId, status)
      
      setState(prev => ({
        ...prev,
        concerns: prev.concerns.map(concern =>
          concern.id === concernId
            ? { ...concern, status, updatedAt: new Date() }
            : concern
        )
      }))
      
      toast.success(`Concern marked as ${status.replace('_', ' ')}`)
    } catch (err) {
      console.error("Failed to update concern status:", err)
      toast.error("Failed to update concern status. Please try again.")
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