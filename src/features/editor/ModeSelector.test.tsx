import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ModeSelector } from './ModeSelector'

describe('ModeSelector', () => {
  it('offers a light-mode switch when dark mode is active', () => {
    const onChange = vi.fn()

    render(<ModeSelector activeMode="dark" onChange={onChange} />)

    const toggle = screen.getByRole('switch', { name: 'Switch to light mode' })

    expect(toggle).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(toggle)

    expect(onChange).toHaveBeenCalledWith('light')
  })

  it('offers a dark-mode switch when light mode is active', () => {
    const onChange = vi.fn()

    render(<ModeSelector activeMode="light" onChange={onChange} />)

    const toggle = screen.getByRole('switch', { name: 'Switch to dark mode' })

    expect(toggle).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(toggle)

    expect(onChange).toHaveBeenCalledWith('dark')
  })
})
