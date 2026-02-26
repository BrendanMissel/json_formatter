import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JsonDiffView from './JsonDiffView'

describe('JsonDiffView', () => {
  it('renders JSON A and JSON B input areas', () => {
    render(<JsonDiffView />)
    expect(screen.getByRole('textbox', { name: /JSON A input/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /JSON B input/i })).toBeInTheDocument()
  })

  it('renders diff output region', () => {
    render(<JsonDiffView />)
    expect(screen.getByRole('region', { name: /JSON diff result/i })).toBeInTheDocument()
  })

  it('shows diff output with add/remove lines when both inputs are valid and different', () => {
    render(<JsonDiffView />)
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i })
    const rightInput = screen.getByRole('textbox', { name: /JSON B input/i })
    fireEvent.change(leftInput, { target: { value: '{"a": 1}' } })
    fireEvent.change(rightInput, { target: { value: '{"a": 2, "b": 3}' } })
    const diffOutput = screen.getByTestId('diff-output')
    expect(diffOutput).toBeInTheDocument()
    const removeLines = screen.getAllByTestId('diff-line-remove')
    const addLines = screen.getAllByTestId('diff-line-add')
    expect(removeLines.length + addLines.length).toBeGreaterThan(0)
  })

  it('shows only unchanged lines when both inputs are the same', () => {
    render(<JsonDiffView />)
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i })
    const rightInput = screen.getByRole('textbox', { name: /JSON B input/i })
    const same = '{"x": 1}'
    fireEvent.change(leftInput, { target: { value: same } })
    fireEvent.change(rightInput, { target: { value: same } })
    expect(screen.getByTestId('diff-output')).toBeInTheDocument()
    expect(screen.queryAllByTestId('diff-line-remove')).toHaveLength(0)
    expect(screen.queryAllByTestId('diff-line-add')).toHaveLength(0)
    expect(screen.getAllByTestId('diff-line-unchanged').length).toBeGreaterThan(0)
  })

  it('shows parse error when left JSON is invalid', () => {
    render(<JsonDiffView />)
    const leftInput = screen.getByRole('textbox', { name: /JSON A input/i })
    fireEvent.change(leftInput, { target: { value: '{ invalid }' } })
    const alerts = screen.getAllByRole('alert')
    expect(alerts.length).toBeGreaterThanOrEqual(1)
    expect(alerts.some((el) => el.textContent?.includes('Expected property name'))).toBe(true)
  })
})
