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
