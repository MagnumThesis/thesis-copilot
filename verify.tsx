import { createRoot } from "react-dom/client";
import { Chat } from "../src/components/ui/chat";
import { TooltipProvider } from "../src/components/ui/shadcn/tooltip";

const root = createRoot(document.getElementById("root")!);

const mockMessages = [
  { id: "1", role: "user", content: "Hello!" },
  { id: "2", role: "assistant", content: "Hi! How can I help you today?" }
];

root.render(
  <TooltipProvider>
    <div style={{ height: "600px", width: "800px", border: "1px solid black", padding: "16px" }}>
      <Chat
        messages={mockMessages}
        input=""
        handleInputChange={() => {}}
        handleSubmit={() => {}}
        isGenerating={false}
        onRateResponse={(id, rating) => console.log(id, rating)}
      />
    </div>
  </TooltipProvider>
);