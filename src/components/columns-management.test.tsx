import { DRAG_PREVIEW_CLASS } from '@lib/drag-preview';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TableWright, { type TableWrightProps } from './table-wright';

const rows = [{ id: 1, name: 'Ada', role: 'Engineer', city: 'London' }];
const columns = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Name' },
  { field: 'role', headerName: 'Role' },
  { field: 'city', headerName: 'City' },
];

const headerFields = () =>
  screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-field'));

const openPanel = async (props: Partial<TableWrightProps> = {}) => {
  const user = userEvent.setup();
  render(<TableWright rows={rows} columns={columns} showToolbar {...props} />);
  await user.click(screen.getByRole('button', { name: 'Columns' }));
  return { user, panel: await screen.findByRole('tooltip') };
};

const panelRow = (panel: HTMLElement, field: string) =>
  panel.querySelector<HTMLElement>(`.MuiDataGrid-columnsManagement > [data-field="${field}"]`)!;

const visibleNames = (panel: HTMLElement) =>
  within(panel)
    .queryAllByRole('checkbox')
    .map((checkbox) => checkbox.getAttribute('name'))
    .filter((name) => name !== 'Show/Hide All');

afterEach(() => {
  // @ts-expect-error -- jsdom does not implement it; some tests install a mock.
  delete document.elementFromPoint;
});

