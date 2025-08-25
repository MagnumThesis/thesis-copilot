import {
  ChatMessage,
  type ChatMessageProps,
  type Message,
} from "@/components/ui/chat-message"
import { TypingIndicator } from "@/components/ui/typing-indicator"

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>

interface MessageListProps {
  messages: Message[]
  showTimeStamps?: boolean
  isTyping?: boolean
  messageOptions?:
    | AdditionalMessageOptions
    | ((message: Message) => AdditionalMessageOptions)
}

/**
 * @component MessageList
 * @description A component that displays a list of chat messages, optionally showing timestamps and a typing indicator.
 * @param {MessageListProps} props - The properties for the MessageList component.
 * @param {Message[]} props.messages - An array of message objects to display.
 * @param {boolean} [props.showTimeStamps=true] - If true, displays timestamps for each message.
 * @param {boolean} [props.isTyping=false] - If true, displays a typing indicator at the end of the message list.
 * @param {AdditionalMessageOptions | ((message: Message) => AdditionalMessageOptions)} [props.messageOptions] - Additional options to pass to individual `ChatMessage` components, either as a static object or a function that returns options based on the message.
 */
export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
}: MessageListProps) {
  return (
    <div className="space-y-4 overflow-visible">
      {messages.map((message, index) => {
        const additionalOptions =
          typeof messageOptions === "function"
            ? messageOptions(message)
            : messageOptions

        return (
          <ChatMessage
            key={index}
            showTimeStamp={showTimeStamps}
            {...message}
            {...additionalOptions}
          />
        )
      })}
      {isTyping && <TypingIndicator />}
    </div>
  )
}
