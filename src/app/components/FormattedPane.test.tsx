import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormattedPane from './FormattedPane';

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
    );
    const copyBtn = screen.getByRole('button', { name: /copy/i });
    expect(copyBtn).toBeInTheDocument();
    expect(copyBtn).toHaveAttribute('aria-label', 'Copy');
    expect(copyBtn).toHaveAttribute('title', 'Copy');
    expect(screen.queryByRole('button', { name: /paste/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('renders Save button with aria-label and title', () => {
    render(
      <FormattedPane
        parsed={{ example: true }}
        parseError={null}
        formatMode="formatted"
        setFormatMode={() => {}}
        onTreeEdit={() => {}}
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toHaveAttribute('aria-label', 'Save');
    expect(saveBtn).toHaveAttribute('title', 'Save');
    expect(saveBtn.querySelector('.fa-floppy-disk')).toBeInTheDocument();
  });

  it('disables Save button when parsed is null', () => {
    render(
      <FormattedPane
        parsed={null}
        parseError={null}
        formatMode="formatted"
        setFormatMode={() => {}}
        onTreeEdit={() => {}}
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).toBeDisabled();
  });

  it('enables Save button when parsed is valid', () => {
    render(
      <FormattedPane
        parsed={{ example: true }}
        parseError={null}
        formatMode="formatted"
        setFormatMode={() => {}}
        onTreeEdit={() => {}}
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    expect(saveBtn).not.toBeDisabled();
  });

  it('triggers download with JSON blob when Save is clicked', async () => {
    const mockUrl = 'blob:mock-url';
    const createObjectURL = vi.fn(() => mockUrl);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    render(
      <FormattedPane
        parsed={{ foo: 1 }}
        parseError={null}
        formatMode="formatted"
        setFormatMode={() => {}}
        onTreeEdit={() => {}}
        tabName="My Tab"
      />
    );
    const saveBtn = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveBtn);

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(await blob.text()).toBe(JSON.stringify({ foo: 1 }, null, 2));
    expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);

    vi.unstubAllGlobals();
  });
});
