import { ScholarSearchResult, CitationStyle } from "../lib/ai-types"

// Bookmark types
export interface BookmarkedResult extends ScholarSearchResult {
  bookmarkId: string
  bookmarkedAt: Date
  tags: string[]
  notes?: string
}

// Comparison types
export interface ComparisonResult extends ScholarSearchResult {
  comparisonId: string
  addedAt: Date
  relevanceScore: number
  qualityScore: number
  confidenceScore: number
}

// Export types
export type ExportFormat = 'json' | 'csv' | 'bibtex' | 'ris' | 'txt' | 'markdown'

export interface ExportOptions {
  format: ExportFormat
  citationStyle?: CitationStyle
  includeAbstracts?: boolean
  includeUrls?: boolean
  includeDoi?: boolean
  includeScores?: boolean
  includeKeywords?: boolean
  sortBy?: 'relevance' | 'date' | 'citations'
  sortOrder?: 'asc' | 'desc'
}

// Share types
export type ShareType = 'link' | 'email'

export interface ShareOptions {
  shareType: ShareType
  recipientEmails?: string[]
  message?: string
  expirationDays?: number
  allowComments?: boolean
  allowDownloads?: boolean
}

export interface SharedResult {
  id: string
  results: ScholarSearchResult[]
  shareOptions: ShareOptions
  shareUrl: string
  createdAt: Date
  expiresAt?: Date
  viewCount: number
  isActive: boolean
}