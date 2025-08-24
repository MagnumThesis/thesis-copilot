/**
 * Citation Preview Component
 * Displays formatted inline citations and bibliography entries
 */

import React, { useState } from 'react';
import { Button } from './shadcn/button.js';
import { Badge } from './shadcn/badge.js';
import { Separator } from './shadcn/separator.js';
import { Copy, ExternalLink, Check, RotateCcw } from 'lucide-react';

export interface CitationPreviewProps {
  inlineCitation: string;
  bibliographyEntry: string;
  isProcessing?: boolean;
  error?: string | null;
  className?: string;
  onCopyInline?: (text: string) => Promise<boolean>;
  onCopyBibliography?: (text: string) => Promise<boolean>;
  onInsertInline?: (text: string) => Promise<boolean>;
  onInsertBibliography?: (text: string) => Promise<boolean>;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * Displays formatted inline citations and bibliography entries.
 * It provides options to copy or insert the formatted text into the document.
 * @param {CitationPreviewProps} props - The properties for the CitationPreview component.
 * @param {string} props.inlineCitation - The formatted inline citation string.
 * @param {string} props.bibliographyEntry - The formatted bibliography entry string.
 * @param {boolean} [props.isProcessing=false] - Indicates whether the citation is currently being processed.
 * @param {string | null} [props.error=null] - An optional error message if formatting failed.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the component container.
 * @param {(text: string) => Promise<boolean>} [props.onCopyInline] - Callback to copy the inline citation to clipboard.
 * @param {(text: string) => Promise<boolean>} [props.onCopyBibliography] - Callback to copy the bibliography entry to clipboard.
 * @param {(text: string) => Promise<boolean>} [props.onInsertInline] - Callback to insert the inline citation into the document.
 * @param {(text: string) => Promise<boolean>} [props.onInsertBibliography] - Callback to insert the bibliography entry into the document.
 * @param {boolean} [props.showActions=true] - Whether to show action buttons (copy, insert).
 * @param {boolean} [props.compact=false] - Whether to render in a compact layout.
 * @example
 * ```tsx
 * <CitationPreview
 *   inlineCitation="(Smith, 2023)"
 *   bibliographyEntry="Smith, J. (2023). Title of article. Journal Name, 1(1), 1-10."
 *   onCopyInline={async (text) => { console.log('Copied inline:', text); return true; }}
 *   onInsertInline={async (text) => { console.log('Inserted inline:', text); return true; }}
 * />
 * ```
 */
export const CitationPreview: React.FC<CitationPreviewProps> = ({
  inlineCitation,
  bibliographyEntry,
  isProcessing = false,
  error = null,
  className = '',
  onCopyInline,
  onCopyBibliography,
  onInsertInline,
  onInsertBibliography,
  showActions = true,
  compact = false
}) => {
  const [copiedInline, setCopiedInline] = useState(false);
  const [copiedBibliography, setCopiedBibliography] = useState(false);
  const [insertedInline, setInsertedInline] = useState(false);
  const [insertedBibliography, setInsertedBibliography] = useState(false);

  const hasContent = inlineCitation || bibliographyEntry;
  const hasError = !!error;

  const handleCopyInline = async () => {
    if (!inlineCitation || !onCopyInline) return;

    const success = await onCopyInline(inlineCitation);
    if (success) {
      setCopiedInline(true);
      setTimeout(() => setCopiedInline(false), 2000);
    }
  };

  const handleCopyBibliography = async () => {
    if (!bibliographyEntry || !onCopyBibliography) return;

    const success = await onCopyBibliography(bibliographyEntry);
    if (success) {
      setCopiedBibliography(true);
      setTimeout(() => setCopiedBibliography(false), 2000);
    }
  };

  const handleInsertInline = async () => {
    if (!inlineCitation || !onInsertInline) return;

    const success = await onInsertInline(inlineCitation);
    if (success) {
      setInsertedInline(true);
      setTimeout(() => setInsertedInline(false), 2000);
    }
  };

  const handleInsertBibliography = async () => {
    if (!bibliographyEntry || !onInsertBibliography) return;

    const success = await onInsertBibliography(bibliographyEntry);
    if (success) {
      setInsertedBibliography(true);
      setTimeout(() => setInsertedBibliography(false), 2000);
    }
  };

  const renderActionButton = (
    onClick: () => void,
    isSuccess: boolean,
    successText: string,
    defaultText: string,
    icon: React.ReactNode,
    variant: 'default' | 'outline' | 'secondary' = 'outline'
  ) => (
    <Button
      onClick={onClick}
      disabled={isProcessing}
      size={compact ? 'sm' : 'default'}
      variant={isSuccess ? 'default' : variant}
      className={compact ? 'h-8 px-2' : ''}
    >
      {isSuccess ? (
        <>
          <Check className={compact ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'} />
          {successText}
        </>
      ) : (
        <>
          {icon}
          {defaultText}
        </>
      )}
    </Button>
  );

  const renderInlineCitationCard = () => {
    if (!inlineCitation) return null;

    return (
      <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${compact ? 'p-2' : 'p-6'}`}>
        <div className={compact ? 'p-2 pb-1' : 'pb-2'}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold leading-none tracking-tight ${compact ? 'text-sm' : 'text-base'}`}>
              Inline Citation
            </h3>
            <Badge variant="secondary" className="text-xs">
              In-text
            </Badge>
          </div>
        </div>
        <div className={compact ? 'p-2 pt-1' : 'pt-0'}>
          <div className="space-y-3">
            {/* Citation text */}
            <div className="p-3 bg-muted/50 rounded-md border">
              <p className={`font-mono text-sm ${compact ? 'text-xs' : ''} break-words`}>
                {inlineCitation}
              </p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex flex-wrap gap-2">
                {onCopyInline && renderActionButton(
                  handleCopyInline,
                  copiedInline,
                  'Copied!',
                  'Copy',
                  <Copy className={compact ? 'h-3 w-3' : 'h-4 w-4'} />,
                  'outline'
                )}
                {onInsertInline && renderActionButton(
                  handleInsertInline,
                  insertedInline,
                  'Inserted!',
                  'Insert',
                  <ExternalLink className={compact ? 'h-3 w-3' : 'h-4 w-4'} />,
                  'default'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBibliographyCard = () => {
    if (!bibliographyEntry) return null;

    return (
      <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${compact ? 'p-2' : 'p-6'}`}>
        <div className={compact ? 'p-2 pb-1' : 'pb-2'}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold leading-none tracking-tight ${compact ? 'text-sm' : 'text-base'}`}>
              Bibliography Entry
            </h3>
            <Badge variant="outline" className="text-xs">
              Reference List
            </Badge>
          </div>
        </div>
        <div className={compact ? 'p-2 pt-1' : 'pt-0'}>
          <div className="space-y-3">
            {/* Citation text */}
            <div className="p-3 bg-muted/50 rounded-md border">
              <p className={`text-sm ${compact ? 'text-xs' : ''} leading-relaxed break-words`}>
                {bibliographyEntry}
              </p>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex flex-wrap gap-2">
                {onCopyBibliography && renderActionButton(
                  handleCopyBibliography,
                  copiedBibliography,
                  'Copied!',
                  'Copy',
                  <Copy className={compact ? 'h-3 w-3' : 'h-4 w-4'} />,
                  'outline'
                )}
                {onInsertBibliography && renderActionButton(
                  handleInsertBibliography,
                  insertedBibliography,
                  'Inserted!',
                  'Insert',
                  <ExternalLink className={compact ? 'h-3 w-3' : 'h-4 w-4'} />,
                  'default'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderErrorCard = () => {
    if (!hasError) return null;

    return (
      <div className={`bg-card text-card-foreground rounded-lg border border-red-200 shadow-sm ${compact ? 'p-2' : 'p-6'}`}>
        <div className={compact ? 'p-2' : 'p-3'}>
          <div className="flex items-center gap-2 text-red-600">
            <RotateCcw className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            <span className={compact ? 'text-xs' : 'text-sm'}>
              {error}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingCard = () => {
    if (!isProcessing) return null;

    return (
      <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${compact ? 'p-2' : 'p-6'}`}>
        <div className={compact ? 'p-2' : 'p-3'}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <RotateCcw className={`animate-spin ${compact ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <span className={compact ? 'text-xs' : 'text-sm'}>
              Formatting citation...
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (hasContent || hasError || isProcessing) return null;

    return (
      <div className={`bg-card text-card-foreground rounded-lg border border-dashed shadow-sm ${compact ? 'p-2' : 'p-6'}`}>
        <div className={compact ? 'p-2' : 'p-6 text-center'}>
          <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            Select a reference and citation style to see the formatted citation here.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error state */}
      {renderErrorCard()}

      {/* Processing state */}
      {renderProcessingCard()}

      {/* Empty state */}
      {renderEmptyState()}

      {/* Citations */}
      {hasContent && (
        <div className="space-y-4">
          {renderInlineCitationCard()}
          {inlineCitation && bibliographyEntry && <Separator />}
          {renderBibliographyCard()}
        </div>
      )}
    </div>
  );
};

export default CitationPreview;
