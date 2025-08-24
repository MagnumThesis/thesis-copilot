import type React from "react"
import { Search } from "lucide-react"

import { Label } from "@/components/ui/shadcn/label"
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@/components/ui/sidebar"

/**
 * Renders a search form component with an input field and a search icon.
 * It is typically used within a sidebar for searching ideas.
 * @param {React.ComponentProps<"form">} props - Props passed to the underlying `form` element.
 * @example
 * ```tsx
 * <SearchForm onSubmit={() => console.log('Searching...')} />
 * ```
 */
export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput id="search" placeholder="Search ideas..." className="pl-8" />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
