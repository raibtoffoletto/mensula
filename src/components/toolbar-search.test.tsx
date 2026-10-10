import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarSearch, { type ToolbarSearchProps } from '@components/toolbar-search';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import mockNarrowViewport from '../test/narrow-viewport';

const columns = [
  { field: 'name', headerName: 'Name', width: 120 },
  { field: 'role', headerName: 'Role', width: 120 },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
];

const renderSearch = (props: ToolbarSearchProps = {}) =>
  render(
    <Mensula
      rows={rows}
      columns={columns}
      showToolbar
      slots={{
        toolbar: () => (
          <Toolbar>
            <ToolbarSearch {...props} />
          </Toolbar>
        ),
      }}
    />,
  );

describe('ToolbarSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('filters rows through the always-open quick filter', async () => {
    const user = userEvent.setup();
    renderSearch();

    // No trigger to click: the search field is locked open.
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
    // Like the stock toolbar, the label sits on the text field's root, not the input.
    const searchbox = screen.getByRole('searchbox');
    await user.type(searchbox, 'Grace');

    await waitFor(() => expect(screen.queryByText('Ada')).not.toBeInTheDocument());
    expect(screen.getByText('Grace')).toBeInTheDocument();

    // Clearing and leaving the field must not collapse it.
    await user.clear(searchbox);
    await user.tab();
    expect(screen.getByRole('searchbox')).toBeVisible();
  });

  it('clears the search from its clear button', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox'), 'Grace');
    await waitFor(() => expect(screen.queryByText('Ada')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('searchbox')).toHaveValue('');
    await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
  });

  it('collapses behind a search button below md', async () => {
    mockNarrowViewport();
    const user = userEvent.setup();
    renderSearch();

    const trigger = screen.getByRole('button', { name: 'Search' });
    expect(trigger).not.toHaveAttribute('aria-disabled', 'true');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveFocus());

    await user.keyboard('Grace');
    await waitFor(() => expect(screen.queryByText('Ada')).not.toBeInTheDocument());

    // Emptied and left, it collapses back to the button.
    await user.clear(screen.getByRole('searchbox'));
    await user.tab();
    await waitFor(() => expect(trigger).not.toHaveAttribute('aria-disabled', 'true'));
  });

  it('applies its parser and text field props', async () => {
    const user = userEvent.setup();
    renderSearch({
      // "admin" matches no row as typed; only the parsed "admiral" finds Grace.
      quickFilterParser: (input) =>
        input ? [input.toLowerCase().replace('admin', 'admiral')] : [],
      slotProps: { root: { placeholder: 'Find a pioneer' } },
    });

    const searchbox = screen.getByPlaceholderText('Find a pioneer');
    await user.type(searchbox, 'admin');

    await waitFor(() => expect(screen.queryByText('Ada')).not.toBeInTheDocument());
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });
});
