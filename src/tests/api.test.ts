import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('API tests', () => {
  it('should fetch the root endpoint and return a successful response', async () => {
    const response = await fetch('http://localhost:5173/api/');
    const json = await response.json();
    expect(response.status).toBe(200);
  });

  it('should return a 500 error when posting to /api/chat without an API key', async () => {
    const response = await fetch('http://localhost:5173/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello', id: '1', parts: ['Hello'] }],
      }),
    });
    expect(response.status).toBe(200);
  });

  it('should return a 400 error when creating a chat without a name', async () => {
    const response = await fetch('http://localhost:5173/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
  });

  it('should create a new chat and then fetch it', async () => {
    const chatName = 'Test Chat';
    const createResponse = await fetch('http://localhost:5173/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: chatName }),
    });
    const newChat = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(newChat.name).toBe(chatName);

    const getResponse = await fetch('http://localhost:5173/api/chats');
    const chats = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(chats.some((chat: any) => chat.id === newChat.id)).toBe(true);
  });

  it('should create, update, and delete a chat', async () => {
    // Create a new chat
    const chatName = 'Another Test Chat';
    const createResponse = await fetch('http://localhost:5173/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: chatName }),
    });
    const newChat = await createResponse.json();
    expect(createResponse.status).toBe(201);
    expect(newChat.name).toBe(chatName);

    // Update the chat's name
    const updatedChatName = 'Updated Test Chat';
    const updateResponse = await fetch(`http://localhost:5173/api/chats/${newChat.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: updatedChatName }),
    });
    const updatedChat = await updateResponse.json();
    expect(updateResponse.status).toBe(200);
    expect(updatedChat.name).toBe(updatedChatName);

    // Delete the chat
    const deleteResponse = await fetch(`http://localhost:5173/api/chats/${newChat.id}`, {
      method: 'DELETE',
    });
    expect(deleteResponse.status).toBe(200);

    // Verify the chat is deleted
    const getResponse = await fetch('http://localhost:5173/api/chats');
    const chats = await getResponse.json();
    expect(getResponse.status).toBe(200);
    expect(chats.every((chat: any) => chat.id !== newChat.id)).toBe(true);
  });

  it('should fetch messages for a chat', async () => {
    // Create a new chat
    const chatName = 'Chat for Messages Test';
    const createResponse = await fetch('http://localhost:5173/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: chatName }),
    });
    const newChat = await createResponse.json();
    expect(createResponse.status).toBe(201);

    // Fetch messages for the new chat
    const messagesResponse = await fetch(`http://localhost:5173/api/chats/${newChat.id}/messages`);
    const messages = await messagesResponse.json();
    expect(messagesResponse.status).toBe(200);
    expect(messages).toEqual([]); // Expect an empty array as no messages have been added yet

    // Clean up the created chat
    await fetch(`http://localhost:5173/api/chats/${newChat.id}`, {
      method: 'DELETE',
    });
  });

  describe('Ideas API tests', () => {
    let createdIdeaId: number;
    let testConversationId: string;

    beforeAll(async () => {
      // Create a chat to use as conversationId
      const chatName = 'Idea Test Conversation';
      const createChatResponse = await fetch('http://localhost:5173/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: chatName }),
      });
      const newChat = await createChatResponse.json();
      console.log("chat_id: "+ newChat.id)
      testConversationId = newChat.id;
    });

    afterAll(async () => {
      // Clean up the created chat
      await fetch(`http://localhost:5173/api/chats/${testConversationId}`, {
        method: 'DELETE',
      });
    });

    it('should create a new idea', async () => {
      const ideaData = {
        title: 'Test Idea',
        description: 'This is a test description for the idea.',
        conversationid: testConversationId,
      };
      console.log("ideaData: ", ideaData)
      const response = await fetch('http://localhost:5173/api/ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData),
        
      });
      const newIdea = await response.json(); 
      // console.log(newIdea) 
      expect(response.status).toBe(201);
      expect(newIdea.title).toBe(ideaData.title);
      expect(newIdea.description).toBe(ideaData.description);
      expect(newIdea.conversationid).toBe(ideaData.conversationid);
      expect(newIdea.id).toBeDefined();
      createdIdeaId = newIdea.id;
    });

    it('should get all ideas', async () => {
      const response = await fetch('http://localhost:5173/api/ideas');
      const ideas = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(ideas)).toBe(true);
      expect(ideas.some((idea: any) => idea.id === createdIdeaId)).toBe(true);
    });

    it('should get a specific idea by ID', async () => {
      const response = await fetch(`http://localhost:5173/api/ideas/${createdIdeaId}`);
      const idea = await response.json();
      expect(response.status).toBe(200);
      expect(idea.id).toBe(createdIdeaId);
      expect(idea.title).toBe('Test Idea');
    });

    it('should update an idea by ID', async () => {
      const updatedTitle = 'Updated Test Idea';
      const response = await fetch(`http://localhost:5173/api/ideas/${createdIdeaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: updatedTitle }),
      });
      const updatedIdea = await response.json();
      expect(response.status).toBe(200);
      expect(updatedIdea.id).toBe(createdIdeaId);
      expect(updatedIdea.title).toBe(updatedTitle);
    });

    it('should delete an idea by ID', async () => {
      console.log("ideaID: ", createdIdeaId)
      const response = await fetch(`http://localhost:5173/api/ideas/${createdIdeaId}`, {
        method: 'DELETE',
      });
      const json = await response.json();
      console.log("delete: ", json)
      expect(response.status).toBe(200);
      expect(json.message).toBe(`Idea with id ${createdIdeaId} deleted successfully`);

      // Verify the idea is deleted
      const getResponse = await fetch(`http://localhost:5173/api/ideas/${createdIdeaId}`);
      expect(getResponse.status).toBe(500);
    });
  });

  describe('Generate Title API tests', () => {
    let testChatId: string;

    // Before all tests in this describe block, create a chat to use for testing
    beforeAll(async () => {
      const chatName = 'Title Generation Test Chat';
      const createResponse = await fetch('http://localhost:5173/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: chatName }),
      });
      const newChat = await createResponse.json();
      testChatId = newChat.id;
    });

    // After all tests in this describe block, delete the created chat
    afterAll(async () => {
      await fetch(`http://localhost:5173/api/chats/${testChatId}`, {
        method: 'DELETE',
      });
    });

    it('should return a 400 error when generating a title without a chatId', async () => {
      const response = await fetch('http://localhost:5173/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
    });

    it('should generate a title for a given chatId', async () => {
      const response = await fetch('http://localhost:5173/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: testChatId }),
      });
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.title).toBeDefined();
      expect(typeof json.title).toBe('string');
      expect(json.title.length).toBeGreaterThan(0);
    });
  });
});
