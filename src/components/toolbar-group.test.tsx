import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarGroup from '@components/toolbar-group';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const columns = [{ field: 'name', headerName: 'Name', width: 120 }];
const rows = [{ id: 1, name: 'Ada' }];

describe('ToolbarGroup', () => {
  it('renders its children in the toolbar', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        showToolbar
        slots={{
          toolbar: () => (
            <Toolbar>
              <ToolbarGroup>
                <button type="button">Refresh</button>
              </ToolbarGroup>
            </Toolbar>
          ),
        }}
      />,
    );

    expect(
      within(screen.getByRole('toolbar')).getByRole('button', { name: 'Refresh' }),
    ).toBeInTheDocument();
  });
});
