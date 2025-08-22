"use client"

import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./shadcn/sheet"
import { ScrollArea } from "./shadcn/scroll-area"
import { Badge } from "./shadcn/badge"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Separator } from "./shadcn/separator"
import { CitationStyle, Reference, ReferenceType } from "../../lib/ai-types"
import { BibliographyControls } from "./bibliography-controls"
import { ExportOptionsComponent } from "./export-options"
import { ReferenceList } from "./reference-list"
import { ReferenceForm } from "./reference-form"
import { CitationFormatter } from "./citation-formatter"
import { BibliographyGenerator } from "./bibliography-generator"
import { BookOpen, FileText, Quote, Settings, Search, Plus, Filter, Sparkles } from "lucide-react"
import { AISearcher } from "./ai-searcher"

interface ReferencerProps {
  isOpen: boolean
  onClose: () => void
  currentConversation: { title: string; id: string }
}

type ReferencerTab = 'references' | 'citations' | 'bibliography' | 'ai-searcher'

interface ReferencerState {
  activeTab: ReferencerTab
  searchQuery: string
  selectedStyle: CitationStyle
  filterType: ReferenceType | 'all'
  showForm: boolean
  editingReference: string | null
}

export const Referencer: React.FC<ReferencerProps> = ({ isOpen, onClose, currentConversation }) => {
  const [state, setState] = useState<ReferencerState>({
    activeTab: 'references',
    searchQuery: '',
    selectedStyle: CitationStyle.APA,
    filterType: 'all',
    showForm: false,
    editingReference: null
  })

  // Load saved citation style preference
  useEffect(() => {
    const savedStyle = localStorage.getItem('referencer-citation-style')
    if (savedStyle && Object.values(CitationStyle).includes(savedStyle as CitationStyle)) {
      setState(prev => ({ ...prev, selectedStyle: savedStyle as CitationStyle }))
    }
  }, [])

  // Save citation style preference
  useEffect(() => {
    localStorage.setItem('referencer-citation-style', state.selectedStyle)
  }, [state.selectedStyle])

  const handleTabChange = (tab: ReferencerTab) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }

  const handleStyleChange = (style: CitationStyle) => {
    setState(prev => ({ ...prev, selectedStyle: style }))
  }

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  const handleFilterChange = (filterType: string) => {
    setState(prev => ({ ...prev, filterType: filterType as any }))
  }

  const handleAddReference = () => {
    setState(prev => ({
      ...prev,
      showForm: true,
      editingReference: null,
      activeTab: 'references'
    }))
  }

  const handleEditReference = (referenceId: string) => {
    setState(prev => ({
      ...prev,
      showForm: true,
      editingReference: referenceId,
      activeTab: 'references'
    }))
  }

  const handleFormClose = () => {
    setState(prev => ({
      ...prev,
      showForm: false,
      editingReference: null
    }))
  }

  const getTabIcon = (tab: ReferencerTab) => {
    switch (tab) {
      case 'references':
        return <BookOpen className="h-4 w-4" />
      case 'citations':
        return <Quote className="h-4 w-4" />
      case 'bibliography':
        return <FileText className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'references':
        return (
          <div className="space-y-4">
            {state.showForm ? (
              <div className="border rounded-lg p-4">
                <ReferenceForm
                  conversationId={currentConversation.id}
                  referenceId={state.editingReference || undefined}
                  onClose={handleFormClose}
                  citationStyle={state.selectedStyle}
                />
              </div>
            ) : (
              <ReferenceList
                conversationId={currentConversation.id}
                searchQuery={state.searchQuery}
                filterType={state.filterType}
                onEdit={handleEditReference}
                citationStyle={state.selectedStyle}
              />
            )}
          </div>
        )

      case 'citations':
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Citation Formatter
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Format citations and insert them into your document
              </p>
              <div className="text-center py-8">
                <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Citation formatting features will be implemented here
                </p>
              </div>
            </div>
          </div>
        )

      case 'bibliography':
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bibliography Generator
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate and export bibliographies in different formats
              </p>
              <div className="space-y-6">
                <BibliographyControls />
                <Separator />
                <ExportOptionsComponent />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[900px] w-full">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reference Manager
              </SheetTitle>
              <SheetDescription>
                Manage references for "{currentConversation.title}"
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {state.selectedStyle.toUpperCase()}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Global Controls */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-sm"
            />
          </div>
          <Select value={state.filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="journal_article">Journal Articles</SelectItem>
              <SelectItem value="book">Books</SelectItem>
              <SelectItem value="website">Websites</SelectItem>
              <SelectItem value="conference_paper">Conference Papers</SelectItem>
              <SelectItem value="thesis">Theses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={state.selectedStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-24">
              <Settings className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CitationStyle.APA}>APA</SelectItem>
              <SelectItem value={CitationStyle.MLA}>MLA</SelectItem>
              <SelectItem value={CitationStyle.CHICAGO}>Chicago</SelectItem>
              <SelectItem value={CitationStyle.HARVARD}>Harvard</SelectItem>
              <SelectItem value={CitationStyle.IEEE}>IEEE</SelectItem>
              <SelectItem value={CitationStyle.VANCOUVER}>Vancouver</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddReference} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-4 border-b">
            {(['references', 'citations', 'bibliography'] as const).map((tab) => (
              <Button
                key={tab}
                variant={state.activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab)}
                className="flex items-center gap-2 capitalize"
              >
                {getTabIcon(tab)}
                {tab}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
