"use client"

import React, { useState, useEffect } from "react"
import { 
  Lightbulb, 
  FileText, 
  AlertTriangle, 
  BookOpen, 
  Paperclip,
  Check,
  X,
  Loader2,
  Pencil,
  Sparkles
} from "lucide-react"

import { Button } from "@/components/ui/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Checkbox } from "@/components/ui/shadcn/checkbox"
import { Badge } from "@/components/ui/shadcn/badge"
import { Input } from "@/components/ui/shadcn/input"
import { fetchIdeas, updateIdea, regenerateIdeaTitle } from "@/lib/idea-api"
import { IdeaDefinition } from "@/lib/ai-types"
import { ProofreadingConcern } from "@/lib/types/shared/common"
import { Reference } from "@/lib/types/citation-types/reference-types"
import { toast } from "sonner"

/**
 * Represents an attached item from various sources (ideas, content, concerns, references)
 */
export interface AttachedItem {
  id: string
  type: "idea" | "content" | "concern" | "reference"
  title: string
  description?: string
  data: IdeaDefinition | string | ProofreadingConcern | Reference
}

interface AttachmentMenuProps {
  conversationId: string
  attachedItems: AttachedItem[]
  onAttachedItemsChange: (items: AttachedItem[]) => void
  onFileUpload: () => Promise<void>
}

/**
 * @component AttachmentMenu
 * @description A dropdown menu for attaching various types of content to chat messages.
 * Includes options to attach files, ideas, content (from Builder), concerns, and references.
 */
export function AttachmentMenu({
  conversationId,
  attachedItems,
  onAttachedItemsChange,
  onFileUpload,
}: AttachmentMenuProps) {
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false)
  const [contentDialogOpen, setContentDialogOpen] = useState(false)
  const [concernDialogOpen, setConcernDialogOpen] = useState(false)
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false)

  const handleAttachItem = (item: AttachedItem) => {
    const exists = attachedItems.some(
      (existing) => existing.id === item.id && existing.type === item.type
    )
    if (!exists) {
      onAttachedItemsChange([...attachedItems, item])
    }
  }

  const handleRemoveItem = (itemId: string, itemType: string) => {
    onAttachedItemsChange(
      attachedItems.filter((item) => !(item.id === itemId && item.type === itemType))
    )
  }

  const getAttachedCount = () => attachedItems.length

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 relative"
            aria-label="Attach content"
          >
            <Paperclip className="h-4 w-4" />
            {getAttachedCount() > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {getAttachedCount()}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Attach Content</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onFileUpload}>
            <Paperclip className="mr-2 h-4 w-4" />
            <span>Attach File</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIdeaDialogOpen(true)}>
            <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Attach Idea</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setContentDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4 text-blue-500" />
            <span>Attach Content</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setConcernDialogOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
            <span>Attach Concern</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setReferenceDialogOpen(true)}>
            <BookOpen className="mr-2 h-4 w-4 text-green-500" />
            <span>Attach Reference</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Idea Selector Dialog */}
      <IdeaSelectorDialog
        open={ideaDialogOpen}
        onOpenChange={setIdeaDialogOpen}
        conversationId={conversationId}
        selectedItems={attachedItems.filter((item) => item.type === "idea")}
        onSelect={handleAttachItem}
        onRemove={(id) => handleRemoveItem(id, "idea")}
      />

      {/* Content Selector Dialog */}
      <ContentSelectorDialog
        open={contentDialogOpen}
        onOpenChange={setContentDialogOpen}
        conversationId={conversationId}
        selectedItems={attachedItems.filter((item) => item.type === "content")}
        onSelect={handleAttachItem}
        onRemove={(id) => handleRemoveItem(id, "content")}
      />

      {/* Concern Selector Dialog */}
      <ConcernSelectorDialog
        open={concernDialogOpen}
        onOpenChange={setConcernDialogOpen}
        conversationId={conversationId}
        selectedItems={attachedItems.filter((item) => item.type === "concern")}
        onSelect={handleAttachItem}
        onRemove={(id) => handleRemoveItem(id, "concern")}
      />

      {/* Reference Selector Dialog */}
      <ReferenceSelectorDialog
        open={referenceDialogOpen}
        onOpenChange={setReferenceDialogOpen}
        conversationId={conversationId}
        selectedItems={attachedItems.filter((item) => item.type === "reference")}
        onSelect={handleAttachItem}
        onRemove={(id) => handleRemoveItem(id, "reference")}
      />
    </>
  )
}

// ====================
// Idea Selector Dialog
// ====================

interface IdeaSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  selectedItems: AttachedItem[]
  onSelect: (item: AttachedItem) => void
  onRemove: (id: string) => void
}