describe('ColumnsManagement', () => {
  it('lists columns in grid order with a visibility checkbox and a drag handle each', async () => {
    const { panel } = await openPanel({ initialState: { pinnedColumns: { right: ['id'] } } });

    const checkboxes = within(panel).getAllByRole('checkbox', { name: /^(ID|Name|Role|City)$/ });
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('name'))).toEqual([
      'name',
      'role',
      'city',
      'id',
    ]);
    expect(within(panel).getByRole('button', { name: 'Reorder Name' })).toBeInTheDocument();
  });

  it('moves a column with the arrow keys on its handle, keeping focus', async () => {
    const onColumnOrderChange = vi.fn();
    const { user, panel } = await openPanel({ onColumnOrderChange });
    const handle = within(panel).getByRole('button', { name: 'Reorder Name' });

    handle.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');

    expect(headerFields()).toEqual(['id', 'role', 'city', 'name']);
    expect(within(panel).getByRole('button', { name: 'Reorder Name' })).toHaveFocus();
    expect(onColumnOrderChange).toHaveBeenCalledTimes(2);
    expect(onColumnOrderChange.mock.calls[1]![0]).toMatchObject({ oldIndex: 2, targetIndex: 3 });

    await user.keyboard('{ArrowDown}');
    expect(headerFields()).toEqual(['id', 'role', 'city', 'name']);
  });

  it('moves past fixed columns like a drag, and stays within the pinned section', async () => {
    const { user, panel } = await openPanel({
      columns: columns.map((column) => ({ ...column, disableReorder: column.field === 'role' })),
      initialState: { pinnedColumns: { left: ['id'] } },
    });
    expect(within(panel).queryByRole('button', { name: 'Reorder Role' })).not.toBeInTheDocument();

    within(panel).getByRole('button', { name: 'Reorder Name' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(headerFields()).toEqual(['id', 'role', 'name', 'city']);

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('resets both visibility and order', async () => {
    const { user, panel } = await openPanel();
    const reset = within(panel).getByRole('button', { name: 'Reset' });
    expect(reset).toBeDisabled();

    within(panel).getByRole('button', { name: 'Reorder ID' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.click(within(panel).getByRole('checkbox', { name: 'City' }));
    expect(headerFields()).toEqual(['name', 'id', 'role']);

    await user.click(reset);

    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
    expect(reset).toBeDisabled();
  });

  it('hides the handles with disableColumnReorder', async () => {
    const { panel } = await openPanel({ disableColumnReorder: true });
    expect(within(panel).queryByRole('button', { name: /^Reorder/ })).not.toBeInTheDocument();
  });

  it('hides the handles when the list is sorted', async () => {
    const { panel } = await openPanel({ slotProps: { columnsManagement: { sort: 'asc' } } });
    expect(within(panel).queryByRole('button', { name: /^Reorder/ })).not.toBeInTheDocument();
    expect(within(panel).getByRole('checkbox', { name: 'City' })).toBeInTheDocument();
  });

  it('labels handles with getReorderHandleLabel', async () => {
    const { panel } = await openPanel({
      slotProps: { columnsManagement: { getReorderHandleLabel: (name) => `Mover ${name}` } },
    });
    expect(within(panel).getByRole('button', { name: 'Mover City' })).toBeInTheDocument();
  });

  it('moves a column by dragging its handle, and fires onColumnOrderChange on drop', async () => {
    const onColumnOrderChange = vi.fn();
    const { panel } = await openPanel({ onColumnOrderChange });
    const handle = within(panel).getByRole('button', { name: 'Reorder ID' });
    document.elementFromPoint = vi.fn(() => panelRow(panel, 'role'));

    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientY: 40 });

    expect(headerFields()).toEqual(['name', 'role', 'id', 'city']);
    expect(panelRow(panel, 'id')).toHaveAttribute('data-dragging');
    expect(panel.querySelector(`.${DRAG_PREVIEW_CLASS}`)).toHaveTextContent('ID');
    expect(onColumnOrderChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(panelRow(panel, 'id')).not.toHaveAttribute('data-dragging');
    expect(onColumnOrderChange).toHaveBeenCalledTimes(1);
    expect(onColumnOrderChange.mock.calls[0]![0]).toMatchObject({ oldIndex: 0, targetIndex: 2 });
    await waitFor(() =>
      expect(panel.querySelector(`.${DRAG_PREVIEW_CLASS}`)).not.toBeInTheDocument(),
    );
  });

  it('ignores secondary-button presses on a handle', async () => {
    const { panel } = await openPanel();
    document.elementFromPoint = vi.fn(() => panelRow(panel, 'role'));

    fireEvent.pointerDown(within(panel).getByRole('button', { name: 'Reorder ID' }), {
      button: 2,
      pointerId: 1,
    });
    fireEvent.pointerMove(window, { pointerId: 1, clientY: 40 });
    fireEvent.pointerUp(window, { pointerId: 1 });

    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('filters by search, shows an empty state, and clears the search', async () => {
    const { user, panel } = await openPanel();
    const search = within(panel).getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveFocus();

    await user.type(search, 'NA');
    await waitFor(() => expect(visibleNames(panel)).toEqual(['name']));

    await user.type(search, 'zzz');
    expect(await within(panel).findByText('No columns')).toBeInTheDocument();

    await user.click(within(panel).getByRole('button', { name: 'Clear', hidden: true }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(visibleNames(panel)).toEqual(['id', 'name', 'role', 'city']);
  });

  it('shows and hides all columns', async () => {
    const { user, panel } = await openPanel({
      columns: columns.map((column) => ({ ...column, hideable: column.field !== 'id' })),
    });
    const toggleAll = within(panel).getByRole('checkbox', { name: 'Show/Hide All' });

    await user.click(toggleAll);
    expect(headerFields()).toEqual(['id']);
    expect(toggleAll).not.toBeChecked();

    await user.click(within(panel).getByRole('checkbox', { name: 'Role' }));
    expect(toggleAll).toHaveAttribute('data-indeterminate', 'true');

    await user.click(toggleAll);
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it("toggles only the matching columns with toggleAllMode: 'filteredOnly'", async () => {
    const { user, panel } = await openPanel({
      slotProps: { columnsManagement: { toggleAllMode: 'filteredOnly' } },
    });

    await user.type(within(panel).getByRole('searchbox', { name: 'Search' }), 'i');
    await waitFor(() => expect(visibleNames(panel)).toEqual(['id', 'city']));
    await user.click(within(panel).getByRole('checkbox', { name: 'Show/Hide All' }));

    expect(headerFields()).toEqual(['name', 'role']);
  });

  it('lists only getTogglableColumns, and toggles only those', async () => {
    const { user, panel } = await openPanel({
      slotProps: { columnsManagement: { getTogglableColumns: () => ['name', 'city'] } },
    });
    expect(visibleNames(panel)).toEqual(['name', 'city']);

    await user.click(within(panel).getByRole('checkbox', { name: 'Show/Hide All' }));

    expect(headerFields()).toEqual(['id', 'role']);
  });

  it('focuses the first hideable checkbox with autoFocusSearchField: false', async () => {
    const { panel } = await openPanel({
      columns: columns.map((column) => ({ ...column, hideable: column.field !== 'id' })),
      slotProps: { columnsManagement: { autoFocusSearchField: false } },
    });

    expect(within(panel).getByRole('checkbox', { name: 'Name' })).toHaveFocus();
  });

  it('omits the footer controls on request', async () => {
    const { panel } = await openPanel({
      slotProps: { columnsManagement: { disableShowHideToggle: true, disableResetButton: true } },
    });

    expect(within(panel).queryByRole('checkbox', { name: 'Show/Hide All' })).toBeNull();
    expect(within(panel).queryByRole('button', { name: 'Reset' })).toBeNull();
  });
});
