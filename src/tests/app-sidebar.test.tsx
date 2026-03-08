import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import IdeaSidebarItem from '@/react-app/models/idea';
import { useAuth } from '@/hooks/useAuth';

// Mock lucide-react to avoid JSDOM portal issues
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="icon-plus" />,
  Trash: () => <div data-testid="icon-trash" />,
  Settings: () => <div data-testid="icon-settings" />,
  LogOut: () => <div data-testid="icon-logout" />,
  User: () => <div data-testid="icon-user" />,
  Pencil: () => <div data-testid="icon-pencil" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  Search: () => <div data-testid="icon-search" />,
  PanelLeftIcon: () => <div data-testid="icon-panel-left" />,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock tooltips to avoid JSDOM portal issues with Radix UI
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => {
    if (asChild) return children;
    return <div data-testid="tooltip-trigger">{children}</div>;
  },
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('AppSidebar', () => {
  const mockLogout = vi.fn();
  const mockUser = { id: '1', email: 'test@example.com', fullName: 'Test User' };

  const defaultProps = {
    items: [
      new IdeaSidebarItem('First Idea', 'idea-1', true),
      new IdeaSidebarItem('Second Idea', 'idea-2', false),
    ],
    onNew: vi.fn(),
    onDelete: vi.fn(),
    setSelectedItem: vi.fn(),
    onUpdateTitle: vi.fn().mockResolvedValue(undefined),
    onRegenerateTitle: vi.fn().mockResolvedValue('Regenerated Title'),
    isLoading: false,
  };

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter>
        <SidebarProvider>
          {ui}
        </SidebarProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = renderWithProviders(<AppSidebar {...defaultProps} isLoading={true} />);

    // Skeleton should be rendered instead of the actual items
    expect(screen.queryByText('First Idea')).not.toBeInTheDocument();
    // 4 Skeletons are rendered in the component when isLoading=true
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders correctly with ideas and user information', () => {
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Check header
    expect(screen.getByText('My Ideas')).toBeInTheDocument();

    // Check items
    expect(screen.getByText('First Idea')).toBeInTheDocument();
    expect(screen.getByText('Second Idea')).toBeInTheDocument();

    // Check user info in footer
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('filters items when searching', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Ensure both items are visible
    expect(screen.getByText('First Idea')).toBeInTheDocument();
    expect(screen.getByText('Second Idea')).toBeInTheDocument();

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search ideas...');
    await user.type(searchInput, 'Second');

    // Only 'Second Idea' should be visible
    expect(screen.queryByText('First Idea')).not.toBeInTheDocument();
    expect(screen.getByText('Second Idea')).toBeInTheDocument();
  });

  it('calls onNew when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /Add new idea/i });
    await user.click(addButton);

    expect(defaultProps.onNew).toHaveBeenCalledOnce();
  });

  it('calls logout when logout button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('calls setSelectedItem when an item is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    const firstIdeaLink = screen.getByText('First Idea');
    await user.click(firstIdeaLink);

    expect(defaultProps.setSelectedItem).toHaveBeenCalledWith(defaultProps.items[0]);
  });

  it('allows editing an item title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByTitle('Edit title');
    await user.click(editButtons[0]);

    // Input should appear
    const editInput = screen.getByDisplayValue('First Idea');
    expect(editInput).toBeInTheDocument();

    // Change value and save via Enter key
    await user.clear(editInput);
    await user.type(editInput, 'Updated Idea{enter}');

    expect(defaultProps.onUpdateTitle).toHaveBeenCalledWith('idea-1', 'Updated Idea');
  });

  it('allows saving an edited title using the save button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByTitle('Edit title');
    await user.click(editButtons[0]);

    const editInput = screen.getByDisplayValue('First Idea');
    await user.clear(editInput);
    await user.type(editInput, 'Saved via button');

    // Find save button (it's the first button with a check icon next to the input)
    // In our mock, the icon is Check, and it's inside a button. We can find by icon-check.
    const saveButton = screen.getByTestId('icon-check').closest('button');
    expect(saveButton).toBeDefined();

    if (saveButton) {
      await user.click(saveButton);
    }

    expect(defaultProps.onUpdateTitle).toHaveBeenCalledWith('idea-1', 'Saved via button');
  });

  it('allows canceling an edit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Start editing
    const editButtons = screen.getAllByTitle('Edit title');
    await user.click(editButtons[0]);

    const editInput = screen.getByDisplayValue('First Idea');
    await user.clear(editInput);
    await user.type(editInput, 'Cancelled Edit');

    // Cancel editing
    const cancelButton = screen.getByTestId('icon-x').closest('button');
    expect(cancelButton).toBeDefined();

    if (cancelButton) {
      await user.click(cancelButton);
    }

    // Input should disappear, original text should be back
    expect(screen.queryByDisplayValue('Cancelled Edit')).not.toBeInTheDocument();
    expect(screen.getByText('First Idea')).toBeInTheDocument();
    expect(defaultProps.onUpdateTitle).not.toHaveBeenCalled();
  });

  it('calls onRegenerateTitle when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Click regenerate
    const regenerateButtons = screen.getAllByTitle('Regenerate title with AI');
    await user.click(regenerateButtons[0]);

    expect(defaultProps.onRegenerateTitle).toHaveBeenCalledWith('idea-1');
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppSidebar {...defaultProps} />);

    // Click delete
    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('idea-1');
  });
});
