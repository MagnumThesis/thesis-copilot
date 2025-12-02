"use client"

import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { 
  Ban, 
  ChevronRight, 
  Code2, 
  Loader2, 
  Terminal,
  Lightbulb,
  FileText,
  AlertTriangle,
  BookOpen
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible"
import { FilePreview } from "@/components/ui/file-preview"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { Badge } from "@/components/ui/shadcn/badge"

const chatBubbleVariants = cva(
  "group/message relative break-words rounded-lg p-3 text-sm sm:max-w-[70%]",
  {
    variants: {
      isUser: {
        true: "bg-primary text-primary-foreground",
        false: "bg-muted text-foreground",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

interface Attachment {
  name?: string
  contentType?: string
  url: string
}

interface PartialToolCall {
  state: "partial-call"
  toolName: string
}

interface ToolCall {
  state: "call"
  toolName: string
}

interface ToolResult {
  state: "result"
  toolName: string
  result: {
    __cancelled?: boolean
    [key: string]: any
  }
}

type ToolInvocation = PartialToolCall | ToolCall | ToolResult

interface ReasoningPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocation
}

interface TextPart {
  type: "text"
  text: string
}

// For compatibility with AI SDK types, not used
interface SourcePart {
  type: "source"
  source?: any
}

interface FilePart {
  type: "file"
  mimeType: string
  data: string
}

interface StepStartPart {
  type: "step-start"
}

type MessagePart =
  | TextPart
  | ReasoningPart
  | ToolInvocationPart
  | SourcePart
  | FilePart
  | StepStartPart

export interface Message {
  id: string
  role: "user" | "assistant" | (string & {})
  content: string
  createdAt?: Date
  experimental_attachments?: Attachment[]
  toolInvocations?: ToolInvocation[]
  parts?: MessagePart[]
}

export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean
  animation?: Animation
  actions?: React.ReactNode
}

/**
 * Displays a single chat message, handling different roles (user/assistant), content types (text, tool invocations, reasoning), and attachments.
 * It supports markdown rendering and optional timestamp display.
 * @param {ChatMessageProps} props - The properties for the ChatMessage component.
 * @param {string} props.id - The unique ID of the message.
 * @param {"user" | "assistant" | (string & {})} props.role - The role of the message sender (e.g., "user", "assistant").
 * @param {string} props.content - The main text content of the message.
 * @param {Date} [props.createdAt] - The timestamp when the message was created.
 * @param {boolean} [props.showTimeStamp=false] - If true, displays the creation timestamp.
 * @param {Animation} [props.animation="scale"] - The animation style for the chat bubble.
 * @param {React.ReactNode} [props.actions] - Optional React nodes to display as actions within the message bubble.
 * @param {Attachment[]} [props.experimental_attachments] - Experimental attachments associated with the message.
 * @param {ToolInvocation[]} [props.toolInvocations] - Tool invocations associated with the message.
 * @param {MessagePart[]} [props.parts] - Structured parts of the message content.
 * @example
 * ```tsx
 * <ChatMessage
 *   id="1"
 *   role="user"
 *   content="Hello, how are you?"
 *   createdAt={new Date()}
 *   showTimeStamp={true}
 * />
 *
 * <ChatMessage
 *   id="2"
 *   role="assistant"
 *   content="I'm doing great! How can I help you today?"
 *   createdAt={new Date()}
 *   showTimeStamp={true}
 * />
 * ```
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "scale",
  actions,
  experimental_attachments,
  toolInvocations,
  parts,
}) => {
  const files = useMemo(() => {
    return experimental_attachments?.map((attachment) => {
      const dataArray = dataUrlToUint8Array(attachment.url)
      const file = new File([dataArray], attachment.name ?? "Unknown", {
        type: attachment.contentType,
      })
      return file
    })
  }, [experimental_attachments])

  const isUser = role === "user"

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Parse attached context from user messages
  const { displayContent, attachedContext } = useMemo(() => {
    if (!isUser || !content) return { displayContent: content, attachedContext: null }
    
    // Check if message contains attached context
    const contextMatch = content.match(/^([\s\S]*?)\n\n---\n\*\*Context from attached items:\*\*\n([\s\S]*?)\n---\n\n$/)
    
    if (contextMatch) {
      const userText = contextMatch[1].trim()
      const contextText = contextMatch[2].trim()
      
      // Parse the context to extract attachment info
      const attachments: Array<{type: string; count: number; items: string[]}> = []
      
      // Parse ideas
      const ideasMatch = contextText.match(/\*\*Attached Ideas:\*\*\n([\s\S]*?)(?=\n\*\*Attached|$)/)
      if (ideasMatch) {
        const items = ideasMatch[1].split('\n').filter(line => line.startsWith('- **')).map(line => {
          const match = line.match(/- \*\*([^*]+)\*\*/)
          return match ? match[1] : ''
        }).filter(Boolean)
        if (items.length) attachments.push({ type: 'idea', count: items.length, items })
      }
      
      // Parse content
      const contentMatch = contextText.match(/\*\*Attached Content:\*\*/)
      if (contentMatch) {
        attachments.push({ type: 'content', count: 1, items: ['Builder Content'] })
      }
      
      // Parse concerns
      const concernsMatch = contextText.match(/\*\*Attached Concerns:\*\*\n([\s\S]*?)(?=\n\*\*Attached|$)/)
      if (concernsMatch) {
        const items = concernsMatch[1].split('\n').filter(line => line.startsWith('- **[')).map(line => {
          const match = line.match(/- \*\*\[([^\]]+)\]\*\*/)
          return match ? match[1] : ''
        }).filter(Boolean)
        if (items.length) attachments.push({ type: 'concern', count: items.length, items })
      }
      
      // Parse references
      const referencesMatch = contextText.match(/\*\*Attached References:\*\*\n([\s\S]*?)(?=\n\*\*Attached|$)/)
      if (referencesMatch) {
        const items = referencesMatch[1].split('\n').filter(line => line.startsWith('- ')).map(line => {
          const match = line.match(/- [^"]*"([^"]+)"/)
          return match ? match[1].substring(0, 50) + (match[1].length > 50 ? '...' : '') : ''
        }).filter(Boolean)
        if (items.length) attachments.push({ type: 'reference', count: items.length, items })
      }
      
      return { displayContent: userText, attachedContext: attachments.length > 0 ? attachments : null }
    }
    
    return { displayContent: content, attachedContext: null }
  }, [content, isUser])

  if (isUser) {
    return (
      <div
        className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
      >
        {files ? (
          <div className="mb-1 flex flex-wrap gap-2">
            {files.map((file, index) => {
              return <FilePreview file={file} key={index} />
            })}
          </div>
        ) : null}

        {/* Display attached items */}
        {attachedContext && attachedContext.length > 0 && (
          <AttachedContextDisplay attachments={attachedContext} />
        )}

        <div className={cn(chatBubbleVariants({ isUser, animation }))}>
          <MarkdownRenderer>{displayContent}</MarkdownRenderer>
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className={cn(
              "mt-1 block px-1 text-xs opacity-50",
              animation !== "none" && "duration-500 animate-in fade-in-0"
            )}
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    )
  }

  if (parts && parts.length > 0) {
    return parts.map((part, index) => {
      if (part.type === "text") {
        return (
          <div
            className={cn(
              "flex flex-col",
              isUser ? "items-end" : "items-start"
            )}
            key={`text-${index}`}
          >
            <div className={cn(chatBubbleVariants({ isUser, animation }))}>
              <MarkdownRenderer>{part.text}</MarkdownRenderer>
              {actions ? (
                <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
                  {actions}
                </div>
              ) : null}
            </div>

            {showTimeStamp && createdAt ? (
              <time
                dateTime={createdAt.toISOString()}
                className={cn(
                  "mt-1 block px-1 text-xs opacity-50",
                  animation !== "none" && "duration-500 animate-in fade-in-0"
                )}
              >
                {formattedTime}
              </time>
            ) : null}
          </div>
        )
      } else if (part.type === "reasoning") {
        return <ReasoningBlock key={`reasoning-${index}`} part={part} />
      } else if (part.type === "tool-invocation") {
        return (
          <ToolCall
            key={`tool-${index}`}
            toolInvocations={[part.toolInvocation]}
          />
        )
      }
      return null
    })
  }

  if (toolInvocations && toolInvocations.length > 0) {
    return <ToolCall toolInvocations={toolInvocations} />
  }

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div className={cn(chatBubbleVariants({ isUser, animation }))}>
        <MarkdownRenderer>{content}</MarkdownRenderer>
        {actions ? (
          <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      {showTimeStamp && createdAt ? (
        <time
          dateTime={createdAt.toISOString()}
          className={cn(
            "mt-1 block px-1 text-xs opacity-50",
            animation !== "none" && "duration-500 animate-in fade-in-0"
          )}
        >
          {formattedTime}
        </time>
      ) : null}
    </div>
  )
}

