import type * as React from "react"
import { useState } from "react"
import { Plus, Trash, Settings, LogOut, User, Pencil, Sparkles, Check, X, Loader2 } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/shadcn/button"
import { Input } from "@/components/ui/shadcn/input"
import { Skeleton } from "@/components/ui/shadcn/skeleton"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import IdeaSidebarItem from "@/react-app/models/idea"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"



/**
 * Renders the main application sidebar with navigation for ideas, search functionality, and actions to add/delete ideas.
 * @param {React.ComponentProps<typeof Sidebar>} props - Props passed to the underlying Sidebar component.
 * @param {IdeaSidebarItem[]} items - An array of idea items to display in the sidebar navigation.
 * @param {() => void} onNew - Callback function to be called when the "Add new idea" button is clicked.
 * @param {(id: string) => void} onDelete - Callback function to be called when an idea's delete button is clicked. Receives the idea's ID as an argument.
 * @param {(item: IdeaSidebarItem) => void} setSelectedItem - Callback function to be called when an idea's title is clicked. Receives the selected idea item as an argument.
 * @param {(id: string, title: string) => Promise<void>} onUpdateTitle - Callback function to update an item's title.
 * @param {(id: string) => Promise<string>} onRegenerateTitle - Callback function to regenerate an item's title using AI.
 * @example
 * ```tsx
 * <AppSidebar
 *   items={[{ id: '1', title: 'My Idea', isActive: true }]} 
 *   onNew={() => console.log('New idea')}
 *   onDelete={(id) => console.log('Delete idea', id)}
 *   setSelectedItem={(item) => console.log('Selected idea', item)}
 *   onUpdateTitle={async (id, title) => console.log('Update title', id, title)}
 *   onRegenerateTitle={async (id) => 'New AI Title'}
 * />
 * ```
 */
export function AppSidebar({
  onNew, 
  items, 
  onDelete, 
  setSelectedItem, 
  onUpdateTitle,
  onRegenerateTitle,
  isLoading = false,
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  items: IdeaSidebarItem[], 
  onNew: () => void, 
  onDelete: (id: string) => void, 
  setSelectedItem: (item: IdeaSidebarItem) => void,
  onUpdateTitle?: (id: string, title: string) => Promise<void>,
  onRegenerateTitle?: (id: string) => Promise<string>,
  isLoading?: boolean
}) {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const data = {
    navMain: [
      {
        title: "Ideas",
        url: "#",
        items: filteredItems,
      },
    ],
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleStartEdit = (item: IdeaSidebarItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    if (!onUpdateTitle) {
      toast.error("Update not available");
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdateTitle(id, editingTitle.trim());
      setEditingId(null);
      setEditingTitle("");
      toast.success("Title updated");
    } catch (err) {
      console.error("Failed to update title:", err);
      toast.error("Failed to update title");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateTitle = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onRegenerateTitle) {
      toast.error("Regenerate not available");
      return;
    }

    try {
      setRegeneratingId(id);
      const newTitle = await onRegenerateTitle(id);
      toast.success(`Title updated to: ${newTitle}`);
    } catch (err) {
      console.error("Failed to regenerate title:", err);
      toast.error("Failed to regenerate title");
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between p-2">
          <h2 className="text-lg font-semibold">My Ideas</h2>
          <Button size="sm" className="h-8 w-8 p-0" onClick={onNew}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add new idea</span>
          </Button>
        </div>
        <SearchForm value={searchQuery} onSearchChange={setSearchQuery} />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((navItem) => (
          <SidebarGroup key={navItem.title}>
            <SidebarGroupLabel className="px-3 py-2">{navItem.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              {isLoading ? (
                <div className="space-y-3 px-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="py-2">
                      <Skeleton className="h-[44px] w-full rounded-md animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
              <SidebarMenu className="space-y-3 px-2">
                {navItem.items.map((item) => (
                  <SidebarMenuItem key={item.id} className="group/item min-h-[48px]">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 px-3 py-3 w-full">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="h-10 text-sm flex-1"
                          autoFocus
                          disabled={isUpdating}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(item.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          <X className="h-5 w-5 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative w-full py-2">
                        <SidebarMenuButton asChild isActive={item.isActive} className="w-full px-3 py-3 min-h-[44px]">
                          <Link to={`/app/${item.id}`} onClick={() => setSelectedItem(item)}>{item.title}</Link>
                        </SidebarMenuButton>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 bg-gradient-to-l from-sidebar from-70% to-transparent pl-6 pr-2">
                          {onUpdateTitle && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleStartEdit(item, e)}
                              title="Edit title"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onRegenerateTitle && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleRegenerateTitle(item.id, e)}
                              disabled={regeneratingId === item.id}
                              title="Regenerate title with AI"
                            >
                              {regeneratingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onDelete(item.id)}
                            title="Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 border-t pt-4">
          <div className="flex flex-1 flex-col gap-1 truncate">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.fullName}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Link to="/profile" title="Profile">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
          <Link to="/settings" title="Settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
