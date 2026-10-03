import useColumnPinning from '@hooks/use-column-pinning';
import useDetailPanel from '@hooks/use-detail-panel';
import { GRID_DETAIL_PANEL_TOGGLE_COL_DEF } from '@lib/detail-panel';
import type { GridRowId, GridRowParams } from '@mui/x-data-grid';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TableWright from './table-wright';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 150 },
];
const rows = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
];

const getDetailPanelContent = ({ row }: GridRowParams) => <p>Details of {row.name}</p>;

describe('TableWright', () => {
  it('renders rows and column headers', () => {
    render(<TableWright rows={rows} columns={columns} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Linus')).toBeInTheDocument();
  });

  it('adds no toggle column without getDetailPanelContent', () => {
    render(<TableWright rows={rows} columns={columns} />);

    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument();
  });
});

describe('TableWright master-detail', () => {
  it('prepends a labelled toggle column', () => {
    render(
      <TableWright rows={rows} columns={columns} getDetailPanelContent={getDetailPanelContent} />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Detail panel toggle');
    expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(2);
  });

  it('expands and collapses a row panel', async () => {
    const user = userEvent.setup();
    render(
      <TableWright rows={rows} columns={columns} getDetailPanelContent={getDetailPanelContent} />,
    );

    const [toggle] = screen.getAllByRole('button', { name: 'Expand' });
    await user.click(toggle!);

    expect(screen.getByText('Details of Ada')).toBeInTheDocument();
    expect(screen.queryByText('Details of Linus')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Collapse');

    await user.click(toggle!);

    expect(screen.queryByText('Details of Ada')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('disables the toggle for rows without content', async () => {
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={({ row }) => (row.id === 1 ? <p>Only Ada</p> : null)}
      />,
    );

    const [adaToggle, linusToggle] = screen.getAllByRole('button', { name: 'Expand' });
    expect(adaToggle).toBeEnabled();
    expect(linusToggle).toBeDisabled();
  });

  it('reserves the panel height as bottom spacing on the expanded row', async () => {
    const user = userEvent.setup();
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        getDetailPanelHeight={() => 120}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);

    const panel = screen.getByText('Details of Ada').closest('.MuiDataGrid-detailPanel');
    const row = screen.getByText('Ada').closest('[role="row"]');
    expect(panel).toHaveStyle({ height: '120px', marginTop: '-120px' });
    expect(row).toHaveStyle({ marginBottom: '120px' });
  });

  it('does not fire onRowClick when toggling', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('starts with the rows from initialState expanded', () => {
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        initialState={{ detailPanel: { expandedRowIds: new Set([2]) } }}
      />,
    );

    expect(screen.getByText('Details of Linus')).toBeInTheDocument();
    expect(screen.queryByText('Details of Ada')).not.toBeInTheDocument();
  });

  it('supports controlled expanded rows', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        detailPanelExpandedRowIds={new Set([1])}
        onDetailPanelExpandedRowIdsChange={onChange}
      />,
    );

    expect(screen.getByText('Details of Ada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand' }));

    expect(onChange).toHaveBeenCalledWith(new Set<GridRowId>([1, 2]));
    // Still controlled: nothing changes until the parent passes the new set.
    expect(screen.queryByText('Details of Linus')).not.toBeInTheDocument();
  });

  it('keeps a consumer-placed toggle column instead of adding another', () => {
    render(
      <TableWright
        rows={rows}
        columns={[...columns, { ...GRID_DETAIL_PANEL_TOGGLE_COL_DEF, headerName: 'More' }]}
        getDetailPanelContent={getDetailPanelContent}
      />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[2]).toHaveAttribute('data-field', GRID_DETAIL_PANEL_TOGGLE_COL_DEF.field);
  });

  it('exposes the detail panel API to content via useDetailPanel', async () => {
    const user = userEvent.setup();
    const CloseButton = ({ id }: { id: GridRowId }) => {
      const { toggleDetailPanel } = useDetailPanel();
      return <button onClick={() => toggleDetailPanel(id)}>Close {id}</button>;
    };
    render(
      <TableWright
        rows={rows}
        columns={columns}
        getDetailPanelContent={({ id }) => <CloseButton id={id} />}
        initialState={{ detailPanel: { expandedRowIds: new Set([1]) } }}
      />,
    );

    const panel = screen.getByText('Close 1').closest('.MuiDataGrid-detailPanel') as HTMLElement;
    await user.click(within(panel).getByRole('button'));

    expect(screen.queryByText('Close 1')).not.toBeInTheDocument();
  });
});

describe('TableWright column pinning', () => {
  const people = [
    { id: 1, name: 'Ada', role: 'Engineer', city: 'London' },
    { id: 2, name: 'Linus', role: 'Maintainer', city: 'Portland' },
  ];
  const peopleColumns = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'role', headerName: 'Role' },
    { field: 'city', headerName: 'City' },
  ];
  const headerFields = () =>
    screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-field'));
  const header = (name: string) => screen.getByRole('columnheader', { name });

  it('pins columns from initialState to the edges', () => {
    render(
      <TableWright
        rows={people}
        columns={peopleColumns}
        initialState={{ pinnedColumns: { left: ['name'], right: ['id'] } }}
      />,
    );

    expect(headerFields()).toEqual(['name', 'role', 'city', 'id']);
    expect(header('Name')).toHaveClass('MuiDataGrid-columnHeader--pinnedLeft');
    expect(header('ID')).toHaveClass('MuiDataGrid-columnHeader--pinnedRight');
    expect(screen.getByText('Ada').closest('[role="gridcell"]')).toHaveClass(
      'MuiDataGrid-cell--pinnedLeft',
    );
  });

  it('returns a column to its declared position when unpinned', () => {
    const { rerender } = render(
      <TableWright rows={people} columns={peopleColumns} pinnedColumns={{ right: ['name'] }} />,
    );
    expect(headerFields()).toEqual(['id', 'role', 'city', 'name']);

    rerender(<TableWright rows={people} columns={peopleColumns} pinnedColumns={{}} />);

    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
    expect(header('Name')).not.toHaveClass('MuiDataGrid-columnHeader--pinnedRight');
  });

  it('pins and unpins from the column menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TableWright rows={people} columns={peopleColumns} onPinnedColumnsChange={onChange} />);

    await user.click(within(header('City')).getByLabelText('City column menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Pin to left' }));

    expect(onChange).toHaveBeenLastCalledWith({ left: ['city'], right: [] });
    expect(headerFields()).toEqual(['city', 'id', 'name', 'role']);

    await user.click(within(header('City')).getByLabelText('City column menu'));
    expect(screen.getByRole('menuitem', { name: 'Pin to right' })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Unpin' }));

    expect(onChange).toHaveBeenLastCalledWith({ left: [], right: [] });
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('hides the menu items with disableColumnPinning or pinnable: false', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TableWright rows={people} columns={peopleColumns} disableColumnPinning />,
    );
    await user.click(within(header('Role')).getByLabelText('Role column menu'));
    expect(screen.queryByRole('menuitem', { name: 'Pin to left' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    rerender(
      <TableWright
        rows={people}
        columns={peopleColumns.map((column) => ({ ...column, pinnable: column.field !== 'role' }))}
      />,
    );
    await user.click(within(header('Role')).getByLabelText('Role column menu'));
    expect(screen.queryByRole('menuitem', { name: 'Pin to left' })).not.toBeInTheDocument();
  });

  it('keeps the checkbox column first and lets it be pinned', () => {
    render(
      <TableWright
        rows={people}
        columns={peopleColumns}
        checkboxSelection
        initialState={{ pinnedColumns: { left: ['__check__', 'name'] } }}
      />,
    );

    expect(headerFields()).toEqual(['__check__', 'name', 'id', 'role', 'city']);
  });

  it('exposes pinning to custom UI via useColumnPinning', async () => {
    const user = userEvent.setup();
    const PinHeader = () => {
      const { pinColumn, isColumnPinned } = useColumnPinning();
      return (
        <button onClick={() => pinColumn('role', 'right')}>
          Role {isColumnPinned('role') || 'free'}
        </button>
      );
    };
    render(
      <TableWright
        rows={people}
        columns={peopleColumns.map((column) =>
          column.field === 'role' ? { ...column, renderHeader: () => <PinHeader /> } : column,
        )}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Role free' }));

    expect(screen.getByRole('button', { name: 'Role right' })).toBeInTheDocument();
    expect(headerFields().at(-1)).toBe('role');
  });
});

describe('TableWright row pinning', () => {
  const people = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
    { id: 3, name: 'Grace' },
  ];
  const nameColumns = [{ field: 'name', headerName: 'Name' }];
  const pinnedRows = {
    top: [{ id: 'total', name: 'Total' }],
    bottom: [{ id: 'avg', name: 'Avg' }],
  };
  const section = (position: 'top' | 'bottom') =>
    document.querySelector(`.MuiDataGrid-pinnedRows--${position}`) as HTMLElement;

  it('renders pinned rows above and below the scrolling rows', () => {
    render(<TableWright rows={people} columns={nameColumns} pinnedRows={pinnedRows} />);

    expect(within(section('top')).getByText('Total')).toBeInTheDocument();
    expect(within(section('bottom')).getByText('Avg')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '6');
  });

  it('keeps pinned rows out of filtering and sorting', () => {
    render(
      <TableWright
        rows={people}
        columns={nameColumns}
        pinnedRows={pinnedRows}
        initialState={{
          sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
          filter: { filterModel: { items: [{ field: 'name', operator: 'equals', value: 'Ada' }] } },
        }}
      />,
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Avg')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.queryByText('Linus')).not.toBeInTheDocument();
  });

  it('does not make pinned rows selectable', () => {
    render(
      <TableWright rows={people} columns={nameColumns} pinnedRows={pinnedRows} checkboxSelection />,
    );

    expect(within(section('top')).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3);
  });

  it('shows a row from rows only once while pinned, and restores it when unpinned', () => {
    const { rerender } = render(
      <TableWright rows={people} columns={nameColumns} pinnedRows={{ top: [people[1]!] }} />,
    );

    expect(screen.getAllByText('Linus')).toHaveLength(1);
    expect(within(section('top')).getByText('Linus')).toBeInTheDocument();

    rerender(<TableWright rows={people} columns={nameColumns} pinnedRows={{}} />);

    expect(section('top')).toBeNull();
    expect(screen.getAllByText('Linus')).toHaveLength(1);
    // Back at its original index, not appended at the end.
    const names = screen.getAllByRole('row').map((row) => row.textContent);
    expect(names.filter((name) => ['Ada', 'Linus', 'Grace'].includes(name ?? ''))).toEqual([
      'Ada',
      'Linus',
      'Grace',
    ]);
  });

  it('never gives pinned rows a detail panel toggle', () => {
    render(
      <TableWright
        rows={people}
        columns={nameColumns}
        pinnedRows={pinnedRows}
        getDetailPanelContent={getDetailPanelContent}
      />,
    );

    expect(within(section('top')).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(3);
  });
});
