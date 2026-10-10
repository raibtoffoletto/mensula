import useColumnPinning from '@hooks/use-column-pinning';
import useColumnReorder from '@hooks/use-column-reorder';
import useDetailPanel from '@hooks/use-detail-panel';
import useRowHighlight from '@hooks/use-row-highlight';
import useRowPinning from '@hooks/use-row-pinning';
import { ROW_HIGHLIGHTED_CLASS } from '@lib/constants';
import { GRID_DETAIL_PANEL_TOGGLE_COL_DEF } from '@lib/detail-panel';
import { GRID_ROW_MENU_COL_DEF } from '@lib/row-menu';
import { DRAG_PREVIEW_CLASS } from '@lib/drag-preview';
import type { GridRowId, GridRowParams } from '@mui/x-data-grid';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Mensula from './mensula';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 150 },
];
const rows = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
];

const getDetailPanelContent = ({ row }: GridRowParams) => <p>Details of {row.name}</p>;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Mensula', () => {
  it('renders rows and column headers', () => {
    render(<Mensula rows={rows} columns={columns} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Linus')).toBeInTheDocument();
  });

  it('adds no toggle column without getDetailPanelContent', () => {
    render(<Mensula rows={rows} columns={columns} />);

    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument();
  });
});

describe('Mensula master-detail', () => {
  it('prepends a labelled toggle column', () => {
    render(
      <Mensula rows={rows} columns={columns} getDetailPanelContent={getDetailPanelContent} />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Detail panel toggle');
    expect(screen.getAllByRole('button', { name: 'Expand' })).toHaveLength(2);
  });

  it('expands and collapses a row panel', async () => {
    const user = userEvent.setup();
    render(
      <Mensula rows={rows} columns={columns} getDetailPanelContent={getDetailPanelContent} />,
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
      <Mensula
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
      <Mensula
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
      <Mensula
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
      <Mensula
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
      <Mensula
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
      <Mensula
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
      <Mensula
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

  it("measures 'auto' panels once when ResizeObserver is unavailable", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(80);
    render(
      <Mensula
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        getDetailPanelHeight={() => 'auto'}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);

    expect(screen.getByText('Ada').closest('[role="row"]')).toHaveStyle({ marginBottom: '80px' });
    expect(screen.getByText('Details of Ada').closest('.MuiDataGrid-detailPanel')).toHaveStyle({
      height: 'auto',
    });
  });

  it("follows the content height of 'auto' panels as it resizes", async () => {
    const user = userEvent.setup();
    let contentHeight = 80;
    const observers: { callback: () => void; disconnect: () => void }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn();
        constructor(public callback: () => void) {
          observers.push(this);
        }
        observe() {}
        unobserve() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(() => contentHeight);
    render(
      <Mensula
        rows={rows}
        columns={columns}
        getDetailPanelContent={getDetailPanelContent}
        getDetailPanelHeight={() => 'auto'}
      />,
    );
    const adaRow = () => screen.getByText('Ada').closest('[role="row"]');

    await user.click(screen.getAllByRole('button', { name: 'Expand' })[0]!);
    expect(adaRow()).toHaveStyle({ marginBottom: '80px' });

    contentHeight = 140;
    act(() => observers.at(-1)!.callback());
    expect(adaRow()).toHaveStyle({ marginBottom: '140px' });

    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(observers.at(-1)!.disconnect).toHaveBeenCalled();
    expect(adaRow()).not.toHaveStyle({ marginBottom: '140px' });
  });

  it('ignores toggling rows without content or that do not exist', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const Toggles = () => {
      const { toggleDetailPanel, hasDetailPanel } = useDetailPanel();
      return (
        <>
          <button onClick={() => toggleDetailPanel(2)}>Toggle 2</button>
          <button onClick={() => toggleDetailPanel(99)}>Toggle 99</button>
          <span>{hasDetailPanel(99) ? 'has 99' : 'no 99'}</span>
        </>
      );
    };
    render(
      <Mensula
        rows={rows}
        columns={columns}
        getDetailPanelContent={({ row }) => (row.id === 1 ? <Toggles /> : null)}
        initialState={{ detailPanel: { expandedRowIds: new Set([1]) } }}
        onDetailPanelExpandedRowIdsChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Toggle 2' }));
    await user.click(screen.getByRole('button', { name: 'Toggle 99' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('no 99')).toBeInTheDocument();
  });
});

describe('Mensula column pinning', () => {
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
      <Mensula
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
      <Mensula rows={people} columns={peopleColumns} pinnedColumns={{ right: ['name'] }} />,
    );
    expect(headerFields()).toEqual(['id', 'role', 'city', 'name']);

    rerender(<Mensula rows={people} columns={peopleColumns} pinnedColumns={{}} />);

    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
    expect(header('Name')).not.toHaveClass('MuiDataGrid-columnHeader--pinnedRight');
  });

  it('pins and unpins from the column menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Mensula rows={people} columns={peopleColumns} onPinnedColumnsChange={onChange} />);

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
      <Mensula rows={people} columns={peopleColumns} disableColumnPinning />,
    );
    await user.click(within(header('Role')).getByLabelText('Role column menu'));
    expect(screen.queryByRole('menuitem', { name: 'Pin to left' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    rerender(
      <Mensula
        rows={people}
        columns={peopleColumns.map((column) => ({ ...column, pinnable: column.field !== 'role' }))}
      />,
    );
    await user.click(within(header('Role')).getByLabelText('Role column menu'));
    expect(screen.queryByRole('menuitem', { name: 'Pin to left' })).not.toBeInTheDocument();
  });

  it('keeps the checkbox column first and lets it be pinned', () => {
    render(
      <Mensula
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
      <Mensula
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

  it('pins to the right, and moves a column across sides, from the column menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Mensula rows={people} columns={peopleColumns} onPinnedColumnsChange={onChange} />);
    const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

    await user.click(within(header('ID')).getByLabelText('ID column menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Pin to right' }));
    expect(onChange).toHaveBeenLastCalledWith({ left: [], right: ['id'] });
    expect(headerFields()).toEqual(['name', 'role', 'city', 'id']);

    await user.click(within(header('ID')).getByLabelText('ID column menu'));
    expect(menuItems()).toEqual(expect.arrayContaining(['Pin to left', 'Unpin']));
    expect(menuItems()).not.toContain('Pin to right');
    await user.click(screen.getByRole('menuitem', { name: 'Pin to left' }));

    expect(onChange).toHaveBeenLastCalledWith({ left: ['id'], right: [] });
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('ignores pinning a column to the side it is already on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const PinAgain = () => {
      const { pinColumn } = useColumnPinning();
      return <button onClick={() => pinColumn('role', 'left')}>Pin role left</button>;
    };
    render(
      <Mensula
        rows={people}
        columns={peopleColumns.map((column) =>
          column.field === 'city' ? { ...column, renderHeader: () => <PinAgain /> } : column,
        )}
        initialState={{ pinnedColumns: { left: ['role'] } }}
        onPinnedColumnsChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pin role left' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Mensula row pinning', () => {
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
    render(<Mensula rows={people} columns={nameColumns} pinnedRows={pinnedRows} />);

    expect(within(section('top')).getByText('Total')).toBeInTheDocument();
    expect(within(section('bottom')).getByText('Avg')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '6');
  });

  it('keeps pinned rows out of filtering and sorting', () => {
    render(
      <Mensula
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
      <Mensula rows={people} columns={nameColumns} pinnedRows={pinnedRows} checkboxSelection />,
    );

    expect(within(section('top')).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3);
  });

  it('shows a row from rows only once while pinned, and restores it when unpinned', () => {
    const { rerender } = render(
      <Mensula rows={people} columns={nameColumns} pinnedRows={{ top: [people[1]!] }} />,
    );

    expect(screen.getAllByText('Linus')).toHaveLength(1);
    expect(within(section('top')).getByText('Linus')).toBeInTheDocument();

    rerender(<Mensula rows={people} columns={nameColumns} pinnedRows={{}} />);

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
      <Mensula
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

describe('Mensula row menu', () => {
  const people = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
    { id: 3, name: 'Grace' },
  ];
  const nameColumns = [{ field: 'name', headerName: 'Name' }];
  const section = (position: 'top' | 'bottom') =>
    document.querySelector(`.MuiDataGrid-pinnedRows--${position}`) as HTMLElement | null;
  const rowOf = (name: string) => screen.getByText(name).closest('[role="row"]') as HTMLElement;
  const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent);
  const openMenu = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
    user.click(within(rowOf(name)).getByRole('button', { name: 'more' }));
  const choose = async (user: ReturnType<typeof userEvent.setup>, name: string, label: string) => {
    await openMenu(user, name);
    await user.click(screen.getByRole('menuitem', { name: label }));
  };
  const headerFields = () =>
    screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-field'));

  it('adds no menu column without showRowMenu', () => {
    render(<Mensula rows={people} columns={nameColumns} />);

    expect(headerFields()).toEqual(['name']);
  });

  it('prepends a labelled, fixed menu column after the checkbox column', () => {
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        checkboxSelection
        getDetailPanelContent={getDetailPanelContent}
      />,
    );

    expect(headerFields()).toEqual([
      '__check__',
      '__row_menu__',
      '__detail_panel_toggle__',
      'name',
    ]);
    expect(screen.getByRole('columnheader', { name: 'Row menu' })).toBeInTheDocument();
  });

  it('keeps a consumer-placed menu column instead of adding another', () => {
    render(
      <Mensula rows={people} columns={[...nameColumns, GRID_ROW_MENU_COL_DEF]} showRowMenu />,
    );

    expect(headerFields()).toEqual(['name', '__row_menu__']);
  });

  it('does not select the row or fire onRowClick when used', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<Mensula rows={people} columns={nameColumns} showRowMenu onRowClick={onRowClick} />);

    await openMenu(user, 'Ada');

    expect(onRowClick).not.toHaveBeenCalled();
    expect(rowOf('Ada')).not.toHaveClass('Mui-selected');
  });

  it('pins a row to the top, moves it to the bottom, and unpins it', async () => {
    const user = userEvent.setup();
    const onPinnedRowsChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        onPinnedRowsChange={onPinnedRowsChange}
      />,
    );

    await openMenu(user, 'Linus');
    expect(menuItems()).toEqual(['Pin to top', 'Pin to bottom', 'Highlight']);
    await user.click(screen.getByRole('menuitem', { name: 'Pin to top' }));

    expect(within(section('top')!).getByText('Linus')).toBeInTheDocument();
    expect(screen.getAllByText('Linus')).toHaveLength(1);
    expect(onPinnedRowsChange).toHaveBeenLastCalledWith({ top: [people[1]], bottom: [] });

    await openMenu(user, 'Linus');
    expect(menuItems()).toEqual(['Unpin', 'Pin to bottom', 'Highlight']);
    await user.click(screen.getByRole('menuitem', { name: 'Pin to bottom' }));

    expect(section('top')).toBeNull();
    expect(within(section('bottom')!).getByText('Linus')).toBeInTheDocument();

    await openMenu(user, 'Linus');
    expect(menuItems()).toEqual(['Pin to top', 'Unpin', 'Highlight']);
    await user.click(screen.getByRole('menuitem', { name: 'Unpin' }));

    expect(section('bottom')).toBeNull();
    expect(onPinnedRowsChange).toHaveBeenLastCalledWith({ top: [], bottom: [] });
  });

  it('pins next to the scrolling rows, keeping rows pinned through initialState', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        initialState={{ pinnedRows: { top: [people[0]!], bottom: [people[2]!] } }}
      />,
    );

    await choose(user, 'Linus', 'Pin to bottom');

    const bottom = within(section('bottom')!).getAllByRole('row');
    expect(bottom.map((row) => row.textContent)).toEqual(['Linus', 'Grace']);
    expect(within(section('top')!).getByText('Ada')).toBeInTheDocument();
  });

  it('only reports changes when pinnedRows is controlled', async () => {
    const user = userEvent.setup();
    const onPinnedRowsChange = vi.fn();
    const pinnedRows = { top: [people[0]!] };
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        pinnedRows={pinnedRows}
        onPinnedRowsChange={onPinnedRowsChange}
      />,
    );

    await choose(user, 'Ada', 'Unpin');

    expect(onPinnedRowsChange).toHaveBeenCalledWith({ top: [], bottom: [] });
    expect(within(section('top')!).getByText('Ada')).toBeInTheDocument();
  });

  it('offers only highlighting on pinned rows that are not in rows', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        pinnedRows={{ bottom: [{ id: 'total', name: 'Total' }] }}
      />,
    );

    await openMenu(user, 'Total');

    expect(menuItems()).toEqual(['Highlight']);
  });

  it('highlights and un-highlights a row', async () => {
    const user = userEvent.setup();
    const onHighlightedRowIdsChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        onHighlightedRowIdsChange={onHighlightedRowIdsChange}
        getRowClassName={() => 'custom'}
      />,
    );

    await choose(user, 'Grace', 'Highlight');

    expect(rowOf('Grace')).toHaveClass(ROW_HIGHLIGHTED_CLASS, 'custom');
    expect(rowOf('Ada')).not.toHaveClass(ROW_HIGHLIGHTED_CLASS);
    expect(onHighlightedRowIdsChange).toHaveBeenLastCalledWith(new Set([3]));

    await choose(user, 'Grace', 'Remove highlight');

    expect(rowOf('Grace')).not.toHaveClass(ROW_HIGHLIGHTED_CLASS);
    expect(rowOf('Grace')).toHaveClass('custom');
    expect(onHighlightedRowIdsChange).toHaveBeenLastCalledWith(new Set());
  });

  it('keeps the highlight while a row is pinned', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        initialState={{ highlightedRowIds: new Set([2]) }}
      />,
    );

    expect(rowOf('Linus')).toHaveClass(ROW_HIGHLIGHTED_CLASS);

    await choose(user, 'Linus', 'Pin to top');

    expect(rowOf('Linus')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
    expect(section('top')).toContainElement(rowOf('Linus'));
  });

  it('supports controlled highlighted rows without the menu', () => {
    const { rerender } = render(
      <Mensula rows={people} columns={nameColumns} highlightedRowIds={new Set([1])} />,
    );

    expect(rowOf('Ada')).toHaveClass(ROW_HIGHLIGHTED_CLASS);

    rerender(<Mensula rows={people} columns={nameColumns} highlightedRowIds={new Set([2])} />);

    expect(rowOf('Ada')).not.toHaveClass(ROW_HIGHLIGHTED_CLASS);
    expect(rowOf('Linus')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
  });

  it('translates its labels through localeText', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        localeText={{ rowMenuHeaderLabel: 'Menu da linha', rowMenuHighlight: 'Destacar' }}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Menu da linha' })).toBeInTheDocument();
    await openMenu(user, 'Ada');
    expect(menuItems()).toContain('Destacar');
  });

  it('exposes pinning and highlighting to custom UI via useRowPinning and useRowHighlight', async () => {
    const user = userEvent.setup();
    const Controls = () => {
      const { pinRow, isRowPinned } = useRowPinning();
      const { toggleRowHighlight, highlightedRowIds } = useRowHighlight();
      return (
        <div>
          <button type="button" onClick={() => pinRow(3, 'top')}>
            pin
          </button>
          <button type="button" onClick={() => toggleRowHighlight(1)}>
            highlight
          </button>
          <span>{`pinned:${String(isRowPinned(3))} highlighted:${highlightedRowIds.size}`}</span>
        </div>
      );
    };
    render(
      <Mensula rows={people} columns={nameColumns} slots={{ toolbar: Controls }} showToolbar />,
    );

    await user.click(screen.getByRole('button', { name: 'pin' }));
    await user.click(screen.getByRole('button', { name: 'highlight' }));

    expect(screen.getByText('pinned:top highlighted:1')).toBeInTheDocument();
    expect(within(section('top')!).getByText('Grace')).toBeInTheDocument();
    expect(rowOf('Ada')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
  });
});

