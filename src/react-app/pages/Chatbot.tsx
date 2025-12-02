"use client";

import { useChat } from "@ai-sdk/react";
import { Chat, AttachedItem } from "@/components/ui/chat";
import { useEffect, useState } from "react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Message } from "@/components/ui/chat-message";
import { useMemo } from "react";

interface ChatbotProps {
  chatId: string;
  initialMessages: UIMessage[];
  onMessagesLengthChange: (count: number) => void;
}

/**
 * Formats attached items into a context string for the AI
 */
function formatAttachedItemsContext(attachedItems: AttachedItem[]): string {
  if (!attachedItems || attachedItems.length === 0) return "";

  const sections: string[] = [];

  // Group by type
  const ideas = attachedItems.filter((item) => item.type === "idea");
  const contents = attachedItems.filter((item) => item.type === "content");
  const concerns = attachedItems.filter((item) => item.type === "concern");
  const references = attachedItems.filter((item) => item.type === "reference");

  if (ideas.length > 0) {
    sections.push(
      `**Attached Ideas:**\n${ideas
        .map((item) => {
          const idea = item.data as any;
          return `- **${item.title}**: ${idea.description || "No description"}${
            idea.type ? ` (Type: ${idea.type})` : ""
          }`;
        })
        .join("\n")}`
    );
  }

  if (contents.length > 0) {
    sections.push(
      `**Attached Content:**\n${contents
        .map((item) => {
          const content = item.data as string;
          // Truncate very long content
          const truncated = content.length > 2000 
            ? content.substring(0, 2000) + "... [truncated]" 
            : content;
          return `---\n${truncated}\n---`;
        })
        .join("\n")}`
    );
  }

  if (concerns.length > 0) {
    sections.push(
      `**Attached Concerns:**\n${concerns
        .map((item) => {
          const concern = item.data as any;
          return `- **[${concern.category}]** (${concern.severity}): ${concern.text}${
            concern.explanation ? `\n  Explanation: ${concern.explanation}` : ""
          }${
            concern.suggestions?.length > 0
              ? `\n  Suggestions: ${concern.suggestions.join(", ")}`
              : ""
          }`;
        })
        .join("\n")}`
    );
  }

  if (references.length > 0) {
    sections.push(
      `**Attached References:**\n${references
        .map((item) => {
          const ref = item.data as any;
          const authors = Array.isArray(ref.authors)
            ? ref.authors
                .map((a: any) =>
                  typeof a === "string" ? a : `${a.firstName} ${a.lastName}`
                )
                .join(", ")
            : "";
          return `- ${authors}${
            ref.publication_date
              ? ` (${new Date(ref.publication_date).getFullYear()})`
              : ""
          }. "${ref.title}". ${ref.type?.replace("_", " ") || ""}${
            ref.journal ? ` ${ref.journal}` : ""
          }${ref.doi ? `. DOI: ${ref.doi}` : ""}`;
        })
        .join("\n")}`
    );
  }

  if (sections.length === 0) return "";

  return `\n\n---\n**Context from attached items:**\n${sections.join("\n\n")}\n---\n\n`;
}

/**
 * Formats attached items into a brief summary for display
 */
function formatAttachedItemsSummary(attachedItems: AttachedItem[]): string {
  if (!attachedItems || attachedItems.length === 0) return "";

  const parts: string[] = [];
  const ideas = attachedItems.filter((item) => item.type === "idea");
  const contents = attachedItems.filter((item) => item.type === "content");
  const concerns = attachedItems.filter((item) => item.type === "concern");
  const references = attachedItems.filter((item) => item.type === "reference");

  if (ideas.length > 0) parts.push(`📌 ${ideas.length} idea${ideas.length > 1 ? "s" : ""}`);
  if (contents.length > 0) parts.push(`📄 ${contents.length} content`);
  if (concerns.length > 0) parts.push(`⚠️ ${concerns.length} concern${concerns.length > 1 ? "s" : ""}`);
  if (references.length > 0) parts.push(`📚 ${references.length} reference${references.length > 1 ? "s" : ""}`);

  return parts.length > 0 ? `[Attached: ${parts.join(", ")}]` : "";
}

function Chatbot({ chatId, initialMessages, onMessagesLengthChange }: ChatbotProps) {
  const [input, setInput] = useState("");

  const { messages: rawMessages, sendMessage, stop, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat', body: { chatId } }),
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);


  const isLoading = status === "submitted" || status === "streaming";


  const handleSubmit = (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList; attachedItems?: AttachedItem[] }
  ): void => {
    // Safely call preventDefault if it exists
    event?.preventDefault?.();
    
    // Format attached items as context
    const attachedContext = options?.attachedItems 
      ? formatAttachedItemsContext(options.attachedItems)
      : "";
    
    // Create summary for display in message
    const attachedSummary = options?.attachedItems
      ? formatAttachedItemsSummary(options.attachedItems)
      : "";
    
    // Combine user input with context
    const messageWithContext = attachedContext 
      ? `${input}${attachedContext}`
      : input;
    
    sendMessage({ 
      text: messageWithContext, 
      files: options?.experimental_attachments 
    });
    setInput("");
  };

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setInput(e.target.value);
  };

  const messages: Message[] = useMemo(() => {
    return rawMessages.map(
      (message) => {
        // In AI SDK v5+, file attachments are in message.parts with type: 'file'
        // Structure: { type: 'file', mediaType: string, filename?: string, url: string }
        const fileParts = message.parts?.filter((part: any) => 
          part.type === "file"
        ) || [];
        
        // Convert file parts to the attachment format expected by chat-message.tsx
        const fileAttachments = fileParts.map((part: any) => ({
          name: part.filename || "File",
          contentType: part.mediaType || "application/octet-stream",
          url: part.url || "",
        })).filter((att: any) => att.url);
        
        // Build text content from text parts only
        const textContent = message.parts?.map(part => {
          if (part.type === "text") return part.text;
          return "";
        }).join("") || "";
        
        const m: Message = {
          id: message.id,
          role: message.role,
          content: textContent,
          experimental_attachments: fileAttachments.length > 0 ? fileAttachments : undefined,
        }
        return m;
      }
    )
  }, [rawMessages]);

  useEffect(() => {
    onMessagesLengthChange(messages.length);
  }, [messages, onMessagesLengthChange]);



  return (
    <Chat
      messages={messages}
      input={input}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isGenerating={isLoading}
      stop={stop}
      className="flex-1 max-h-[calc(100vh-64px)]"
      conversationId={chatId}
      />
  );
}

export default Chatbot;