import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '../../components/search-form'
import { SidebarProvider } from '../../components/ui/sidebar'
import { describe, it, expect, vi } from 'vitest'

describe('SearchForm', () => {
  it('renders correctly with placeholder', () => {
    render(
      <SidebarProvider>
        <SearchForm />
      </SidebarProvider>
    )
    expect(screen.getByPlaceholderText('Search ideas...')).toBeInTheDocument()
  })

  it('does not render clear button when empty', () => {
    render(
      <SidebarProvider>
        <SearchForm value="" />
      </SidebarProvider>
    )
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument()
  })

  it('renders clear button when value is provided', () => {
    render(
      <SidebarProvider>
        <SearchForm value="test search" />
      </SidebarProvider>
    )
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('calls onSearchChange when clear button is clicked', async () => {
    const handleSearchChange = vi.fn()
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <SearchForm value="test search" onSearchChange={handleSearchChange} />
      </SidebarProvider>
    )

    const clearButton = screen.getByLabelText('Clear search')
    await user.click(clearButton)

    expect(handleSearchChange).toHaveBeenCalledWith('')
  })
})