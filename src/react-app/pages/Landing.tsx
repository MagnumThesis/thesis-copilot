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
import {
  useChats,
  useChatMessages,
  useCreateChat,
  useDeleteChat,
  useUpdateChatTitle,
  useRegenerateChatTitle,
  useGenerateTitleFromMessages,
} from "./Landing.hooks";

function Landing() {
  //routing and navigation
  const location = useLocation();
  const navigate = useNavigate();

  //chat state management
  const [selectedItem, setSelectedItem] = useState<IdeaSidebarItem>(
    new IdeaSidebarItem("New", "")
  );
  const [isTitleGenerated, setIsTitleGenerated] = useState(false);

  // React Query Hooks
  const { data: items = [], isLoading: isLoadingChats } = useChats();
  const { data: initialMessages = [] } = useChatMessages(selectedItem?.id || "");

  const createChatMutation = useCreateChat();
  const deleteChatMutation = useDeleteChat();
  const updateChatTitleMutation = useUpdateChatTitle();
  const regenerateChatTitleMutation = useRegenerateChatTitle();
  const generateTitleFromMessagesMutation = useGenerateTitleFromMessages();

  // Initialize selectedItem based on URL if it's not set
  useEffect(() => {
    if (location.pathname !== "/" && items.length > 0 && selectedItem.id === "") {
      const selected = items.find(
        (item: IdeaSidebarItem) => item.id === location.pathname.slice(5) // Remove "/app/" prefix
      );
      if (selected) {
        setSelectedItem(selected);
      }
    }
  }, [location.pathname, items, selectedItem.id]);

  const onMessagesLengthChange = async (count: number) => {
    if (count >= 5 && !isTitleGenerated && selectedItem?.title === "New Idea") {
      setIsTitleGenerated(true);
      try {
        const { newTitle } = await generateTitleFromMessagesMutation.mutateAsync({ chatId: selectedItem.id });
        setSelectedItem(new IdeaSidebarItem(newTitle, selectedItem.id));
        setIsTitleGenerated(false);
      } catch (error) {
        console.error("Error generating title:", error);
        setIsTitleGenerated(false);
      }
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteChatMutation.mutateAsync(id);
      if (selectedItem.id === id) {
        navigate("/");
        setSelectedItem(new IdeaSidebarItem("New", ""));
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createChatMutation.mutateAsync();
      if (newChat && newChat.id) {
        const newItem = new IdeaSidebarItem(newChat.name, newChat.id);
        setSelectedItem(newItem);
        navigate(`/app/${newChat.id}`);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const onUpdateTitle = async (id: string, title: string) => {
    try {
      await updateChatTitleMutation.mutateAsync({ id, title });
      if (selectedItem.id === id) {
        setSelectedItem(new IdeaSidebarItem(title, id, selectedItem.isActive));
      }
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const onRegenerateTitle = async (id: string): Promise<string> => {
    try {
      const { newTitle } = await regenerateChatTitleMutation.mutateAsync(id);
      if (selectedItem.id === id) {
        setSelectedItem(new IdeaSidebarItem(newTitle, id, selectedItem.isActive));
      }
      return newTitle;
    } catch (error) {
      console.error("Error regenerating title:", error);
      throw error;
    }
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
