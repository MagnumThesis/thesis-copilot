import type * as React from "react"
import { Plus, Trash } from "lucide-react"

import { SearchForm } from "@/components/search-form"
import { Button } from "@/components/ui/button"
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
import IdeaSidebarItem from "@/react-core/idea"
import { Link } from "react-router-dom"



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
                  <SidebarMenuItem key={item.url} className="group flex items-center justify-between">
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      {/* <a href={item.url}>{item.title}</a> */}
                      <Link to={`/${item.url}`} onClick={() => setSelectedItem(item)}>{item.title}</Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => onDelete(item.url)}
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
