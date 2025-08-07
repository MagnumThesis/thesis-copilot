"use client";

import { useChat } from "@ai-sdk/react";
import { Chat } from "@/components/ui/chat";
import { useEffect, useState } from "react";
import { DefaultChatTransport, UIMessage } from "ai";
import { Message } from "@/components/ui/chat-message";
import { useMemo } from "react";

interface ChatbotProps {
  chatId: string;
  initialMessages: UIMessage[];
  onMessagesLengthChange: (count: number) => void;
}

function Chatbot({ chatId, initialMessages, onMessagesLengthChange }: ChatbotProps) {
  const [input, setInput] = useState("");
  // const { messages, handleInputChange, sendMessage, status, stop } = useChat();

  const { messages: rawMessages, sendMessage, stop, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat', body: {chatId} }),
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);


  const isLoading = status === "submitted" || status === "streaming";


  const handleSubmit = (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ): void => {
    // Safely call preventDefault if it exists
    event?.preventDefault?.();
    sendMessage({ text: input, files: options?.experimental_attachments });
    setInput("");
  };

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setInput(e.target.value);
  };

  const messages: Message[] = useMemo(() => {
    console.log(rawMessages)
    return rawMessages.map(
      (message) => {
        const m: Message = {
          id: message.id,
          role: message.role,
          content: message.parts?.map(part => {
            if (part.type === "text") return part.text;
            return ""; // or handle tool parts differently if needed
          }).join(""),
        }
        return m;
      }
    )
  }, [rawMessages]);

  useEffect(() => {
    onMessagesLengthChange(messages.length);
  }, [messages, onMessagesLengthChange]);



  return (
    <div className="box-border h-full overflow-y-scroll">
      <Chat
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isGenerating={isLoading}
        stop={stop}
        className='h-full'
      />
    </div>
  );
}

export default Chatbot;