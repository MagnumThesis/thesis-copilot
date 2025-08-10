/**
 * API functions for interacting with ideas
 * @file src/lib/idea-api.ts
 */

import { IdeaDefinition } from "@/components/ui/idealist";

const API_BASE_URL = "/api/ideas";

/**
 * Fetches all ideas from the API
 * @param conversationId - Optional conversation ID to filter ideas by
 * @returns Promise resolving to an array of IdeaDefinition objects
 * @throws Error if the request fails
 */
export async function fetchIdeas(conversationId: string): Promise<IdeaDefinition[]> {
  try {
    if (!conversationId) {
      throw new Error("Conversation ID is required");
    }
    const url = `${API_BASE_URL}?conversationId=${encodeURIComponent(conversationId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ideas: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching ideas:", error);
    throw error;
  }
}

/**
 * Creates a new idea
 * @param idea - The idea data to create
 * @returns Promise resolving to the created IdeaDefinition object
 * @throws Error if the request fails
 */
export async function createIdea(idea: Omit<IdeaDefinition, "id">): Promise<IdeaDefinition> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(idea),
    });

    if (!response.ok) {
      throw new Error(`Failed to create idea: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating idea:", error);
    throw error;
  }
}

/**
 * Fetches a specific idea by ID
 * @param id - The ID of the idea to fetch
 * @returns Promise resolving to an IdeaDefinition object
 * @throws Error if the request fails or idea is not found
 */
export async function fetchIdea(id: number): Promise<IdeaDefinition> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Idea with id ${id} not found`);
      }
      throw new Error(`Failed to fetch idea: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching idea with id ${id}:`, error);
    throw error;
  }
}

/**
 * Updates an existing idea
 * @param id - The ID of the idea to update
 * @param updates - The fields to update
 * @returns Promise resolving to the updated IdeaDefinition object
 * @throws Error if the request fails or idea is not found
 */
export async function updateIdea(
  id: number,
  updates: Partial<Omit<IdeaDefinition, "id">>
): Promise<IdeaDefinition> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Idea with id ${id} not found`);
      }
      throw new Error(`Failed to update idea: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating idea with id ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes an idea by ID
 * @param id - The ID of the idea to delete
 * @returns Promise resolving to void
 * @throws Error if the request fails or idea is not found
 */
export async function deleteIdea(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Idea with id ${id} not found`);
      }
      throw new Error(`Failed to delete idea: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error deleting idea with id ${id}:`, error);
    throw error;
  }
}

/**
 * Generates new ideas based on conversation history and existing ideas
 * @param chatId - The ID of the chat/conversation
 * @param existingIdeas - Array of existing ideas to avoid duplication
 * @returns Promise resolving to an array of generated idea objects
 * @throws Error if the request fails
 */
export async function generateIdeas(chatId: string, existingIdeas: Omit<IdeaDefinition, "id">[]): Promise<{title: string, description: string}[]> {
  try {
    const response = await fetch("/api/generate-ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId, existingIdeas }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate ideas: ${response.statusText}`);
    }

    const result = await response.json();
    return result.ideas;
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw error;
  }
}

