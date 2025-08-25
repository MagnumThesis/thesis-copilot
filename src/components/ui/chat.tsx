import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ReactElement,
} from "react"
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/shadcn/button"
import { type Message } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"
import { PromptSuggestions } from "@/components/ui/prompt-suggestions"

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  messages: Array<Message>
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  setMessages?: (messages: any[]) => void
  transcribeAudio?: (blob: Blob) => Promise<string>
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never
  suggestions?: never
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions

/**
 * @component Chat
 * @description A comprehensive chat interface component that displays messages, handles user input, and provides various chat-related functionalities.
 * It integrates with message lists, input fields, and optional prompt suggestions.
 * @param {ChatProps} props - The properties for the Chat component.
 * @param {Message[]} props.messages - An array of message objects to display in the chat.
 * @param {(event?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => void} props.handleSubmit - Callback function to handle message submission.
 * @param {string} props.input - The current value of the message input field.
 * @param {React.ChangeEventHandler<HTMLTextAreaElement>} props.handleInputChange - Event handler for changes in the message input field.
 * @param {boolean} props.isGenerating - Indicates whether an AI response is currently being generated.
 * @param {() => void} [props.stop] - Optional callback function to stop the current generation.
 * @param {(messageId: string, rating: "thumbs-up" | "thumbs-down") => void} [props.onRateResponse] - Optional callback function to rate a message.
 * @param {(messages: any[]) => void} [props.setMessages] - Optional setter for messages state, used for internal message manipulation (e.g., cancelling tool calls).
 * @param {(blob: Blob) => Promise<string>} [props.transcribeAudio] - Optional function to transcribe audio input.
 * @param {string} [props.className] - Additional CSS classes to apply to the chat container.
 /**
 * A comprehensive chat interface component that displays messages, handles user input, and provides various chat-related functionalities.
 * It integrates with message lists, input fields, and optional prompt suggestions.
 * @param {ChatProps} props - The properties for the Chat component.
 * @param {Message[]} props.messages - An array of message objects to display in the chat.
 * @param {(event?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => void} props.handleSubmit - Callback function to handle message submission.
 * @param {string} props.input - The current value of the message input field.
 * @param {React.ChangeEventHandler<HTMLTextAreaElement>} props.handleInputChange - Event handler for changes in the message input field.
 * @param {boolean} props.isGenerating - Indicates whether an AI response is currently being generated.
 * @param {() => void} [props.stop] - Optional callback function to stop the current generation.
 * @param {(messageId: string, rating: "thumbs-up" | "thumbs-down") => void} [props.onRateResponse] - Optional callback function to rate a message.
 * @param {(messages: any[]) => void} [props.setMessages] - Optional setter for messages state, used for internal message manipulation (e.g., cancelling tool calls).
 * @param {(blob: Blob) => Promise<string>} [props.transcribeAudio] - Optional function to transcribe audio input.
 * @param {string} [props.className] - Additional CSS classes to apply to the chat container.
 * @param {((message: { role: "user"; content: string }) => void)} [props.append] - Function to append a new message to the chat (required if `suggestions` are provided).
 * @param {string[]} [props.suggestions] - An array of prompt suggestions to display (requires `append` function).
 * @example
 * ```tsx
 * import React, { useState } from 'react';
 * import { Chat } from './chat';
 * import { Message } from './chat-message';
 *
 * const ChatExample = () => {
 *   const [messages, setMessages] = useState<Message[]>([]);
 *   const [input, setInput] = useState('');
 *
 *   const handleSubmit = () => {
 *     if (input.trim()) {
 *       setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content: input }]);
 *       setInput('');
 *       // Simulate AI response
 *       setTimeout(() => {
 *         setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'This is a simulated AI response.' }]);
 *       }, 1000);
 *     }
 *   };
 *
 *   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 *     setInput(e.target.value);
 *   };
 *
 *   return (
 *     <div style={{ height: '400px', display: 'flex', flexDirection: 'column', border: '1px solid #ccc' }}>
 *       <Chat
 *         messages={messages}
 *         input={input}
 *         handleInputChange={handleInputChange}
 *         handleSubmit={handleSubmit}
 *         isGenerating={false}
 *       />
 *     </div>
 *   );
 * };
 *
 * export default ChatExample;
 * ```
 */
