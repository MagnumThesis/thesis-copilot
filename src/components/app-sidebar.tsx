import type * as React from "react"
import { Plus, Trash } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/shadcn/button"
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
} from "@/components/ui/sidebar"
import IdeaSidebarItem from "@/react-app/models/idea"
import { Link } from "react-router-dom"



/**
 * Renders the main application sidebar with navigation for ideas, search functionality, and actions to add/delete ideas.
 * @param {React.ComponentProps<typeof Sidebar>} props - Props passed to the underlying Sidebar component.
 * @param {IdeaSidebarItem[]} items - An array of idea items to display in the sidebar navigation.
 * @param {() => void} onNew - Callback function to be called when the "Add new idea" button is clicked.
 * @param {(id: string) => void} onDelete - Callback function to be called when an idea's delete button is clicked. Receives the idea's ID as an argument.
 * @param {(item: IdeaSidebarItem) => void} setSelectedItem - Callback function to be called when an idea's title is clicked. Receives the selected idea item as an argument.
 * @example
 * ```tsx
 * <AppSidebar
 *   items={[{ id: '1', title: 'My Idea', isActive: true }]} 
 *   onNew={() => console.log('New idea')}
 *   onDelete={(id) => console.log('Delete idea', id)}
 *   setSelectedItem={(item) => console.log('Selected idea', item)}
 * />
 * ```
 */
export function AppSidebar({onNew, items, onDelete, setSelectedItem, ...props }: React.ComponentProps<typeof Sidebar> & {items: IdeaSidebarItem[], onNew : () => void, onDelete: (id: string) => void, setSelectedItem: (item: IdeaSidebarItem) => void}) {
  const data = {
  navMain: [
    {
      title: "Ideas",
      url: "#",
      items: items,
    },
  ],
}
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
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.id} className="group flex items-center justify-between">
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      {/* <a href={item.url}>{item.title}</a> */}
                      <Link to={`/${item.id}`} onClick={() => setSelectedItem(item)}>{item.title}</Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
