/**
 * Search Result Management Service
 * Handles bookmarking, comparison, export, and sharing of search results
 */

import { ScholarSearchResult, CitationStyle } from "../../lib/ai-types"
import { BookmarkedResult, ComparisonResult, ExportOptions, ExportFormat, ShareOptions, SharedResult } from "../../types/search-result-types"

export interface SearchResultManagementService {
  // Bookmarking
  bookmarkResult(result: ScholarSearchResult, userId: string, tags?: string[], notes?: string): Promise<BookmarkedResult>
  removeBookmark(result: ScholarSearchResult, userId: string): Promise<void>
  getBookmarkedResults(userId: string): Promise<BookmarkedResult[]>
  isResultBookmarked(result: ScholarSearchResult, userId: string): Promise<boolean>

  // Comparison
  addToComparison(result: ScholarSearchResult, userId: string): Promise<ComparisonResult>
  removeFromComparison(result: ScholarSearchResult, userId: string): Promise<void>
  getComparisonResults(userId: string): Promise<ComparisonResult[]>
  clearComparison(userId: string): Promise<void>

  // Export
  exportResults(results: ScholarSearchResult[], options: ExportOptions): Promise<string>
  
  // Sharing
  shareResults(results: ScholarSearchResult[], options: ShareOptions, userId: string): Promise<SharedResult>
  getSharedResult(shareId: string): Promise<SharedResult | null>
  updateSharedResultViews(shareId: string): Promise<void>
}

export class SearchResultManagementServiceImpl implements SearchResultManagementService {
  private bookmarks: Map<string, BookmarkedResult[]> = new Map()
  private comparisons: Map<string, ComparisonResult[]> = new Map()
  private sharedResults: Map<string, SharedResult> = new Map()

  // Bookmarking methods
  async bookmarkResult(
    result: ScholarSearchResult, 
    userId: string, 
    tags: string[] = [], 
    notes?: string
  ): Promise<BookmarkedResult> {
    const bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const bookmarkedResult: BookmarkedResult = {
      ...result,
      bookmarkId,
      bookmarkedAt: new Date(),
      tags,
      notes
    }

    const userBookmarks = this.bookmarks.get(userId) || []
    
    // Check if already bookmarked
    const existingIndex = userBookmarks.findIndex(b => 
      b.title === result.title && 
      b.authors.join(',') === result.authors.join(',')
    )
    
    if (existingIndex >= 0) {
      // Update existing bookmark
      userBookmarks[existingIndex] = bookmarkedResult
    } else {
      // Add new bookmark
      userBookmarks.push(bookmarkedResult)
    }
    
    this.bookmarks.set(userId, userBookmarks)
    return bookmarkedResult
  }

  async removeBookmark(result: ScholarSearchResult, userId: string): Promise<void> {
    const userBookmarks = this.bookmarks.get(userId) || []
    const filteredBookmarks = userBookmarks.filter(b => 
      !(b.title === result.title && b.authors.join(',') === result.authors.join(','))
    )
    this.bookmarks.set(userId, filteredBookmarks)
  }

  async getBookmarkedResults(userId: string): Promise<BookmarkedResult[]> {
    return this.bookmarks.get(userId) || []
  }

  async isResultBookmarked(result: ScholarSearchResult, userId: string): Promise<boolean> {
    const userBookmarks = this.bookmarks.get(userId) || []
    return userBookmarks.some(b => 
      b.title === result.title && 
      b.authors.join(',') === result.authors.join(',')
    )
  }

  // Comparison methods
  async addToComparison(result: ScholarSearchResult, userId: string): Promise<ComparisonResult> {
    const comparisonId = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const comparisonResult: ComparisonResult = {
      ...result,
      comparisonId,
      addedAt: new Date(),
      relevanceScore: result.relevance_score,
      qualityScore: this.calculateQualityScore(result),
      confidenceScore: result.confidence
    }

    const userComparisons = this.comparisons.get(userId) || []
    
    // Check if already in comparison
    const existingIndex = userComparisons.findIndex(c => 
      c.title === result.title && 
      c.authors.join(',') === result.authors.join(',')
    )
    
    if (existingIndex >= 0) {
      // Update existing comparison entry
      userComparisons[existingIndex] = comparisonResult
    } else {
      // Add new comparison entry
      userComparisons.push(comparisonResult)
    }
    
    this.comparisons.set(userId, userComparisons)
    return comparisonResult
  }

  async removeFromComparison(result: ScholarSearchResult, userId: string): Promise<void> {
    const userComparisons = this.comparisons.get(userId) || []
    const filteredComparisons = userComparisons.filter(c => 
      !(c.title === result.title && c.authors.join(',') === result.authors.join(','))
    )
    this.comparisons.set(userId, filteredComparisons)
  }

  async getComparisonResults(userId: string): Promise<ComparisonResult[]> {
    return this.comparisons.get(userId) || []
  }

  async clearComparison(userId: string): Promise<void> {
    this.comparisons.set(userId, [])
  }