function IdeaSelectorDialog({
  open,
  onOpenChange,
  conversationId,
  selectedItems,
  onSelect,
  onRemove,
}: IdeaSelectorDialogProps) {
  const [ideas, setIdeas] = useState<IdeaDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [regeneratingId, setRegeneratingId] = useState<string | number | null>(null)

  useEffect(() => {
    if (open && conversationId) {
      loadIdeas()
    }
  }, [open, conversationId])

  const loadIdeas = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedIdeas = await fetchIdeas(conversationId)
      setIdeas(fetchedIdeas)
    } catch (err) {
      setError("Failed to load ideas")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (id: string | number) => 
    selectedItems.some((item) => item.id === String(id))

  const handleToggle = (idea: IdeaDefinition) => {
    const ideaId = String(idea.id)
    if (isSelected(idea.id)) {
      onRemove(ideaId)
    } else {
      onSelect({
        id: ideaId,
        type: "idea",
        title: idea.title,
        description: idea.description,
        data: idea,
      })
    }
  }

  const handleStartEdit = (idea: IdeaDefinition, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(idea.id)
    setEditingTitle(idea.title)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditingTitle("")
  }

  const handleSaveEdit = async (idea: IdeaDefinition, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty")
      return
    }

    try {
      setIsUpdating(true)
      await updateIdea(Number(idea.id), { title: editingTitle.trim() })
      setIdeas(prev => prev.map(i => 
        i.id === idea.id ? { ...i, title: editingTitle.trim() } : i
      ))
      setEditingId(null)
      setEditingTitle("")
      toast.success("Title updated successfully")
    } catch (err) {
      console.error("Failed to update title:", err)
      toast.error("Failed to update title")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRegenerateTitle = async (idea: IdeaDefinition, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!idea.description) {
      toast.error("Cannot regenerate title without a description")
      return
    }

    try {
      setRegeneratingId(idea.id)
      const result = await regenerateIdeaTitle(Number(idea.id), idea.description, conversationId)
      setIdeas(prev => prev.map(i => 
        i.id === idea.id ? { ...i, title: result.title } : i
      ))
      toast.success("Title regenerated successfully")
    } catch (err) {
      console.error("Failed to regenerate title:", err)
      toast.error("Failed to regenerate title")
    } finally {
      setRegeneratingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Attach Ideas
          </DialogTitle>
          <DialogDescription>
            Select ideas to include as context in your message.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-4">{error}</div>
          ) : ideas.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No ideas found. Create ideas in the Idealist tool first.
            </div>
          ) : (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected(idea.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected(idea.id)}
                    onCheckedChange={() => handleToggle(idea)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    {editingId === idea.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          disabled={isUpdating}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(idea, e as unknown as React.MouseEvent)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit(e as unknown as React.MouseEvent)
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleSaveEdit(idea, e)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-medium text-sm truncate flex-1 cursor-pointer"
                          onClick={() => handleToggle(idea)}
                        >
                          {idea.title}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {idea.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => handleStartEdit(idea, e)}
                          title="Edit title"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => handleRegenerateTitle(idea, e)}
                          disabled={regeneratingId === idea.id || !idea.description}
                          title="Regenerate title with AI"
                        >
                          {regeneratingId === idea.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    {idea.description && (
                      <p 
                        className="text-xs text-muted-foreground mt-1 line-clamp-2 cursor-pointer"
                        onClick={() => handleToggle(idea)}
                      >
                        {idea.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =======================
// Content Selector Dialog
// =======================

interface ContentSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  selectedItems: AttachedItem[]
  onSelect: (item: AttachedItem) => void
  onRemove: (id: string) => void
}

function ContentSelectorDialog({
  open,
  onOpenChange,
  conversationId,
  selectedItems,
  onSelect,
  onRemove,
}: ContentSelectorDialogProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && conversationId) {
      loadContent()
    }
  }, [open, conversationId])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/builder-content/${encodeURIComponent(conversationId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.content) {
          setContent(data.content)
        } else {
          setContent(null)
        }
      } else {
        setContent(null)
      }
    } catch (err) {
      setError("Failed to load content")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isSelected = selectedItems.some((item) => item.id === "builder-content")

  const handleToggle = () => {
    if (isSelected) {
      onRemove("builder-content")
    } else if (content) {
      onSelect({
        id: "builder-content",
        type: "content",
        title: "Builder Content",
        description: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
        data: content,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Attach Content
          </DialogTitle>
          <DialogDescription>
            Attach your Builder document content to provide context.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-4">{error}</div>
          ) : !content ? (
            <div className="text-center text-muted-foreground py-4">
              No content found. Create content in the Builder tool first.
            </div>
          ) : (
            <div
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
              onClick={handleToggle}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={isSelected} onCheckedChange={handleToggle} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">Builder Content</div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-4">
                    {content}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {content.split(/\s+/).length} words
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =======================
// Concern Selector Dialog
// =======================

interface ConcernSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  selectedItems: AttachedItem[]
  onSelect: (item: AttachedItem) => void
  onRemove: (id: string) => void
}

function ConcernSelectorDialog({
  open,
  onOpenChange,
  conversationId,
  selectedItems,
  onSelect,
  onRemove,
}: ConcernSelectorDialogProps) {
  const [concerns, setConcerns] = useState<ProofreadingConcern[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && conversationId) {
      loadConcerns()
    }
  }, [open, conversationId])

  const loadConcerns = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/proofreader/concerns/${encodeURIComponent(conversationId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.concerns)) {
          setConcerns(data.concerns)
        } else {
          setConcerns([])
        }
      } else {
        setConcerns([])
      }
    } catch (err) {
      setError("Failed to load concerns")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (id: string) => 
    selectedItems.some((item) => item.id === id)

  const handleToggle = (concern: ProofreadingConcern) => {
    if (isSelected(concern.id)) {
      onRemove(concern.id)
    } else {
      onSelect({
        id: concern.id,
        type: "concern",
        title: `${concern.category}: ${concern.text.substring(0, 50)}...`,
        description: concern.explanation,
        data: concern,
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-500"
      case "high":
        return "text-orange-500"
      case "medium":
        return "text-yellow-500"
      default:
        return "text-blue-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Attach Concerns
          </DialogTitle>
          <DialogDescription>
            Select proofreading concerns to discuss with the AI.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-4">{error}</div>
          ) : concerns.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No concerns found. Run the Proofreader tool first.
            </div>
          ) : (
            <div className="space-y-2">
              {concerns.map((concern) => (
                <div
                  key={concern.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected(concern.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggle(concern)}
                >
                  <Checkbox
                    checked={isSelected(concern.id)}
                    onCheckedChange={() => handleToggle(concern)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {concern.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getSeverityColor(concern.severity)}`}
                      >
                        {concern.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{concern.text}</p>
                    {concern.explanation && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {concern.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =========================
// Reference Selector Dialog
// =========================

interface ReferenceSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  selectedItems: AttachedItem[]
  onSelect: (item: AttachedItem) => void
  onRemove: (id: string) => void
}

function ReferenceSelectorDialog({
  open,
  onOpenChange,
  conversationId,
  selectedItems,
  onSelect,
  onRemove,
}: ReferenceSelectorDialogProps) {
  const [references, setReferences] = useState<Reference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && conversationId) {
      loadReferences()
    }
  }, [open, conversationId])

  const loadReferences = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use correct API path: /api/referencer/references/:conversationId
      const response = await fetch(`/api/referencer/references/${encodeURIComponent(conversationId)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.references)) {
          setReferences(data.references)
        } else if (Array.isArray(data)) {
          setReferences(data)
        } else {
          setReferences([])
        }
      } else {
        setReferences([])
      }
    } catch (err) {
      setError("Failed to load references")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (id: string) => 
    selectedItems.some((item) => item.id === id)

  const handleToggle = (reference: Reference) => {
    if (isSelected(reference.id)) {
      onRemove(reference.id)
    } else {
      const authors = Array.isArray(reference.authors) 
        ? reference.authors.map(a => typeof a === 'string' ? a : `${a.firstName} ${a.lastName}`).join(", ")
        : ""
      onSelect({
        id: reference.id,
        type: "reference",
        title: reference.title,
        description: `${authors}${reference.publication_date ? ` (${new Date(reference.publication_date).getFullYear()})` : ""}`,
        data: reference,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            Attach References
          </DialogTitle>
          <DialogDescription>
            Select references to include in your message context.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-4">{error}</div>
          ) : references.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No references found. Add references in the Referencer tool first.
            </div>
          ) : (
            <div className="space-y-2">
              {references.map((reference) => {
                const authors = Array.isArray(reference.authors) 
                  ? reference.authors.map(a => typeof a === 'string' ? a : `${a.firstName} ${a.lastName}`).join(", ")
                  : ""
                return (
                  <div
                    key={reference.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected(reference.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => handleToggle(reference)}
                  >
                    <Checkbox
                      checked={isSelected(reference.id)}
                      onCheckedChange={() => handleToggle(reference)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {reference.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {reference.type.replace("_", " ")}
                        </Badge>
                      </div>
                      {authors && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {authors}
                        </p>
                      )}
                      {reference.publication_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(reference.publication_date).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