describe('Mensula shift-click highlight', () => {
  const people = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
    { id: 3, name: 'Grace' },
  ];
  const nameColumns = [{ field: 'name', headerName: 'Name' }];
  const rowOf = (name: string) => screen.getByText(name).closest('[role="row"]') as HTMLElement;
  const shiftClick = async (
    user: ReturnType<typeof userEvent.setup>,
    target: Element,
    keys = '{Shift>}',
  ) => {
    await user.keyboard(keys);
    await user.click(target);
    await user.keyboard('{/Shift}{/Control}');
  };

  it('toggles the highlight instead of selecting or firing onRowClick', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onHighlightedRowIdsChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        checkboxSelection
        onRowClick={onRowClick}
        onHighlightedRowIdsChange={onHighlightedRowIdsChange}
      />,
    );

    await user.click(screen.getByText('Ada'));
    expect(rowOf('Ada')).toHaveClass('Mui-selected');
    expect(onRowClick).toHaveBeenCalledTimes(1);

    await shiftClick(user, screen.getByText('Grace'));

    expect(rowOf('Grace')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
    expect(onHighlightedRowIdsChange).toHaveBeenLastCalledWith(new Set([3]));
    // No range selection from Ada to Grace.
    expect(rowOf('Linus')).not.toHaveClass('Mui-selected');
    expect(rowOf('Grace')).not.toHaveClass('Mui-selected');
    expect(onRowClick).toHaveBeenCalledTimes(1);

    await shiftClick(user, screen.getByText('Grace'));

    expect(rowOf('Grace')).not.toHaveClass(ROW_HIGHLIGHTED_CLASS);
  });

  it('ignores plain clicks and Shift combined with other modifiers', async () => {
    const user = userEvent.setup();
    render(<Mensula rows={people} columns={nameColumns} />);

    await user.click(screen.getByText('Ada'));
    await shiftClick(user, screen.getByText('Linus'), '{Control>}{Shift>}');

    expect(document.querySelector(`.${ROW_HIGHLIGHTED_CLASS}`)).toBeNull();
  });

  it('leaves the checkbox and row menu cells alone', async () => {
    const user = userEvent.setup();
    render(<Mensula rows={people} columns={nameColumns} checkboxSelection showRowMenu />);

    await shiftClick(user, within(rowOf('Ada')).getByRole('checkbox'));
    await shiftClick(user, within(rowOf('Linus')).getByRole('button', { name: 'more' }));

    expect(document.querySelector(`.${ROW_HIGHLIGHTED_CLASS}`)).toBeNull();
    expect(rowOf('Ada')).toHaveClass('Mui-selected');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('highlights pinned rows too', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        pinnedRows={{ top: [{ id: 'total', name: 'Total' }] }}
      />,
    );

    await shiftClick(user, screen.getByText('Total'));

    expect(rowOf('Total')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
  });

  it('gives Shift + click back to the grid with disableRowHighlightOnShiftClick', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        checkboxSelection
        disableRowHighlightOnShiftClick
      />,
    );

    await user.click(screen.getByText('Ada'));
    await shiftClick(user, screen.getByText('Grace'));

    expect(document.querySelector(`.${ROW_HIGHLIGHTED_CLASS}`)).toBeNull();
    expect(rowOf('Linus')).toHaveClass('Mui-selected');
    expect(rowOf('Grace')).toHaveClass('Mui-selected');
  });
});

