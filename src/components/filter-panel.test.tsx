import Mensula from '@components/mensula';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

const columns = [
  { field: 'name', headerName: 'Name', width: 120 },
  { field: 'role', headerName: 'Role', width: 120 },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
];

const engineers = { id: 1, field: 'role', operator: 'equals', value: 'Engineer' };
const named = { id: 2, field: 'name', operator: 'contains', value: 'a' };

const filterForms = () => document.querySelectorAll('.MuiDataGrid-filterForm');

describe('FilterPanel', () => {
  it('adds a filter, keeping the placeholder one', async () => {
    const user = userEvent.setup();
    render(<Mensula rows={rows} columns={columns} showToolbar />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(filterForms()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add filter' }));
    expect(filterForms()).toHaveLength(2);
    // The second form gets the logic operator selector.
    expect(screen.getByRole('combobox', { name: 'Logic operator' })).toBeInTheDocument();
  });

  it('shows every filter and removes them all', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        initialState={{ filter: { filterModel: { items: [engineers, named] } } }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(filterForms()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Remove all' }));
    expect(screen.getByText('Grace')).toBeInTheDocument();
  });

  it('honors disableAddFilterButton and disableRemoveAllButton', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        slotProps={{ filterPanel: { disableAddFilterButton: true, disableRemoveAllButton: true } }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.queryByRole('button', { name: 'Add filter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove all' })).not.toBeInTheDocument();
  });

  it('keeps the stock panel with disableMultipleColumnsFiltering', async () => {
    const user = userEvent.setup();
    render(
      <Mensula rows={rows} columns={columns} showToolbar disableMultipleColumnsFiltering />,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(filterForms()).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Add filter' })).not.toBeInTheDocument();
  });
});
