import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormattedPane from './FormattedPane'

describe('FormattedPane', () => {
  it('renders Copy button with aria-label and no Paste or Clear', () => {
    render(
      <FormattedPane
        parsed={{ example: true }}
        parseError={null}
        formatMode="formatted"
        setFormatMode={() => {}}
        onTreeEdit={() => {}}
      />
    )
    const copyBtn = screen.getByRole('button', { name: /copy/i })
    expect(copyBtn).toBeInTheDocument()
    expect(copyBtn).toHaveAttribute('aria-label', 'Copy')
    expect(copyBtn).toHaveAttribute('title', 'Copy')
    expect(screen.queryByRole('button', { name: /paste/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })
})
