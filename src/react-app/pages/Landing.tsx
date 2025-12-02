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
import IdeaSidebarItem from "@/react-app/models/idea";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, Suspense, lazy } from "react";
import Skeleton from "@/components/ui/shadcn/skeleton";
import { DetailContentSkeleton } from "@/components/ui/shadcn/skeletons";
const Chatbot = lazy(() => import("./Chatbot"));
const ToolsPanel = lazy(() => import("@/components/ui/tools-panel").then(m => ({ default: m.ToolsPanel })));
import { UIMessage } from "ai";
import {
  createNewChat,
  fetchChats,
  fetchMessages,
  handleDelete,
  handleMessagesLengthChange,
  handleUpdateTitle,
  handleRegenerateTitle,
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
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  //chat messages
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  // Track if chats have been loaded to prevent refetching
  const hasLoadedChatsRef = useRef(false);

  //fetch chats only once on component mount
  useEffect(() => {
    if (!hasLoadedChatsRef.current) {
      hasLoadedChatsRef.current = true;
      setIsLoadingChats(true);
      fetchChats(setItems, setSelectedItem, location, items).finally(() => {
        setIsLoadingChats(false);
      });
    }
  }, []);

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

  const handleNewChat = async () => {
    try {
      // Get auth token
      const authState = localStorage.getItem('authState');
      const token = authState ? JSON.parse(authState).session?.accessToken : null;
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: "New Idea" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create chat error:', errorData);
        throw new Error("Failed to create a new chat");
      }

      const newChat = await response.json();
      console.log('New chat created:', newChat);

      if (newChat && newChat.id) {
        const newItem = new IdeaSidebarItem(newChat.name, newChat.id);
        setSelectedItem(newItem);
        setItems((prevItems) => [...prevItems, newItem]);
        navigate(`/app/${newChat.id}`);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const onUpdateTitle = async (id: string, title: string) => {
    await handleUpdateTitle(id, title, items, setItems, selectedItem, setSelectedItem);
  };

  const onRegenerateTitle = async (id: string): Promise<string> => {
    return await handleRegenerateTitle(id, items, setItems, selectedItem, setSelectedItem);
  };

  return !selectedItem ? (
    <></>
  ) : (
    <>
      <Toaster />
      <SidebarProvider className="h-screen">
        <AppSidebar
          items={items}
          onNew={handleNewChat}
          onDelete={onDelete}
          setSelectedItem={setSelectedItem}
          onUpdateTitle={onUpdateTitle}
          onRegenerateTitle={onRegenerateTitle}
          isLoading={isLoadingChats}
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
            <Suspense fallback={<div className="w-full"><DetailContentSkeleton /></div>}>
              <Chatbot
                chatId={selectedItem.id}
                initialMessages={initialMessages}
                onMessagesLengthChange={onMessagesLengthChange}
              />
            </Suspense>
            <Suspense fallback={<div></div>}>
              <ToolsPanel currentConversation={{ title: selectedItem.title, id: selectedItem.id }} />
            </Suspense>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}

export default Landing;
