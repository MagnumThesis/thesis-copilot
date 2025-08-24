"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Textarea } from "./shadcn/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Checkbox } from "./shadcn/checkbox"
import { Badge } from "./shadcn/badge"
import { 
  Share2, 
  Copy, 
  Check, 
  Mail, 
  Link, 
  MessageSquare,
  X,
  Users,
  Clock,
  Eye
} from "lucide-react"
import { ScholarSearchResult } from "../../lib/ai-types"

export interface ShareOptions {
  shareType: 'link' | 'email' | 'embed'
  includeScores: boolean
  includeAbstracts: boolean
  includePersonalNotes: boolean
  expirationDays?: number
  allowComments?: boolean
  requireAuth?: boolean
  customMessage?: string
  recipientEmails?: string[]
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

interface SearchResultSharingProps {
  results: ScholarSearchResult[]
  onShare: (results: ScholarSearchResult[], options: ShareOptions) => Promise<SharedResult>
  onClose?: () => void
  className?: string
}

export const SearchResultSharing: React.FC<SearchResultSharingProps> = ({
  results,
  onShare,
  onClose,
  className = ""
}) => {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    shareType: 'link',
    includeScores: true,
    includeAbstracts: true,
    includePersonalNotes: false,
    expirationDays: 30,
    allowComments: false,
    requireAuth: false,
    customMessage: '',
    recipientEmails: []
  })
  
  const [isSharing, setIsSharing] = useState(false)
  const [sharedResult, setSharedResult] = useState<SharedResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = await onShare(results, shareOptions)
      setSharedResult(result)
    } catch (error) {
      console.error('Sharing failed:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    if (!sharedResult) return

    try {
      await navigator.clipboard.writeText(sharedResult.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleAddEmail = () => {
    if (!emailInput.trim()) return
    
    const emails = emailInput.split(',').map(email => email.trim()).filter(email => email)
    const validEmails = emails.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    
    if (validEmails.length > 0) {
      setShareOptions(prev => ({
        ...prev,
        recipientEmails: [...(prev.recipientEmails || []), ...validEmails]
      }))
      setEmailInput('')
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    setShareOptions(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails?.filter(email => email !== emailToRemove) || []
    }))
  }

  const updateShareOptions = (updates: Partial<ShareOptions>) => {
    setShareOptions(prev => ({ ...prev, ...updates }))
  }

  const getShareTypeIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <Link className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'embed':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Share2 className="h-4 w-4" />
    }
  }

  if (sharedResult) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Results Shared Successfully
              </CardTitle>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Share URL */}
            <div className="space-y-2">
              <Label>Share URL</Label>
              <div className="flex gap-2">
                <Input
                  value={sharedResult.shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Share Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Shared:</span>
                  <span>{results.length} results</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Views:</span>
                  <span>{sharedResult.viewCount}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{sharedResult.createdAt.toLocaleDateString()}</span>
                </div>
                
                {sharedResult.expiresAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Expires:</span>
                    <span>{sharedResult.expiresAt.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Options Summary */}
            <div className="space-y-2">
              <Label>Share Settings</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {shareOptions.shareType === 'link' ? 'Public Link' : 
                   shareOptions.shareType === 'email' ? 'Email Share' : 'Embed Code'}
                </Badge>
                {shareOptions.includeScores && (
                  <Badge variant="outline">Includes Scores</Badge>
                )}
                {shareOptions.includeAbstracts && (
                  <Badge variant="outline">Includes Abstracts</Badge>
                )}
                {shareOptions.allowComments && (
                  <Badge variant="outline">Comments Enabled</Badge>
                )}
                {shareOptions.requireAuth && (
                  <Badge variant="outline">Authentication Required</Badge>
                )}
              </div>
            </div>

            {/* Email Recipients */}
            {shareOptions.shareType === 'email' && shareOptions.recipientEmails && shareOptions.recipientEmails.length > 0 && (
              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <div className="flex flex-wrap gap-2">
                  {shareOptions.recipientEmails.map((email, index) => (
                    <Badge key={index} variant="outline">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Message */}
            {shareOptions.customMessage && (
              <div className="space-y-2">
                <Label>Custom Message</Label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  {shareOptions.customMessage}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Search Results ({results.length} results)
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Share Type Selection */}
          <div className="space-y-2">
            <Label>Share Method</Label>
            <Select 
              value={shareOptions.shareType} 
              onValueChange={(value) => updateShareOptions({ shareType: value as 'link' | 'email' | 'embed' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Public Link - Anyone with the link can view
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Share - Send to specific recipients
                  </div>
                </SelectItem>
                <SelectItem value="embed">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Embed Code - For websites or documents
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Recipients (for email share type) */}
          {shareOptions.shareType === 'email' && (
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email addresses (comma-separated)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddEmail}
                    disabled={!emailInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                
                {shareOptions.recipientEmails && shareOptions.recipientEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {shareOptions.recipientEmails.map((email, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Options */}
          <div className="space-y-3">
            <Label>Content to Include</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-scores"
                  checked={shareOptions.includeScores}
                  onCheckedChange={(checked) => updateShareOptions({ includeScores: !!checked })}
                />
                <Label htmlFor="include-scores" className="text-sm">Include relevance and quality scores</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-abstracts"
                  checked={shareOptions.includeAbstracts}
                  onCheckedChange={(checked) => updateShareOptions({ includeAbstracts: !!checked })}
                />
                <Label htmlFor="include-abstracts" className="text-sm">Include abstracts (when available)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-notes"
                  checked={shareOptions.includePersonalNotes}
                  onCheckedChange={(checked) => updateShareOptions({ includePersonalNotes: !!checked })}
                />
                <Label htmlFor="include-notes" className="text-sm">Include personal notes and bookmarks</Label>
              </div>
            </div>
          </div>

          {/* Access Options */}
          <div className="space-y-3">
            <Label>Access Settings</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="require-auth"
                  checked={shareOptions.requireAuth}
                  onCheckedChange={(checked) => updateShareOptions({ requireAuth: !!checked })}
                />
                <Label htmlFor="require-auth" className="text-sm">Require authentication to view</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-comments"
                  checked={shareOptions.allowComments}
                  onCheckedChange={(checked) => updateShareOptions({ allowComments: !!checked })}
                />
                <Label htmlFor="allow-comments" className="text-sm">Allow viewers to add comments</Label>
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label>Link Expiration</Label>
            <Select 
              value={shareOptions.expirationDays?.toString() || 'never'} 
              onValueChange={(value) => updateShareOptions({ 
                expirationDays: value === 'never' ? undefined : parseInt(value) 
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (optional)</Label>
            <Textarea
              id="custom-message"
              value={shareOptions.customMessage || ''}
              onChange={(e) => updateShareOptions({ customMessage: e.target.value })}
              placeholder="Add a personal message to share with the results..."
              rows={3}
            />
          </div>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={isSharing || results.length === 0 || 
              (shareOptions.shareType === 'email' && (!shareOptions.recipientEmails || shareOptions.recipientEmails.length === 0))}
            className="w-full flex items-center gap-2"
          >
            {getShareTypeIcon(shareOptions.shareType)}
            {isSharing ? 'Creating Share Link...' : `Share ${results.length} Results`}
          </Button>

          {shareOptions.shareType === 'email' && (!shareOptions.recipientEmails || shareOptions.recipientEmails.length === 0) && (
            <p className="text-sm text-muted-foreground text-center">
              Please add at least one email recipient to share via email.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}