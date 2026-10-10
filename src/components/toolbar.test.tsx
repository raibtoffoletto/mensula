import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarExportCsv from '@components/toolbar-export-csv';
import ToolbarSearch from '@components/toolbar-search';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const columns = [
  { field: 'name', headerName: 'Name', width: 120 },
  { field: 'role', headerName: 'Role', width: 120 },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
];

describe('Toolbar', () => {
  it('shows the label and the controls', () => {
    render(<Mensula rows={rows} columns={columns} showToolbar label="Pioneers" />);

    expect(screen.getByText('Pioneers')).toHaveClass('MuiDataGrid-toolbarLabel');
    expect(screen.getByRole('toolbar', { name: 'Pioneers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Columns' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('drops the controls the grid disables', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        disableColumnSelector
        disableColumnFilter
        slotProps={{
          toolbar: {
            showQuickFilter: false,
            csvOptions: { disableToolbarButton: true },
          },
        }}
      />,
    );

    expect(within(screen.getByRole('toolbar')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('yields to a consumer toolbar slot', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        slots={{ toolbar: () => <div>custom</div> }}
      />,
    );

    expect(screen.getByText('custom')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Columns' })).not.toBeInTheDocument();
  });

  it('renders a custom composition inside the same frame', () => {
    const CustomToolbar = () => (
      <Toolbar>
        <ToolbarExportCsv />
        <ToolbarSearch />
      </Toolbar>
    );
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        label="Pioneers"
        slots={{ toolbar: CustomToolbar }}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Pioneers' });
    expect(within(toolbar).getByRole('searchbox')).toBeInTheDocument();
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Export']);
    // Only what was composed: no label, filters or columns.
    expect(screen.queryByText('Pioneers')).not.toBeInTheDocument();
  });

  it('passes styling props from the slot props to the toolbar root', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        slotProps={{
          toolbar: { className: 'mine', style: { minHeight: 64 }, sx: { justifyContent: 'start' } },
        }}
      />,
    );

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toHaveClass('mine', 'MuiDataGrid-toolbar');
    expect(toolbar).toHaveStyle({ minHeight: '64px', justifyContent: 'start' });
    // The default layout is untouched.
    expect(within(toolbar).getByRole('button', { name: 'Columns' })).toBeInTheDocument();
  });

  it('passes styling props on a custom composition to the toolbar root', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        slots={{
          toolbar: () => (
            <Toolbar sx={[{ justifyContent: 'end' }, (theme) => ({ gap: theme.spacing(3) })]}>
              <ToolbarSearch />
            </Toolbar>
          ),
        }}
      />,
    );

    expect(screen.getByRole('toolbar')).toHaveStyle({ justifyContent: 'end', gap: '24px' });
  });
});
