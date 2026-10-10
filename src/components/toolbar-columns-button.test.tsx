import TableWright from '@components/table-wright';
import Toolbar from '@components/toolbar';
import ToolbarColumnsButton from '@components/toolbar-columns-button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import mockNarrowViewport from '../test/narrow-viewport';

const columns = [{ field: 'name', headerName: 'Name', width: 120 }];
const rows = [{ id: 1, name: 'Ada' }];

const ColumnsToolbar = () => (
  <Toolbar>
    <ToolbarColumnsButton />
  </Toolbar>
);

describe('ToolbarColumnsButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the columns panel', async () => {
    const user = userEvent.setup();
    render(
      <TableWright rows={rows} columns={columns} showToolbar slots={{ toolbar: ColumnsToolbar }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Columns' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Name');
  });

  it('hides when the grid disables the column selector', () => {
    render(
      <TableWright
        rows={rows}
        columns={columns}
        showToolbar
        disableColumnSelector
        slots={{ toolbar: ColumnsToolbar }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('turns into an icon button with a tooltip below md', async () => {
    mockNarrowViewport();
    const user = userEvent.setup();
    render(
      <TableWright rows={rows} columns={columns} showToolbar slots={{ toolbar: ColumnsToolbar }} />,
    );

    const button = screen.getByRole('button', { name: 'Columns' });
    expect(button).not.toHaveTextContent('Columns');
    await user.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Columns');

    await user.click(button);
    expect(await screen.findByRole('checkbox', { name: 'Name' })).toBeInTheDocument();
  });
});