describe('Mensula column reordering', () => {
  const people = [{ id: 1, name: 'Ada', role: 'Engineer', city: 'London' }];
  const peopleColumns = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'role', headerName: 'Role' },
    { field: 'city', headerName: 'City' },
  ];
  const headerFields = () =>
    screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-field'));
  const header = (name: string) => screen.getByRole('columnheader', { name });

  // jsdom has no layout: point `elementFromPoint` at the header the drag should be over.
  const dragHeader = (
    from: string,
    over: string[],
    direction: 1 | -1 = 1,
    beforeRelease?: () => void,
  ) => {
    const elementFromPoint = vi.fn();
    document.elementFromPoint = elementFromPoint;
    fireEvent.pointerDown(header(from), { button: 0, pointerId: 1, pointerType: 'mouse' });
    over.forEach((name, step) => {
      elementFromPoint.mockReturnValue(header(name));
      fireEvent.pointerMove(window, { pointerId: 1, clientX: direction * 20 * (step + 1) });
    });
    beforeRelease?.();
    fireEvent.pointerUp(window, { pointerId: 1 });
  };

  afterEach(() => {
    // @ts-expect-error -- jsdom does not implement it; tests install a mock.
    delete document.elementFromPoint;
  });

  it('moves a column by dragging its header, and fires onColumnOrderChange on drop', () => {
    const onColumnOrderChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={peopleColumns}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    dragHeader('ID', ['Name', 'Role']);

    expect(headerFields()).toEqual(['name', 'role', 'id', 'city']);
    expect(onColumnOrderChange).toHaveBeenCalledTimes(1);
    expect(onColumnOrderChange.mock.calls[0]![0]).toMatchObject({
      column: expect.objectContaining({ field: 'id' }),
      oldIndex: 0,
      targetIndex: 2,
    });
  });

  it('floats a copy of the header under a grabbing cursor while dragging', async () => {
    render(<Mensula rows={people} columns={peopleColumns} />);
    const preview = () => document.querySelector<HTMLElement>(`.${DRAG_PREVIEW_CLASS}`);
    const grabbing = () =>
      [...document.head.querySelectorAll('style')].some((style) =>
        style.textContent?.includes('cursor: grabbing'),
      );

    dragHeader('ID', ['Name'], 1, () => {
      expect(preview()).toHaveAttribute('aria-hidden', 'true');
      expect(preview()).toHaveTextContent('ID');
      expect(preview()!.style.transform).toBe('translate(20px, 0px)');
      expect(header('ID').style.opacity).toBe('0.4');
      expect(grabbing()).toBe(true);
    });

    expect(grabbing()).toBe(false);
    await waitFor(() => expect(preview()).not.toBeInTheDocument());
    expect(header('ID').style.opacity).toBe('');
    // The copy is not a second header.
    expect(screen.getAllByRole('columnheader')).toHaveLength(4);
  });

  it('only moves toward the direction the pointer travels', () => {
    render(<Mensula rows={people} columns={peopleColumns} />);

    // Still over Name, but moving left: no swap back.
    dragHeader('ID', ['Name']);
    expect(headerFields()).toEqual(['name', 'id', 'role', 'city']);
    dragHeader('ID', ['Role'], -1);
    expect(headerFields()).toEqual(['name', 'id', 'role', 'city']);
  });

  it('does not sort when a header drag ends on it', () => {
    render(<Mensula rows={people} columns={peopleColumns} />);

    const idHeader = header('ID');
    dragHeader('ID', ['Name']);
    fireEvent.click(idHeader);
    expect(idHeader).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(idHeader);
    expect(idHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('keeps columns within their pinned section', () => {
    const onPinnedColumnsChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={peopleColumns}
        initialState={{ pinnedColumns: { left: ['name', 'role'] } }}
        onPinnedColumnsChange={onPinnedColumnsChange}
      />,
    );
    expect(headerFields()).toEqual(['name', 'role', 'id', 'city']);

    dragHeader('ID', ['Role'], -1);
    expect(headerFields()).toEqual(['name', 'role', 'id', 'city']);

    dragHeader('Name', ['Role']);
    expect(headerFields()).toEqual(['role', 'name', 'id', 'city']);
    expect(onPinnedColumnsChange).toHaveBeenLastCalledWith({ left: ['role', 'name'] });
  });

  it('honors disableColumnReorder', () => {
    render(<Mensula rows={people} columns={peopleColumns} disableColumnReorder />);
    dragHeader('ID', ['Name']);
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('never drags a disableReorder column, and only displaces it toward a movable one', () => {
    const fixed = new Set(['id', 'name']);
    render(
      <Mensula
        rows={people}
        columns={peopleColumns.map((column) => ({
          ...column,
          disableReorder: fixed.has(column.field),
        }))}
      />,
    );

    dragHeader('Name', ['Role']);
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);

    // Beyond Name is ID, also fixed: City cannot get between them.
    dragHeader('City', ['Role', 'Name'], -1);
    expect(headerFields()).toEqual(['id', 'name', 'city', 'role']);
  });

  it('keeps the checkbox column first', () => {
    render(<Mensula rows={people} columns={peopleColumns} checkboxSelection />);

    dragHeader('ID', ['Select all rows'], -1);
    expect(headerFields()).toEqual(['__check__', 'id', 'name', 'role', 'city']);
  });

  it('keeps the order across new columns arrays and pinning changes', () => {
    const { rerender } = render(<Mensula rows={people} columns={peopleColumns} />);
    dragHeader('City', ['Role', 'Name'], -1);
    expect(headerFields()).toEqual(['id', 'city', 'name', 'role']);

    rerender(<Mensula rows={people} columns={[...peopleColumns]} />);
    expect(headerFields()).toEqual(['id', 'city', 'name', 'role']);

    rerender(
      <Mensula rows={people} columns={[...peopleColumns]} pinnedColumns={{ left: ['name'] }} />,
    );
    expect(headerFields()).toEqual(['name', 'id', 'city', 'role']);

    rerender(<Mensula rows={people} columns={[...peopleColumns]} pinnedColumns={{}} />);
    expect(headerFields()).toEqual(['id', 'city', 'name', 'role']);
  });

  it('starts from initialState.columns.orderedFields', () => {
    render(
      <Mensula
        rows={people}
        columns={peopleColumns}
        initialState={{ columns: { orderedFields: ['role', 'id', 'name', 'city'] } }}
      />,
    );

    expect(headerFields()).toEqual(['role', 'id', 'name', 'city']);
  });

  it('exposes reordering to custom UI via useColumnReorder', async () => {
    const user = userEvent.setup();
    const onColumnOrderChange = vi.fn();
    const MoveButton = () => {
      const { moveColumn, hasColumnOrderChanged, resetColumnOrder } = useColumnReorder();
      return hasColumnOrderChanged ? (
        <button onClick={resetColumnOrder}>Reset order</button>
      ) : (
        <button onClick={() => moveColumn('city', 'id')}>City first</button>
      );
    };
    render(
      <Mensula
        rows={people}
        columns={peopleColumns.map((column) =>
          column.field === 'role' ? { ...column, renderHeader: () => <MoveButton /> } : column,
        )}
        onColumnOrderChange={onColumnOrderChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'City first' }));

    expect(headerFields()).toEqual(['city', 'id', 'name', 'role']);
    expect(onColumnOrderChange.mock.calls[0]![0]).toMatchObject({ oldIndex: 3, targetIndex: 0 });

    await user.click(screen.getByRole('button', { name: 'Reset order' }));
    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  // A press on `target`, one move over `over`, then a release.
  const pressAndDrag = (target: HTMLElement, over: HTMLElement, init: PointerEventInit = {}) => {
    document.elementFromPoint = vi.fn(() => over);
    fireEvent.pointerDown(target, { button: 0, pointerId: 1, pointerType: 'mouse', ...init });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 20 });
    fireEvent.pointerUp(window, { pointerId: 1 });
  };

  it('keeps a press without movement a click, so headers still sort', () => {
    render(<Mensula rows={people} columns={peopleColumns} />);
    const idHeader = header('ID');

    fireEvent.pointerDown(idHeader, { button: 0, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerUp(window, { pointerId: 1 });
    fireEvent.click(idHeader);

    expect(idHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('ignores touch, secondary buttons, and presses on header controls', () => {
    render(<Mensula rows={people} columns={peopleColumns} />);

    pressAndDrag(header('ID'), header('Name'), { pointerType: 'touch' });
    pressAndDrag(header('ID'), header('Name'), { button: 2 });
    pressAndDrag(within(header('ID')).getByLabelText('ID column menu'), header('Name'));
    pressAndDrag(
      header('ID').querySelector<HTMLElement>('.MuiDataGrid-columnSeparator')!,
      header('Name'),
    );

    expect(headerFields()).toEqual(['id', 'name', 'role', 'city']);
  });

  it('leaves the headers of a grid nested in a detail panel to that grid', () => {
    const onColumnOrderChange = vi.fn();
    // Same fields as the outer grid, so a mix-up would move the outer columns too.
    const innerColumns = [
      { field: 'id', headerName: 'Inner ID' },
      { field: 'name', headerName: 'Inner name' },
    ];
    render(
      <Mensula
        rows={people}
        columns={peopleColumns}
        onColumnOrderChange={onColumnOrderChange}
        getDetailPanelContent={() => <Mensula rows={people} columns={innerColumns} />}
        initialState={{ detailPanel: { expandedRowIds: new Set([1]) } }}
      />,
    );

    pressAndDrag(header('Inner ID'), header('Inner name'));

    expect(headerFields()).toEqual([
      '__detail_panel_toggle__',
      'id',
      'name',
      'role',
      'city',
      'name',
      'id',
    ]);
    expect(onColumnOrderChange).not.toHaveBeenCalled();
  });

  it('cleans up the copy and the cursor when unmounted mid-drag', () => {
    const { unmount } = render(<Mensula rows={people} columns={peopleColumns} />);
    document.elementFromPoint = vi.fn(() => header('Name'));
    fireEvent.pointerDown(header('ID'), { button: 0, pointerId: 1, pointerType: 'mouse' });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 20 });
    expect(document.querySelector(`.${DRAG_PREVIEW_CLASS}`)).toBeInTheDocument();

    unmount();

    expect(document.querySelector(`.${DRAG_PREVIEW_CLASS}`)).not.toBeInTheDocument();
    expect(document.head.innerHTML).not.toContain('cursor: grabbing');
  });

  it('slots newly declared columns in after their declared neighbor', () => {
    const { rerender } = render(<Mensula rows={people} columns={peopleColumns} />);
    dragHeader('City', ['Role', 'Name', 'ID'], -1);
    expect(headerFields()).toEqual(['city', 'id', 'name', 'role']);

    const country = { field: 'country', headerName: 'Country' };
    const withCountry = [...peopleColumns.slice(0, 3), country, peopleColumns[3]!];
    rerender(<Mensula rows={people} columns={withCountry} />);
    expect(headerFields()).toEqual(['city', 'id', 'name', 'role', 'country']);

    const withCode = [{ field: 'code', headerName: 'Code' }, ...withCountry];
    rerender(<Mensula rows={people} columns={withCode} />);
    expect(headerFields()).toEqual(['code', 'city', 'id', 'name', 'role', 'country']);

    rerender(
      <Mensula rows={people} columns={withCode.filter(({ field }) => field !== 'name')} />,
    );
    expect(headerFields()).toEqual(['code', 'city', 'id', 'role', 'country']);
  });

  it('reorders controlled pinned columns through onPinnedColumnsChange', () => {
    const onPinnedColumnsChange = vi.fn();
    const { rerender } = render(
      <Mensula
        rows={people}
        columns={peopleColumns}
        pinnedColumns={{ left: ['name', 'role'] }}
        onPinnedColumnsChange={onPinnedColumnsChange}
      />,
    );

    dragHeader('Name', ['Role']);

    expect(onPinnedColumnsChange).toHaveBeenLastCalledWith({ left: ['role', 'name'] });
    // Still controlled: nothing moves until the parent passes the new model.
    expect(headerFields()).toEqual(['name', 'role', 'id', 'city']);

    rerender(
      <Mensula
        rows={people}
        columns={peopleColumns}
        pinnedColumns={onPinnedColumnsChange.mock.lastCall![0]}
        onPinnedColumnsChange={onPinnedColumnsChange}
      />,
    );
    expect(headerFields()).toEqual(['role', 'name', 'id', 'city']);
  });
});

describe('Mensula context menu', () => {
  const people = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
    { id: 3, name: 'Grace' },
  ];
  const nameColumns = [{ field: 'name', headerName: 'Name' }];
  const cellOf = (name: string) => screen.getByText(name);
  const headerOf = (name: string) => screen.getByRole('columnheader', { name });
  const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent);
  // `fireEvent` returns false when a listener called `preventDefault()`.
  const rightClick = (element: Element) =>
    fireEvent.contextMenu(element, { clientX: 40, clientY: 60 });

  it('opens the row menu on a right-clicked row, without the menu column', async () => {
    const user = userEvent.setup();
    const onPinnedRowsChange = vi.fn();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        pinnedRows={{}}
        onPinnedRowsChange={onPinnedRowsChange}
      />,
    );

    expect(rightClick(cellOf('Linus'))).toBe(false);
    expect(menuItems()).toEqual(['Pin to top', 'Pin to bottom', 'Highlight']);

    await user.click(screen.getByRole('menuitem', { name: 'Pin to top' }));

    expect(onPinnedRowsChange).toHaveBeenLastCalledWith({ top: [people[1]], bottom: [] });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('opens it on pinned rows and alongside the menu column, translated', async () => {
    const user = userEvent.setup();
    render(
      <Mensula
        rows={people}
        columns={nameColumns}
        showRowMenu
        pinnedRows={{ bottom: [{ id: 'total', name: 'Total' }] }}
        localeText={{ rowMenuHighlight: 'Destacar' }}
      />,
    );

    rightClick(cellOf('Total'));
    expect(menuItems()).toEqual(['Destacar']);

    await user.click(screen.getByRole('menuitem', { name: 'Destacar' }));

    expect(cellOf('Total').closest('[role="row"]')).toHaveClass(ROW_HIGHLIGHTED_CLASS);
  });

  it('opens the column menu on a right-clicked header', async () => {
    render(<Mensula rows={people} columns={nameColumns} />);

    expect(rightClick(headerOf('Name'))).toBe(false);

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(menuItems()).toEqual(expect.arrayContaining(['Pin to left', 'Hide column']));
  });

  it('keeps the browser menu on headers without a column menu and in text fields', () => {
    render(
      <Mensula
        rows={people}
        columns={[
          { ...nameColumns[0]!, disableColumnMenu: true },
          {
            field: 'note',
            headerName: 'Note',
            renderCell: () => <input aria-label="note" />,
          },
        ]}
      />,
    );

    expect(rightClick(headerOf('Name'))).toBe(true);
    expect(rightClick(screen.getAllByRole('textbox', { name: 'note' })[0]!)).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('hides the menu button with hideColumnMenu, keeping the menu a right-click away', async () => {
    render(<Mensula rows={people} columns={nameColumns} hideColumnMenu />);

    const icon = headerOf('Name').querySelector('.MuiDataGrid-menuIcon');
    expect(icon).toHaveStyle({ visibility: 'hidden' });

    rightClick(headerOf('Name'));

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(icon).toHaveStyle({ visibility: 'hidden' });
  });

  it('keeps the browser menu everywhere with disableContextMenu', () => {
    render(<Mensula rows={people} columns={nameColumns} showRowMenu disableContextMenu />);

    expect(rightClick(cellOf('Ada'))).toBe(true);
    expect(rightClick(headerOf('Name'))).toBe(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('Mensula hooks outside a Mensula', () => {
  it.each([
    ['useColumnPinning', useColumnPinning],
    ['useColumnReorder', useColumnReorder],
    ['useDetailPanel', useDetailPanel],
    ['useRowPinning', useRowPinning],
    ['useRowHighlight', useRowHighlight],
  ])('%s throws a helpful error', (_name, hook) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => hook())).toThrow(/must be used inside a Mensula/);
  });
});
