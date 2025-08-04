"use client";

import { useChat } from "@ai-sdk/react";
import { Chat } from "@/components/ui/chat";
import { useEffect, useState } from "react";
import { DefaultChatTransport } from "ai";
import { Message } from "@/components/ui/chat-message";
import { useMemo } from "react";

function Chatbot() {
  const [input, setInput] = useState("");
  // const { messages, handleInputChange, sendMessage, status, stop } = useChat();

  const { messages: rawMessages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });


  const isLoading = status === "submitted" || status === "streaming";


  const handleSubmit = (
    event?: { preventDefault?: () => void },
  ): void => {
    // Safely call preventDefault if it exists
    event?.preventDefault?.();
    sendMessage({ text: input });
    setInput("");
  };

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setInput(e.target.value);
  };

  const messages: Message[] = useMemo(() => {
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
    console.log(messages)
  }, [messages])


  return (
    <div className="box-border p-3 h-full">
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
