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


function Landing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<IdeaSidebarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<IdeaSidebarItem>(new IdeaSidebarItem("New", ""));
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isTitleGenerated, setIsTitleGenerated] = useState(false);


  useEffect(() => {
    const fetchChats = async () => {
      console.log("fetching chats")
      try {
        const response = await fetch("/api/chats");
        if (!response.ok) {
          throw new Error("Failed to fetch chats");
        }
        const chats = await response.json();
        const newItems = chats.map(
          (chat: any) => new IdeaSidebarItem(chat.name, chat.id)
        );
        setItems(newItems);
        const selected = newItems.find((item: IdeaSidebarItem) => item.url === location.pathname.slice(1));
        if (selected) {
          setSelectedItem(selected);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    const createNewChat = async () => {
      if (selectedItem?.url === "" && location.pathname === "/") {
      console.log("creating new chat")
        try {
          const response = await fetch("/api/chats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: "New Idea" }),
          });
          if (!response.ok) {
            throw new Error("Failed to create a new chat");
          }
          const newChat = await response.json();
          if (newChat && newChat.id) {
            const newItem = new IdeaSidebarItem(newChat.name, newChat.id);
            setSelectedItem(newItem);
            setItems((prevItems) => [...prevItems, newItem]);
            navigate(`/${newChat.id}`);
          }
        } catch (error) {
          console.error("Error creating new chat:", error);
        }
      }
    };
    createNewChat();
  }, [location.pathname, navigate]);

  useEffect(() => {
    const fetchMessages = async () => {
      console.log(selectedItem.url)
      if (selectedItem?.url && selectedItem.url !== "") {
        try {
          const response = await fetch(`/api/chats/${selectedItem.url}/messages`);
          if (response.ok) {
            const data : [] = await response.json();
            const transformedData : UIMessage[] = [];
            data.forEach((message: any) => {
              const transformedMessage: UIMessage = {
                id: message.id,
                role: message.role,
                parts: JSON.parse(message.content)
              }
              transformedData.push(transformedMessage);
            })
            if (data) {
              setInitialMessages(transformedData);
            } else {
              setInitialMessages([]);
            }
          } else {
            setInitialMessages([]);
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          setInitialMessages([]);
        }
      } else {
        setInitialMessages([]);
      }
    };

    fetchMessages();
  }, [selectedItem, navigate]);

  useEffect(() => {
    console.log(selectedItem)
  }, [selectedItem])

  const handleMessagesLengthChange = async (count: number) => {
    if (count >= 5 && !isTitleGenerated && selectedItem?.title === "New Idea") {
      setIsTitleGenerated(true); // Prevent multiple requests
      try {
        // 1. Generate title
        const genTitleResponse = await fetch(`/api/generate-title`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatId: selectedItem.url }),
        });

        if (!genTitleResponse.ok) {
          throw new Error("Failed to generate title");
        }
        const { title: newTitle } = await genTitleResponse.json();

        // 2. Update chat name in the database
        await fetch(`/api/chats/${selectedItem.url}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newTitle }),
        });

        // 3. Update state
        const updatedItems = items.map((item) =>
          item.url === selectedItem.url ? new IdeaSidebarItem(newTitle, item.url) : item
        );
        setItems(updatedItems);
        setSelectedItem(new IdeaSidebarItem(newTitle, selectedItem.url));
        setIsTitleGenerated(false)
      } catch (error) {
        console.error("Error generating title:", error);
        setIsTitleGenerated(false); // Reset on error to allow retry
      }
    }
  };


  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }
      setItems((prevItems) => prevItems.filter((item) => item.url !== id));
      if(selectedItem.url === id) {
        navigate("/");
        setSelectedItem(new IdeaSidebarItem("New", ""));
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  return (
    !selectedItem ? <></> :
      <SidebarProvider>
        <AppSidebar items={items} onNew={() => { navigate("/"); setSelectedItem(new IdeaSidebarItem("New", "")); }} onDelete={handleDelete} setSelectedItem={setSelectedItem}/>
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
          {
            selectedItem.url != "" &&
          <Chatbot chatId={selectedItem.url} initialMessages={initialMessages} onMessagesLengthChange={handleMessagesLengthChange}/>
          }
        </SidebarInset>
      </SidebarProvider>
  );
}

export default Landing;