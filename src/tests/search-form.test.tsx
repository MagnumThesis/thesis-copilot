import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchForm } from '@/components/search-form'

describe('SearchForm', () => {
  it('should render with default props', () => {
    render(<SearchForm />)
    const input = screen.getByPlaceholderText('Search ideas...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('should render with a specific value', () => {
    render(<SearchForm value="test query" />)
    const input = screen.getByPlaceholderText('Search ideas...')
    expect(input).toHaveValue('test query')
  })

  it('should trigger onSearchChange when input changes', () => {
    const onSearchChange = vi.fn()
    render(<SearchForm onSearchChange={onSearchChange} />)

    const input = screen.getByPlaceholderText('Search ideas...')
    fireEvent.change(input, { target: { value: 'new query' } })

    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith('new query')
  })

  it('should prevent default on form submit', () => {
    const preventDefault = vi.fn()

    // We create an event with preventDefault
    const mockEvent = new Event('submit', { bubbles: true, cancelable: true })
    Object.assign(mockEvent, { preventDefault })

    const { container } = render(<SearchForm />)
    const form = container.querySelector('form')

    if (form) {
      fireEvent(form, mockEvent)
    }

    expect(preventDefault).toHaveBeenCalled()
  })
})
