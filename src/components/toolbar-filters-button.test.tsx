import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarFiltersButton from '@components/toolbar-filters-button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import mockNarrowViewport from '../test/narrow-viewport';

const columns = [{ field: 'name', headerName: 'Name', width: 120 }];
const rows = [{ id: 1, name: 'Ada' }];

const FiltersToolbar = () => (
  <Toolbar>
    <ToolbarFiltersButton />
  </Toolbar>
);

describe('ToolbarFiltersButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the filter panel', async () => {
    const user = userEvent.setup();
    render(
      <Mensula rows={rows} columns={columns} showToolbar slots={{ toolbar: FiltersToolbar }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(document.querySelector('.MuiDataGrid-filterForm')).toBeInTheDocument();
  });

  it('hides when the grid disables column filtering', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        disableColumnFilter
        slots={{ toolbar: FiltersToolbar }}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it('turns into an icon button with a tooltip below md', async () => {
    mockNarrowViewport();
    const user = userEvent.setup();
    render(
      <Mensula rows={rows} columns={columns} showToolbar slots={{ toolbar: FiltersToolbar }} />,
    );

    const button = screen.getByRole('button', { name: 'Filters' });
    expect(button).not.toHaveTextContent('Filters');
    await user.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Filters');

    await user.click(button);
    expect(document.querySelector('.MuiDataGrid-filterForm')).toBeInTheDocument();
  });
});
