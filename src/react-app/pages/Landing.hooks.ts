
import { UIMessage } from "ai";
import IdeaSidebarItem from "@/react-core/idea";
import { NavigateFunction } from "react-router-dom";

export const fetchChats = async (
  setItems: React.Dispatch<React.SetStateAction<IdeaSidebarItem[]>>,
  setSelectedItem: React.Dispatch<React.SetStateAction<IdeaSidebarItem>>,
  location: any
) => {
  console.log("fetching chats");
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
    const selected = newItems.find(
      (item: IdeaSidebarItem) => item.url === location.pathname.slice(1)
    );
    if (selected) {
      setSelectedItem(selected);
    }
  } catch (error) {
    console.error(error);
  }
};

export const createNewChat = async (
  selectedItem: IdeaSidebarItem,
  location: any,
  navigate: NavigateFunction,
  setSelectedItem: React.Dispatch<React.SetStateAction<IdeaSidebarItem>>,
  setItems: React.Dispatch<React.SetStateAction<IdeaSidebarItem[]>>
) => {
  if (selectedItem?.url === "" && location.pathname === "/") {
    console.log("creating new chat");
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

export const fetchMessages = async (
  selectedItem: IdeaSidebarItem,
  setInitialMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
) => {
  console.log(selectedItem.url);
  if (selectedItem?.url && selectedItem.url !== "") {
    try {
      const response = await fetch(`/api/chats/${selectedItem.url}/messages`);
      if (response.ok) {
        const data: [] = await response.json();
        const transformedData: UIMessage[] = [];
        data.forEach((message: any) => {
          const transformedMessage: UIMessage = {
            id: message.id,
            role: message.role,
            parts: JSON.parse(message.content),
          };
          transformedData.push(transformedMessage);
        });
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

export const handleMessagesLengthChange = async (
  count: number,
  isTitleGenerated: boolean,
  setIsTitleGenerated: React.Dispatch<React.SetStateAction<boolean>>,
  selectedItem: IdeaSidebarItem,
  items: IdeaSidebarItem[],
  setItems: React.Dispatch<React.SetStateAction<IdeaSidebarItem[]>>,
  setSelectedItem: React.Dispatch<React.SetStateAction<IdeaSidebarItem>>
) => {
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
        item.url === selectedItem.url
          ? new IdeaSidebarItem(newTitle, item.url)
          : item
      );
      setItems(updatedItems);
      setSelectedItem(new IdeaSidebarItem(newTitle, selectedItem.url));
      setIsTitleGenerated(false);
    } catch (error) {
      console.error("Error generating title:", error);
      setIsTitleGenerated(false); // Reset on error to allow retry
    }
  }
};

export const handleDelete = async (
  id: string,
  setItems: React.Dispatch<React.SetStateAction<IdeaSidebarItem[]>>,
  selectedItem: IdeaSidebarItem,
  navigate: NavigateFunction,
  setSelectedItem: React.Dispatch<React.SetStateAction<IdeaSidebarItem>>
) => {
  try {
    const response = await fetch(`/api/chats/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete chat");
    }
    setItems((prevItems) => prevItems.filter((item) => item.url !== id));
    if (selectedItem.url === id) {
      navigate("/");
      setSelectedItem(new IdeaSidebarItem("New", ""));
    }
  } catch (error) {
    console.error("Error deleting chat:", error);
  }
};
