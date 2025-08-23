"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Checkbox } from "./shadcn/checkbox"
import { Textarea } from "./shadcn/textarea"
import { ScrollArea } from "./shadcn/scroll-area"
import { Separator } from "./shadcn/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./shadcn/tabs"
import { 
  FileText, 
  Lightbulb, 
  Search, 
  Eye, 
  Settings, 
  RefreshCw,
  ChevronRight,
  Filter,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { IdeaDefinition, ExtractedContent } from "../../lib/ai-types"
import { fetchIdeas } from "../../lib/idea-api"

interface ContentSource {
  type: 'ideas' | 'builder'
  id: string
  title: string
  preview: string
  selected: boolean
  lastModified?: string
  wordCount?: number
  tags?: string[]
}

interface ContentSourceSelectorProps {
  conversationId: string
  onContentSelected: (content: ExtractedContent[]) => void
  onContentPreview: (content: ExtractedContent) => void
  onSearchQueryGenerated: (query: string) => void
  isVisible?: boolean
}

interface ContentPreview {
  source: ContentSource
  extractedContent: ExtractedContent | null
  isLoading: boolean
  error: string | null
}

export const ContentSourceSelector: React.FC<ContentSourceSelectorProps> = ({
  conversationId,
  onContentSelected,
  onContentPreview,
  onSearchQueryGenerated,
  isVisible = true
}) => {
  const [activeTab, setActiveTab] = useState<'ideas' | 'builder'>('ideas')
  const [ideasSources, setIdeasSources] = useState<ContentSource[]>([])
  const [builderSources, setBuilderSources] = useState<ContentSource[]>([])
  const [selectedSources, setSelectedSources] = useState<ContentSource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Content preview state
  const [previewContent, setPreviewContent] = useState<ContentPreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  // Search query customization
  const [customQuery, setCustomQuery] = useState('')
  const [generatedQuery, setGeneratedQuery] = useState('')
  const [useCustomQuery, setUseCustomQuery] = useState(false)
  
  // Filtering and search
  const [searchFilter, setSearchFilter] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  
  // Load content sources on mount
  useEffect(() => {
    if (conversationId && isVisible) {
      loadContentSources()
    }
  }, [conversationId, isVisible])

  const loadContentSources = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load Ideas
      await loadIdeasSources()
      
      // Load Builder content
      await loadBuilderSources()
      
    } catch (err) {
      console.error('Error loading content sources:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content sources')
    } finally {
      setIsLoading(false)
    }
  }

  const loadIdeasSources = async () => {
    try {
      const ideas = await fetchIdeas(conversationId)
      
      const ideaSources: ContentSource[] = ideas.map((idea: IdeaDefinition) => ({
        type: 'ideas' as const,
        id: idea.id.toString(),
        title: idea.title,
        preview: idea.description?.substring(0, 150) + (idea.description && idea.description.length > 150 ? '...' : '') || '',
        selected: false,
        lastModified: idea.updated_at || idea.created_at,
        wordCount: idea.description ? idea.description.split(/\s+/).length : 0,
        tags: idea.tags || []
      }))
      
      setIdeasSources(ideaSources)
    } catch (err) {
      console.error('Error loading ideas:', err)
      // Set empty array on error but don't throw - let other sources load
      setIdeasSources([])
    }
  }

  const loadBuilderSources = async () => {
    try {
      const response = await fetch(`/api/builder-content/${conversationId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load builder content: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.content) {
        const builderSource: ContentSource = {
          type: 'builder' as const,
          id: conversationId,
          title: 'Thesis Document',
          preview: data.content.substring(0, 150) + (data.content.length > 150 ? '...' : ''),
          selected: false,
          lastModified: data.updated_at,
          wordCount: data.content.split(/\s+/).length,
          tags: []
        }
        
        setBuilderSources([builderSource])
      } else {
        setBuilderSources([])
      }
    } catch (err) {
      console.error('Error loading builder content:', err)
      // Set empty array on error but don't throw
      setBuilderSources([])
    }
  }

  const handleSourceToggle = (source: ContentSource) => {
    const isCurrentlySelected = selectedSources.some(s => s.id === source.id && s.type === source.type)
    
    if (isCurrentlySelected) {
      // Remove from selection
      setSelectedSources(prev => prev.filter(s => !(s.id === source.id && s.type === source.type)))
    } else {
      // Add to selection
      setSelectedSources(prev => [...prev, { ...source, selected: true }])
    }
    
    // Update the source lists
    if (source.type === 'ideas') {
      setIdeasSources(prev => prev.map(s => 
        s.id === source.id ? { ...s, selected: !isCurrentlySelected } : s
      ))
    } else {
      setBuilderSources(prev => prev.map(s => 
        s.id === source.id ? { ...s, selected: !isCurrentlySelected } : s
      ))
    }
  }

  const handlePreviewContent = async (source: ContentSource) => {
    setPreviewContent({
      source,
      extractedContent: null,
      isLoading: true,
      error: null
    })
    setShowPreview(true)
    
    try {
      // Extract content for preview
      const extractedContent = await extractContentFromSource(source)
      
      setPreviewContent(prev => prev ? {
        ...prev,
        extractedContent,
        isLoading: false
      } : null)
      
      // Notify parent component
      onContentPreview(extractedContent)
      
    } catch (err) {
      console.error('Error previewing content:', err)
      setPreviewContent(prev => prev ? {
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to preview content'
      } : null)
    }
  }

  const extractContentFromSource = async (source: ContentSource): Promise<ExtractedContent> => {
    // Mock content extraction - in real implementation this would call the content extraction engine
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
    
    if (source.type === 'ideas') {
      const idea = ideasSources.find(s => s.id === source.id)
      if (!idea) throw new Error('Idea not found')
      
      return {
        source: 'ideas',
        title: idea.title,
        content: `${idea.title}\n\n${idea.preview}`,
        keywords: extractKeywords(idea.title + ' ' + idea.preview),
        keyPhrases: extractKeyPhrases(idea.title + ' ' + idea.preview),
        topics: extractTopics(idea.title + ' ' + idea.preview),
        confidence: 0.85
      }
    } else {
      const builder = builderSources.find(s => s.id === source.id)
      if (!builder) throw new Error('Builder content not found')
      
      return {
        source: 'builder',
        title: builder.title,
        content: builder.preview,
        keywords: extractKeywords(builder.preview),
        keyPhrases: extractKeyPhrases(builder.preview),
        topics: extractTopics(builder.preview),
        confidence: 0.90
      }
    }
  }

  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - in real implementation this would use NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  const extractKeyPhrases = (text: string): string[] => {
    // Simple key phrase extraction
    const sentences = text.split(/[.!?]+/)
    return sentences
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 5)
  }

  const extractTopics = (text: string): string[] => {
    // Simple topic extraction based on common academic terms
    const academicTerms = [
      'research', 'analysis', 'methodology', 'theory', 'framework',
      'study', 'investigation', 'approach', 'model', 'concept',
      'development', 'implementation', 'evaluation', 'assessment'
    ]
    
    const textLower = text.toLowerCase()
    return academicTerms.filter(term => textLower.includes(term)).slice(0, 5)
  }

  const generateSearchQuery = async () => {
    if (selectedSources.length === 0) {
      setError('Please select at least one content source')
      return
    }
    
    try {
      // Extract content from all selected sources
      const extractedContents: ExtractedContent[] = []
      
      for (const source of selectedSources) {
        const extracted = await extractContentFromSource(source)
        extractedContents.push(extracted)
      }
      
      // Generate search query from extracted content
      const allKeywords = [...new Set(extractedContents.flatMap(ec => ec.keywords))]
      const allTopics = [...new Set(extractedContents.flatMap(ec => ec.topics))]
      
      // Create intelligent search query
      const query = [...allTopics.slice(0, 3), ...allKeywords.slice(0, 5)].join(' ')
      
      setGeneratedQuery(query)
      onSearchQueryGenerated(query)
      onContentSelected(extractedContents)
      
    } catch (err) {
      console.error('Error generating search query:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate search query')
    }
  }

  const handleCustomQuerySubmit = () => {
    if (!customQuery.trim()) {
      setError('Please enter a custom search query')
      return
    }
    
    onSearchQueryGenerated(customQuery)
    
    // Create mock extracted content for custom query
    const mockExtracted: ExtractedContent = {
      source: 'ideas',
      title: 'Custom Query',
      content: customQuery,
      keywords: extractKeywords(customQuery),
      keyPhrases: [customQuery],
      topics: extractTopics(customQuery),
      confidence: 0.75
    }
    
    onContentSelected([mockExtracted])
  }

  const filteredIdeasSources = ideasSources.filter(source => {
    const matchesSearch = source.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         source.preview.toLowerCase().includes(searchFilter.toLowerCase())
    const matchesTags = tagFilter.length === 0 || 
                       (source.tags && source.tags.some(tag => tagFilter.includes(tag)))
    return matchesSearch && matchesTags
  })

  const filteredBuilderSources = builderSources.filter(source => {
    return source.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
           source.preview.toLowerCase().includes(searchFilter.toLowerCase())
  })

  const allTags = [...new Set(ideasSources.flatMap(source => source.tags || []))]

  if (!isVisible) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Content Source Selection</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Select Content Sources
            <Button
              variant="outline"
              size="sm"
              onClick={loadContentSources}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search content sources..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by tags:</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={tagFilter.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setTagFilter(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content Source Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ideas' | 'builder')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ideas" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Ideas ({filteredIdeasSources.length})
                </TabsTrigger>
                <TabsTrigger value="builder" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Builder ({filteredBuilderSources.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ideas" className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading ideas...</span>
                  </div>
                ) : filteredIdeasSources.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredIdeasSources.map((source) => (
                        <ContentSourceCard
                          key={source.id}
                          source={source}
                          isSelected={selectedSources.some(s => s.id === source.id && s.type === source.type)}
                          onToggle={() => handleSourceToggle(source)}
                          onPreview={() => handlePreviewContent(source)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No ideas found for this conversation</p>
                    <p className="text-sm">Create some ideas first to use them as search context</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="builder" className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading builder content...</span>
                  </div>
                ) : filteredBuilderSources.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredBuilderSources.map((source) => (
                        <ContentSourceCard
                          key={source.id}
                          source={source}
                          isSelected={selectedSources.some(s => s.id === source.id && s.type === source.type)}
                          onToggle={() => handleSourceToggle(source)}
                          onPreview={() => handlePreviewContent(source)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No builder content found</p>
                    <p className="text-sm">Create content in the Builder tool to use it as search context</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Selected Sources Summary */}
      {selectedSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Sources ({selectedSources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSources.map((source) => (
                <div key={`${source.type}-${source.id}`} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {source.type === 'ideas' ? <Lightbulb className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    <span className="font-medium">{source.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {source.type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSourceToggle(source)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Query Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search Query Customization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-custom-query"
                checked={useCustomQuery}
                onCheckedChange={(checked) => setUseCustomQuery(checked as boolean)}
              />
              <Label htmlFor="use-custom-query">Use custom search query</Label>
            </div>

            {useCustomQuery ? (
              <div className="space-y-2">
                <Label htmlFor="custom-query">Custom Search Query</Label>
                <Textarea
                  id="custom-query"
                  placeholder="Enter your custom search query..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleCustomQuerySubmit}
                  disabled={!customQuery.trim()}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Use Custom Query
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Generated Search Query</Label>
                {generatedQuery ? (
                  <div className="p-3 bg-muted rounded border">
                    <p className="text-sm">{generatedQuery}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select content sources to generate a search query
                  </p>
                )}
                <Button
                  onClick={generateSearchQuery}
                  disabled={selectedSources.length === 0}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Generate & Use Query
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Preview Modal */}
      {showPreview && previewContent && (
        <ContentPreviewModal
          preview={previewContent}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}

// Content Source Card Component
interface ContentSourceCardProps {
  source: ContentSource
  isSelected: boolean
  onToggle: () => void
  onPreview: () => void
}

const ContentSourceCard: React.FC<ContentSourceCardProps> = ({
  source,
  isSelected,
  onToggle,
  onPreview
}) => {
  return (
    <div className={`border rounded-lg p-3 transition-colors ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {source.type === 'ideas' ? <Lightbulb className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              <h4 className="font-medium text-sm truncate">{source.title}</h4>
              <Badge variant="outline" className="text-xs">
                {source.type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {source.preview}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {source.wordCount && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {source.wordCount} words
                </span>
              )}
              {source.lastModified && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(source.lastModified).toLocaleDateString()}
                </span>
              )}
            </div>
            {source.tags && source.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {source.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {source.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{source.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="flex items-center gap-1"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </div>
    </div>
  )
}

// Content Preview Modal Component
interface ContentPreviewModalProps {
  preview: ContentPreview
  onClose: () => void
}

const ContentPreviewModal: React.FC<ContentPreviewModalProps> = ({
  preview,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Content Preview: {preview.source.title}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {preview.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Extracting content...</span>
            </div>
          ) : preview.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{preview.error}</span>
              </div>
            </div>
          ) : preview.extractedContent ? (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Extracted Content:</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
                  {preview.extractedContent.content}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-medium">Keywords:</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.extractedContent.keywords?.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Topics:</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preview.extractedContent.topics?.map(topic => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Confidence:</Label>
                  <div className="mt-2">
                    <Badge className="text-xs">
                      {Math.round((preview.extractedContent.confidence || 0) * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}