export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
  setMessages,
  transcribeAudio,
}: ChatProps) {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.()

    if (!setMessages) return

    const latestMessages = [...messagesRef.current]
    const lastAssistantMessage = latestMessages.findLast(
      (m) => m.role === "assistant"
    )

    if (!lastAssistantMessage) return

    let needsUpdate = false
    let updatedMessage = { ...lastAssistantMessage }

    if (lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation) => {
          if (toolInvocation.state === "call") {
            needsUpdate = true
            return {
              ...toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true, // Special marker to indicate cancellation
              },
            } as const
          }
          return toolInvocation
        }
      )

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          toolInvocations: updatedToolInvocations,
        }
      }
    }

    if (lastAssistantMessage.parts && lastAssistantMessage.parts.length > 0) {
      const updatedParts = lastAssistantMessage.parts.map((part: any) => {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          part.toolInvocation.state === "call"
        ) {
          needsUpdate = true
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true,
              },
            },
          }
        }
        return part
      })

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          parts: updatedParts,
        }
      }
    }

    if (needsUpdate) {
      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id
      )
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = updatedMessage
        setMessages(latestMessages)
      }
    }
  }, [stop, setMessages, messagesRef])

  const messageOptions = useCallback(
    (message: Message) => ({
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  )

  return (
    <ChatContainer className={className}>
      {isEmpty && append && suggestions ? (
        <PromptSuggestions
          label="Try these prompts ✨"
          append={append}
          suggestions={suggestions}
        />
      ) : null}

      {messages.length > 0 ? (
        <ChatMessages messages={messages}>
          <MessageList 
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
          />
        </ChatMessages>
      ) : null}

      <ChatForm
        className="mt-auto mx-5 mb-10"
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <MessageInput
            value={input}
            onChange={handleInputChange}
            allowAttachments
            files={files}
            setFiles={setFiles}
            stop={handleStop}
            isGenerating={isGenerating}
            transcribeAudio={transcribeAudio}
          />
        )}
      </ChatForm>
    </ChatContainer>
  )
}
Chat.displayName = "Chat"

/**
 * A container component for displaying chat messages with auto-scrolling functionality.
 * It uses the `useAutoScroll` hook to manage scrolling behavior.
 * @param {object} props - The properties for the ChatMessages component.
 * @param {Message[]} props.messages - An array of message objects to trigger auto-scrolling.
 * @param {React.ReactNode} props.children - The actual message list component to be rendered inside the scrollable area.
 * @example
 * ```tsx
 * import { Message } from './chat-message';
 * import { MessageList } from './message-list';
 *
 * const sampleMessages: Message[] = [
 *   { id: '1', role: 'user', content: 'Hello' },
 *   { id: '2', role: 'assistant', content: 'Hi there!' },
 * ];
 *
 * <ChatMessages messages={sampleMessages}>
 *   <MessageList messages={sampleMessages} isTyping={false} />
 * </ChatMessages>
 * ```
 */
export function ChatMessages({
  messages,
  children,
}: React.PropsWithChildren<{
  messages: Message[]
}>) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages])

  return (
    <div
      className="grid grid-cols-1 overflow-y-auto pb-4 p-10 scrollbar-hide"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
        {children}
      </div>

      {!shouldAutoScroll && (
        <div className="pointer-events-none flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
          <div className="sticky bottom-0 left-0 flex w-full justify-end">
            <Button
              onClick={scrollToBottom}
              className="pointer-events-auto h-8 w-8 rounded-full ease-in-out animate-in fade-in-0 slide-in-from-bottom-1"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}



/**
 * A forwardRef component that serves as the main container for the chat interface.
 * It applies basic styling for a flex column layout.
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Standard HTML div attributes.
 * @param {string} [props.className] - Additional CSS classes to apply to the container.
 * @example
 * ```tsx
 * <ChatContainer className="my-chat-container">
 *   <div>Chat messages go here</div>
 *   <div>Input form goes here</div>
 * </ChatContainer>
 * ```
 */
export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("w-full flex flex-col flex-1", className)}
      {...props}
    />
  )
})
ChatContainer.displayName = "ChatContainer"

interface ChatFormProps {
  className?: string
  isPending: boolean
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  children: (props: {
    files: File[] | null
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
  }) => ReactElement
}

/**
 * A forwardRef component that wraps the message input form.
 * It handles file attachments and form submission logic.
 * @param {ChatFormProps} props - The properties for the ChatForm component.
 * @param {string} [props.className] - Additional CSS classes to apply to the form.
 * @param {boolean} props.isPending - Indicates whether a form submission is pending.
 * @param {(event?: { preventDefault?: () => void }, options?: { experimental_attachments?: FileList }) => void} props.handleSubmit - Callback function to handle form submission.
 * @param {(props: { files: File[] | null, setFiles: React.Dispatch<React.SetStateAction<File[] | null>> }) => ReactElement} props.children - A render prop function that receives `files` and `setFiles` for managing file inputs.
 * @example
 * ```tsx
 * import React, { useState } from 'react';
 * import { MessageInput } from './message-input';
 *
 * <ChatForm
 *   handleSubmit={(e) => { e?.preventDefault(); console.log('Form submitted'); }}
 *   isPending={false}
 * >
 *   {({ files, setFiles }) => (
 *     <MessageInput
 *       value=""
 *       onChange={() => {}}
 *       allowAttachments
 *       files={files}
 *       setFiles={setFiles}
 *       isGenerating={false}
 *     />
 *   )}
 * </ChatForm>
 * ```
 */
export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, isPending, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null)

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event)
        return
      }

      const fileList = createFileList(files)
      handleSubmit(event, { experimental_attachments: fileList })
      setFiles(null)
    }

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    )
  }
)
ChatForm.displayName = "ChatForm"

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}