  // Export methods
  async exportResults(results: ScholarSearchResult[], options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(results, options)
      case 'csv':
        return this.exportAsCSV(results, options)
      case 'bibtex':
        return this.exportAsBibTeX(results, options)
      case 'ris':
        return this.exportAsRIS(results, options)
      case 'txt':
        return this.exportAsText(results, options)
      case 'markdown':
        return this.exportAsMarkdown(results, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  // Sharing methods
  async shareResults(
    results: ScholarSearchResult[], 
    options: ShareOptions, 
    userId: string
  ): Promise<SharedResult> {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    // Use globalThis.origin if available (Workers environment), otherwise fall back to a default
    // In a production environment, you might want to configure this through environment variables
    const origin = (globalThis as any).origin || 'https://thesis-copilot.example.com'
    const shareUrl = `${origin}/shared/${shareId}`
    
    const expiresAt = options.expirationDays 
      ? new Date(Date.now() + options.expirationDays * 24 * 60 * 60 * 1000)
      : undefined

    const sharedResult: SharedResult = {
      id: shareId,
      results,
      shareOptions: options,
      shareUrl,
      createdAt: new Date(),
      expiresAt,
      viewCount: 0,
      isActive: true
    }

    this.sharedResults.set(shareId, sharedResult)

    // If email sharing, simulate sending emails
    if (options.shareType === 'email' && options.recipientEmails) {
      await this.sendShareEmails(sharedResult, options.recipientEmails)
    }

    return sharedResult
  }

  async getSharedResult(shareId: string): Promise<SharedResult | null> {
    const sharedResult = this.sharedResults.get(shareId)
    
    if (!sharedResult) {
      return null
    }

    // Check if expired
    if (sharedResult.expiresAt && sharedResult.expiresAt < new Date()) {
      sharedResult.isActive = false
      return null
    }

    return sharedResult
  }

  async updateSharedResultViews(shareId: string): Promise<void> {
    const sharedResult = this.sharedResults.get(shareId)
    if (sharedResult) {
      sharedResult.viewCount += 1
      this.sharedResults.set(shareId, sharedResult)
    }
  }

  // Private helper methods
  private calculateQualityScore(result: ScholarSearchResult): number {
    let score = 0
    let factors = 0

    // Citation count factor (0-0.4)
    if (result.citations !== undefined) {
      const citationScore = Math.min(result.citations / 100, 1) * 0.4
      score += citationScore
      factors += 0.4
    }

    // Recency factor (0-0.3)
    if (result.year) {
      const currentYear = new Date().getFullYear()
      const age = currentYear - result.year
      const recencyScore = Math.max(0, (10 - age) / 10) * 0.3
      score += recencyScore
      factors += 0.3
    }

    // Journal quality factor (0-0.3)
    if (result.journal) {
      // Simple heuristic - could be enhanced with journal rankings
      const journalScore = result.journal.toLowerCase().includes('nature') || 
                          result.journal.toLowerCase().includes('science') ||
                          result.journal.toLowerCase().includes('cell') ? 0.3 : 0.15
      score += journalScore
      factors += 0.3
    }

    // Normalize score
    return factors > 0 ? score / factors : 0.5
  }

  private exportAsJSON(results: ScholarSearchResult[], options: ExportOptions): string {
    const exportData = results.map(result => {
      const exportResult: any = {
        title: result.title,
        authors: result.authors,
        journal: result.journal,
        year: result.year,
        citations: result.citations
      }

      if (options.includeScores) {
        exportResult.relevance_score = result.relevance_score
        exportResult.confidence = result.confidence
      }

      if (options.includeAbstracts && result.abstract) {
        exportResult.abstract = result.abstract
      }

      if (options.includeUrls && result.url) {
        exportResult.url = result.url
      }

      if (options.includeDoi && result.doi) {
        exportResult.doi = result.doi
      }

      if (options.includeKeywords && result.keywords) {
        exportResult.keywords = result.keywords
      }

      return exportResult
    })

    return JSON.stringify(exportData, null, 2)
  }

  private exportAsCSV(results: ScholarSearchResult[], options: ExportOptions): string {
    const headers = ['Title', 'Authors', 'Journal', 'Year', 'Citations']
    
    if (options.includeScores) {
      headers.push('Relevance Score', 'Confidence')
    }
    if (options.includeAbstracts) {
      headers.push('Abstract')
    }
    if (options.includeUrls) {
      headers.push('URL')
    }
    if (options.includeDoi) {
      headers.push('DOI')
    }
    if (options.includeKeywords) {
      headers.push('Keywords')
    }

    const csvRows = [headers.join(',')]

    results.forEach(result => {
      const row = [
        `"${result.title.replace(/"/g, '""')}"`,
        `"${result.authors.join('; ').replace(/"/g, '""')}"`,
        `"${result.journal || ''}"`,
        result.year?.toString() || '',
        result.citations?.toString() || ''
      ]

      if (options.includeScores) {
        row.push(result.relevance_score.toString(), result.confidence.toString())
      }
      if (options.includeAbstracts) {
        row.push(`"${(result.abstract || '').replace(/"/g, '""')}"`)
      }
      if (options.includeUrls) {
        row.push(`"${result.url || ''}"`)
      }
      if (options.includeDoi) {
        row.push(`"${result.doi || ''}"`)
      }
      if (options.includeKeywords) {
        row.push(`"${(result.keywords || []).join('; ').replace(/"/g, '""')}"`)
      }

      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  private exportAsBibTeX(results: ScholarSearchResult[], options: ExportOptions): string {
    return results.map((result, index) => {
      const key = `${result.authors[0]?.split(' ').pop()?.toLowerCase() || 'unknown'}${result.year || 'unknown'}`
      const type = result.journal ? 'article' : 'misc'
      
      let bibtex = `@${type}{${key}${index},\n`
      bibtex += `  title={${result.title}},\n`
      bibtex += `  author={${result.authors.join(' and ')}},\n`
      
      if (result.journal) {
        bibtex += `  journal={${result.journal}},\n`
      }
      if (result.year) {
        bibtex += `  year={${result.year}},\n`
      }
      if (options.includeDoi && result.doi) {
        bibtex += `  doi={${result.doi}},\n`
      }
      if (options.includeUrls && result.url) {
        bibtex += `  url={${result.url}},\n`
      }
      
      bibtex += '}\n'
      return bibtex
    }).join('\n')
  }

  private exportAsRIS(results: ScholarSearchResult[], options: ExportOptions): string {
    return results.map(result => {
      let ris = 'TY  - JOUR\n' // Journal article type
      ris += `TI  - ${result.title}\n`
      
      result.authors.forEach(author => {
        ris += `AU  - ${author}\n`
      })
      
      if (result.journal) {
        ris += `JO  - ${result.journal}\n`
      }
      if (result.year) {
        ris += `PY  - ${result.year}\n`
      }
      if (options.includeDoi && result.doi) {
        ris += `DO  - ${result.doi}\n`
      }
      if (options.includeUrls && result.url) {
        ris += `UR  - ${result.url}\n`
      }
      if (options.includeAbstracts && result.abstract) {
        ris += `AB  - ${result.abstract}\n`
      }
      
      ris += 'ER  -\n\n'
      return ris
    }).join('')
  }

  private exportAsText(results: ScholarSearchResult[], options: ExportOptions): string {
    return results.map((result, index) => {
      let text = `${index + 1}. ${result.title}\n`
      text += `   Authors: ${result.authors.join(', ')}\n`
      
      if (result.journal) {
        text += `   Journal: ${result.journal}\n`
      }
      if (result.year) {
        text += `   Year: ${result.year}\n`
      }
      if (result.citations) {
        text += `   Citations: ${result.citations}\n`
      }
      if (options.includeScores) {
        text += `   Relevance: ${Math.round(result.relevance_score * 100)}%\n`
        text += `   Confidence: ${Math.round(result.confidence * 100)}%\n`
      }
      if (options.includeDoi && result.doi) {
        text += `   DOI: ${result.doi}\n`
      }
      if (options.includeUrls && result.url) {
        text += `   URL: ${result.url}\n`
      }
      if (options.includeAbstracts && result.abstract) {
        text += `   Abstract: ${result.abstract}\n`
      }
      
      text += '\n'
      return text
    }).join('')
  }

  private exportAsMarkdown(results: ScholarSearchResult[], options: ExportOptions): string {
    let markdown = '# Search Results\n\n'
    
    results.forEach((result, index) => {
      markdown += `## ${index + 1}. ${result.title}\n\n`
      markdown += `**Authors:** ${result.authors.join(', ')}\n\n`
      
      if (result.journal) {
        markdown += `**Journal:** ${result.journal}\n\n`
      }
      if (result.year) {
        markdown += `**Year:** ${result.year}\n\n`
      }
      if (result.citations) {
        markdown += `**Citations:** ${result.citations}\n\n`
      }
      if (options.includeScores) {
        markdown += `**Relevance Score:** ${Math.round(result.relevance_score * 100)}%\n\n`
        markdown += `**Confidence:** ${Math.round(result.confidence * 100)}%\n\n`
      }
      if (options.includeDoi && result.doi) {
        markdown += `**DOI:** [${result.doi}](https://doi.org/${result.doi})\n\n`
      }
      if (options.includeUrls && result.url) {
        markdown += `**URL:** [${result.url}](${result.url})\n\n`
      }
      if (options.includeAbstracts && result.abstract) {
        markdown += `**Abstract:** ${result.abstract}\n\n`
      }
      
      markdown += '---\n\n'
    })
    
    return markdown
  }

  private async sendShareEmails(sharedResult: SharedResult, emails: string[]): Promise<void> {
    // In a real implementation, this would send actual emails
    console.log(`Sending share emails to: ${emails.join(', ')}`)
    console.log(`Share URL: ${sharedResult.shareUrl}`)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

// Export singleton instance
export const searchResultManagementService = new SearchResultManagementServiceImpl()