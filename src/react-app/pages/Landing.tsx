import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/shadcn/sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/shadcn/breadcrumb";
import { Separator } from "@/components/ui/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ToolsPanel } from "@/components/ui/tools-panel";
import IdeaSidebarItem from "@/react-app/models/idea";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Chatbot from "./Chatbot";
import { UIMessage } from "ai";
import {
  createNewChat,
  fetchChats,
  fetchMessages,
  handleDelete,
  handleMessagesLengthChange,
} from "./Landing.hooks";

function Landing() {
  //routing and navigation
  const location = useLocation();
  const navigate = useNavigate();

  //chat state management
  const [items, setItems] = useState<IdeaSidebarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IdeaSidebarItem>(
    new IdeaSidebarItem("New", "")
  );
  const [isTitleGenerated, setIsTitleGenerated] = useState(false);

  //chat messages
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  //fetch chats
  useEffect(() => {
    fetchChats(setItems, setSelectedItem, location, items);
  }, [location, items]);

  //create new chat when user clicks on new chat(it navigates to root page to trigger new chat)
  useEffect(() => {
    createNewChat(selectedItem, location, navigate, setSelectedItem, setItems);
  }, [location.pathname, navigate, selectedItem, location]);

  // fetch messages when user clicks on a chat
  useEffect(() => {
    fetchMessages(selectedItem, setInitialMessages);
  }, [selectedItem, navigate]);

 
  const onMessagesLengthChange = (count: number) => {
    handleMessagesLengthChange(
      count,
      isTitleGenerated,
      setIsTitleGenerated,
      selectedItem,
      items,
      setItems,
      setSelectedItem
    );
  };

  const onDelete = (id: string) => {
    handleDelete(id, setItems, selectedItem, navigate, setSelectedItem);
  };

  return !selectedItem ? (
    <></>
  ) : (
    <SidebarProvider className="h-screen">
      <Toaster />
      <AppSidebar
        items={items}
        onNew={() => {
          navigate("/");
          setSelectedItem(new IdeaSidebarItem("New", ""));
        }}
        onDelete={onDelete}
        setSelectedItem={setSelectedItem}
      />
      <SidebarInset className="h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedItem?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {selectedItem.id != "" && (
          <div className="flex flex-1">
          <Chatbot
            chatId={selectedItem.id}
            initialMessages={initialMessages}
            onMessagesLengthChange={onMessagesLengthChange}
          />
        <ToolsPanel currentConversation={{ title: selectedItem.title, id: selectedItem.id }} />
      </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Landing;
