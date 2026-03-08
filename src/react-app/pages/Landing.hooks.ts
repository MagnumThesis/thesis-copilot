import { UIMessage } from "ai";
import IdeaSidebarItem from "@/react-app/models/idea";
import { NavigateFunction, Location } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Get auth token from localStorage
const getAuthToken = () => {
  try {
    const authState = localStorage.getItem('authState');
    if (authState) {
      const state = JSON.parse(authState);
      return state.session?.accessToken || null;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return null;
};

// Get headers with auth token
const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await fetch("/api/chats", {
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const chats = await response.json();
      return chats.map(
        (chat: any) => new IdeaSidebarItem(chat.name, chat.id)
      );
    }
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      console.log('Creating new chat...');
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ name: "New Idea" }),
      });
      console.log('Create response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create chat error:', errorData);
        throw new Error("Failed to create a new chat");
      }
      const newChat = await response.json();
      console.log('New chat created:', newChat);
      return newChat;
    },
    onSuccess: (newChat) => {
      if (newChat && newChat.id) {
        const newItem = new IdeaSidebarItem(newChat.name, newChat.id);
        queryClient.setQueryData(['chats'], (old: IdeaSidebarItem[] | undefined) => {
          return old ? [...old, newItem] : [newItem];
        });
      }
    }
  });
};

export const useChatMessages = (chatId: string) => {
  return useQuery({
    queryKey: ['chatMessages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      const transformedData: UIMessage[] = [];
      data.forEach((message: any) => {
        const transformedMessage: UIMessage = {
          id: message.id,
          role: message.role,
          parts: JSON.parse(message.content),
        };
        transformedData.push(transformedMessage);
      });
      return transformedData;
    },
    enabled: !!chatId,
  });
};

export const useGenerateTitleFromMessages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) => {
      // 1. Generate title
      const genTitleResponse = await fetch(`/api/generate-title`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ chatId }),
      });

      if (!genTitleResponse.ok) {
        throw new Error("Failed to generate title");
      }
      const { title: newTitle } = await genTitleResponse.json();

      // 2. Update chat name in the database
      const updateResponse = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name: newTitle }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to save generated title");
      }

      return { chatId, newTitle };
    },
    onSuccess: ({ chatId, newTitle }) => {
      queryClient.setQueryData(['chats'], (old: IdeaSidebarItem[] | undefined) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === chatId
            ? new IdeaSidebarItem(newTitle, item.id)
            : item
        );
      });
    }
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['chats'], (old: IdeaSidebarItem[] | undefined) => {
        if (!old) return old;
        return old.filter((item) => item.id !== deletedId);
      });
    }
  });
};

export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name: title }),
      });

      if (!response.ok) {
        throw new Error("Failed to update title");
      }
      return { id, title };
    },
    onSuccess: ({ id, title }) => {
      queryClient.setQueryData(['chats'], (old: IdeaSidebarItem[] | undefined) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === id ? new IdeaSidebarItem(title, item.id, item.isActive) : item
        );
      });
    }
  });
};

export const useRegenerateChatTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Generate title using AI
      const genTitleResponse = await fetch(`/api/generate-title`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ chatId: id }),
      });

      if (!genTitleResponse.ok) {
        throw new Error("Failed to generate title");
      }
      const { title: newTitle } = await genTitleResponse.json();

      // 2. Update chat name in the database
      const updateResponse = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ name: newTitle }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to save generated title");
      }

      return { id, newTitle };
    },
    onSuccess: ({ id, newTitle }) => {
      queryClient.setQueryData(['chats'], (old: IdeaSidebarItem[] | undefined) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === id ? new IdeaSidebarItem(newTitle, item.id, item.isActive) : item
        );
      });
    }
  });
};
