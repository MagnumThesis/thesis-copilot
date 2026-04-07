import { useRef } from "react"
import type React from "react"
import { Search, X } from "lucide-react"

import { Label } from "@/components/ui/shadcn/label"
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@/components/ui/sidebar"

interface SearchFormProps extends React.ComponentProps<"form"> {
  value?: string;
  onSearchChange?: (value: string) => void;
}

/**
 * Renders a search form component with an input field and a search icon.
 * It is typically used within a sidebar for searching ideas.
 * @param {SearchFormProps} props - Props passed to the component.
 * @param {string} props.value - The current search value.
 * @param {(value: string) => void} props.onSearchChange - Callback when search value changes.
 * @example
 * ```tsx
 * <SearchForm value={searchQuery} onSearchChange={setSearchQuery} />
 * ```
 */
export function SearchForm({ value, onSearchChange, ...props }: SearchFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onSearchChange?.("")
    inputRef.current?.focus()
  }

  return (
    <form {...props} onSubmit={(e) => e.preventDefault()}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative group">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput 
            id="search" 
            ref={inputRef}
            placeholder="Search ideas..." 
            className="pl-8 pr-8"
            value={value}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
