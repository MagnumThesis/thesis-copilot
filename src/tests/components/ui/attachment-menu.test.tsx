import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttachmentMenu, AttachedItem } from '@/components/ui/attachment-menu';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as ideaApi from '@/lib/idea-api';
import { IdeaDefinition } from '@/lib/ai-types';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Lightbulb: () => <div data-testid="icon-lightbulb" />,
  FileText: () => <div data-testid="icon-filetext" />,
  AlertTriangle: () => <div data-testid="icon-alerttriangle" />,
  BookOpen: () => <div data-testid="icon-bookopen" />,
  Paperclip: () => <div data-testid="icon-paperclip" />,
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
  XIcon: () => <div data-testid="icon-x-icon" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  Pencil: () => <div data-testid="icon-pencil" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}));

// Mock idea API
vi.mock('@/lib/idea-api', () => ({
  fetchIdeas: vi.fn(),
  updateIdea: vi.fn(),
  regenerateIdeaTitle: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AttachmentMenu', () => {
  const mockConversationId = 'test-conversation-id';
  const mockOnFileUpload = vi.fn();
  const mockOnAttachedItemsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the attachment button and badge correctly', () => {
    const attachedItems: AttachedItem[] = [
      { id: '1', type: 'idea', title: 'Idea 1', data: {} as IdeaDefinition },
      { id: '2', type: 'content', title: 'Content 1', data: 'content' },
    ];

    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={attachedItems}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    expect(button).toBeInTheDocument();

    // Check badge count
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens the dropdown menu on click and displays options', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Attach File')).toBeInTheDocument();
      expect(screen.getByText('Attach Idea')).toBeInTheDocument();
      expect(screen.getByText('Attach Concern')).toBeInTheDocument();
      expect(screen.getByText('Attach Reference')).toBeInTheDocument();
    });
  });

  it('triggers onFileUpload when Attach File is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    const attachFileMenuItem = await screen.findByText('Attach File');
    await user.click(attachFileMenuItem);

    expect(mockOnFileUpload).toHaveBeenCalled();
  });

  it('opens Attach Idea dialog, loads ideas, and allows selection', async () => {
    const user = userEvent.setup();
    const mockIdeas = [
      { id: 'idea-1', type: 'idea', title: 'Test Idea 1', description: 'Description 1' },
    ];
    vi.mocked(ideaApi.fetchIdeas).mockResolvedValue(mockIdeas as any);

    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    const attachIdeaMenuItem = await screen.findByText('Attach Idea');
    await user.click(attachIdeaMenuItem);

    expect(ideaApi.fetchIdeas).toHaveBeenCalledWith(mockConversationId);

    // Wait for the idea to be loaded and displayed
    const ideaItem = await screen.findByText('Test Idea 1');
    expect(ideaItem).toBeInTheDocument();

    // Select the idea
    await user.click(ideaItem);

    expect(mockOnAttachedItemsChange).toHaveBeenCalledWith([
      {
        id: 'idea-1',
        type: 'idea',
        title: 'Test Idea 1',
        description: 'Description 1',
        data: mockIdeas[0],
      },
    ]);
  });

  it('opens Attach Content dialog, loads content, and allows selection', async () => {
    const user = userEvent.setup();
    const mockContent = 'This is the builder content.';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, content: mockContent }),
    });

    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    const attachContentMenuItem = await screen.findAllByText('Attach Content');
    // The first one is the label, the second is the menu item
    await user.click(attachContentMenuItem[1]);

    expect(mockFetch).toHaveBeenCalledWith(`/api/builder-content/${encodeURIComponent(mockConversationId)}`);

    // Wait for content to load
    const contentPreview = await screen.findByText('Builder Content');
    expect(contentPreview).toBeInTheDocument();

    // Select the content
    await user.click(contentPreview);

    expect(mockOnAttachedItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'builder-content',
          type: 'content',
          title: 'Builder Content',
          data: mockContent,
        }),
      ])
    );
  });

  it('opens Attach Concern dialog, loads concerns, and allows selection', async () => {
    const user = userEvent.setup();
    const mockConcerns = [
      { id: 'concern-1', category: 'Grammar', severity: 'high', title: 'Grammar Issue', description: 'Fix grammar' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, concerns: mockConcerns }),
    });

    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    const attachConcernMenuItem = await screen.findByText('Attach Concern');
    await user.click(attachConcernMenuItem);

    expect(mockFetch).toHaveBeenCalledWith(`/api/proofreader/concerns/${encodeURIComponent(mockConversationId)}`);

    // Wait for concern to load
    const concernItemText = await screen.findByText('Grammar Issue');
    expect(concernItemText).toBeInTheDocument();

    // Select the concern
    await user.click(concernItemText);

    expect(mockOnAttachedItemsChange).toHaveBeenCalledWith([
      {
        id: 'concern-1',
        type: 'concern',
        title: 'Grammar: Grammar Issue',
        description: 'Fix grammar',
        data: mockConcerns[0],
      },
    ]);
  });

  it('opens Attach Reference dialog, loads references, and allows selection', async () => {
    const user = userEvent.setup();
    const mockReferences = [
      { id: 'ref-1', type: 'book', title: 'Test Book', authors: ['Author Name'], publication_date: '2023-01-01' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, references: mockReferences }),
    });

    render(
      <AttachmentMenu
        conversationId={mockConversationId}
        attachedItems={[]}
        onAttachedItemsChange={mockOnAttachedItemsChange}
        onFileUpload={mockOnFileUpload}
      />
    );

    const button = screen.getByRole('button', { name: 'Attach content' });
    await user.click(button);

    const attachRefMenuItem = await screen.findByText('Attach Reference');
    await user.click(attachRefMenuItem);

    expect(mockFetch).toHaveBeenCalledWith(`/api/referencer/references/${encodeURIComponent(mockConversationId)}`);

    // Wait for reference to load
    const refItem = await screen.findByText('Test Book');
    expect(refItem).toBeInTheDocument();

    // Select the reference
    await user.click(refItem);

    expect(mockOnAttachedItemsChange).toHaveBeenCalledWith([
      {
        id: 'ref-1',
        type: 'reference',
        title: 'Test Book',
        description: 'Author Name (2023)',
        data: mockReferences[0],
      },
    ]);
  });
});