function dataUrlToUint8Array(data: string): Uint8Array {
  // Handle data URLs by extracting the base64 portion
  const base64 = data.split(",")[1] || data
  
  // Use browser-compatible atob() instead of Node.js Buffer
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Displays a collapsible block for AI reasoning or thought processes.
 * @param {object} props - The properties for the ReasoningBlock component.
 * @param {ReasoningPart} props.part - The reasoning part of the message content.
 * @example
 * ```tsx
 * <ReasoningBlock part={{ type: "reasoning", reasoning: "The AI is thinking about the best approach to generate the content." }} />
 * ```
 */
const ReasoningBlock = ({ part }: { part: ReasoningPart }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mb-2 flex flex-col items-start sm:max-w-[70%]">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group w-full overflow-hidden rounded-lg border bg-muted/50"
      >
        <div className="flex items-center p-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
              <span>Thinking</span>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent forceMount>
          <motion.div
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t"
          >
            <div className="p-2">
              <div className="whitespace-pre-wrap text-xs">
                {part.reasoning}
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/**
 * Displays the invocation and results of AI tool calls.
 * It shows the tool name, status (calling, cancelled, result), and the output of the tool.
 * @param {object} props - The properties for the ToolCall component.
 * @param {ToolInvocation[]} props.toolInvocations - An array of tool invocation objects to display.
 * @example
 * ```tsx
 * <ToolCall toolInvocations={[{ state: "call", toolName: "search_web" }]} />
 *
 * <ToolCall toolInvocations={[{ state: "result", toolName: "search_web", result: { data: "Some search results" } }]} />
 * ```
 */
function ToolCall({
  toolInvocations,
}: Pick<ChatMessageProps, "toolInvocations">) {
  if (!toolInvocations?.length) return null

  return (
    <div className="flex flex-col items-start gap-2">
      {toolInvocations.map((invocation, index) => {
        const isCancelled =
          invocation.state === "result" &&
          invocation.result.__cancelled === true

        if (isCancelled) {
          return (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
            >
              <Ban className="h-4 w-4" />
              <span>
                Cancelled{" "}
                <span className="font-mono">
                  {"`"}
                  {invocation.toolName}
                  {"`"}
                </span>
              </span>
            </div>
          )
        }

        switch (invocation.state) {
          case "partial-call":
          case "call":
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              >
                <Terminal className="h-4 w-4" />
                <span>
                  Calling{" "}
                  <span className="font-mono">
                    {"`"}
                    {invocation.toolName}
                    {"`"}
                  </span>
                  ...
                </span>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )
          case "result":
            return (
              <div
                key={index}
                className="flex flex-col gap-1.5 rounded-lg border bg-muted/50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Code2 className="h-4 w-4" />
                  <span>
                    Result from{" "}
                    <span className="font-mono">
                      {"`"}
                      {invocation.toolName}
                      {"`"}
                    </span>
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-foreground">
                  {JSON.stringify(invocation.result, null, 2)}
                </pre>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

/**
 * Displays attached context items (ideas, content, concerns, references) in a compact format
 */
interface AttachedContextDisplayProps {
  attachments: Array<{type: string; count: number; items: string[]}>
}

function AttachedContextDisplay({ attachments }: AttachedContextDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = (type: string) => {
    switch (type) {
      case 'idea':
        return <Lightbulb className="h-3 w-3 text-yellow-500" />
      case 'content':
        return <FileText className="h-3 w-3 text-blue-500" />
      case 'concern':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />
      case 'reference':
        return <BookOpen className="h-3 w-3 text-green-500" />
      default:
        return null
    }
  }

  const getLabel = (type: string, count: number) => {
    const labels: Record<string, string> = {
      idea: count === 1 ? 'Idea' : 'Ideas',
      content: 'Content',
      concern: count === 1 ? 'Concern' : 'Concerns',
      reference: count === 1 ? 'Reference' : 'References',
    }
    return `${count} ${labels[type] || type}`
  }

  return (
    <div className="mb-2 flex flex-col items-end gap-1">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <span className="font-medium">Attached:</span>
            {attachments.map((attachment, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1 text-xs py-0 h-5"
              >
                {getIcon(attachment.type)}
                {getLabel(attachment.type, attachment.count)}
              </Badge>
            ))}
            <ChevronRight 
              className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-90"
              )} 
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 rounded-lg border bg-muted/30 p-2 text-xs max-w-md"
          >
            {attachments.map((attachment, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <div className="flex items-center gap-1 font-medium text-muted-foreground mb-1">
                  {getIcon(attachment.type)}
                  <span>{getLabel(attachment.type, attachment.count)}</span>
                </div>
                <ul className="pl-4 space-y-0.5">
                  {attachment.items.slice(0, 3).map((item, itemIndex) => (
                    <li key={itemIndex} className="text-foreground truncate">
                      • {item}
                    </li>
                  ))}
                  {attachment.items.length > 3 && (
                    <li className="text-muted-foreground italic">
                      +{attachment.items.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
