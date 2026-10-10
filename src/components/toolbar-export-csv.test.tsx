import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarExportCsv, { type ToolbarExportCsvProps } from '@components/toolbar-export-csv';
import { render, screen } from '@testing-library/react';
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

const renderExport = (props: ToolbarExportCsvProps = {}) =>
  render(
    <Mensula
      rows={rows}
      columns={columns}
      showToolbar
      slots={{
        toolbar: () => (
          <Toolbar>
            <ToolbarExportCsv {...props} />
          </Toolbar>
        ),
      }}
    />,
  );

const mockObjectUrls = () => {
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv');
  // jsdom has no object URLs; the grid's download helper needs them.
  Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
  return createObjectURL;
};

describe('ToolbarExportCsv', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads a CSV straight from the export button', async () => {
    const createObjectURL = mockObjectUrls();
    const user = userEvent.setup();
    renderExport();

    await user.click(screen.getByRole('button', { name: 'Export' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledOnce();
    const csv = await createObjectURL.mock.calls[0]![0].text();
    expect(csv).toContain('Grace');
  });

  it('exports with its options', async () => {
    const createObjectURL = mockObjectUrls();
    const user = userEvent.setup();
    renderExport({ options: { fields: ['name'] } });

    await user.click(screen.getByRole('button', { name: 'Export' }));

    const csv = await createObjectURL.mock.calls[0]![0].text();
    expect(csv).toContain('Grace');
    expect(csv).not.toContain('Admiral');
  });

  it('hides when the options disable the toolbar button', () => {
    renderExport({ options: { disableToolbarButton: true } });

    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });

  it('turns into an icon button with a tooltip below md', async () => {
    mockNarrowViewport();
    const createObjectURL = mockObjectUrls();
    const user = userEvent.setup();
    renderExport();

    const button = screen.getByRole('button', { name: 'Export' });
    expect(button).not.toHaveTextContent('Export');
    await user.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Export');

    await user.click(button);
    expect(createObjectURL).toHaveBeenCalledOnce();
  });
});
