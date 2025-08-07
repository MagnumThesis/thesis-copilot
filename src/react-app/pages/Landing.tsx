import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import IdeaSidebarItem from "@/react-core/idea";
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
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<IdeaSidebarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IdeaSidebarItem>(
    new IdeaSidebarItem("New", "")
  );
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isTitleGenerated, setIsTitleGenerated] = useState(false);

  useEffect(() => {
    fetchChats(setItems, setSelectedItem, location);
  }, []);

  useEffect(() => {
    createNewChat(selectedItem, location, navigate, setSelectedItem, setItems);
  }, [location.pathname, navigate]);

  useEffect(() => {
    fetchMessages(selectedItem, setInitialMessages);
  }, [selectedItem, navigate]);

  useEffect(() => {
    console.log(selectedItem);
  }, [selectedItem]);

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
    <SidebarProvider>
      <AppSidebar
        items={items}
        onNew={() => {
          navigate("/");
          setSelectedItem(new IdeaSidebarItem("New", ""));
        }}
        onDelete={onDelete}
        setSelectedItem={setSelectedItem}
      />
      <SidebarInset className=" h-screen">
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
        {selectedItem.url != "" && (
          <Chatbot
            chatId={selectedItem.url}
            initialMessages={initialMessages}
            onMessagesLengthChange={onMessagesLengthChange}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Landing;