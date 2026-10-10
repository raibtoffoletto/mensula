import Mensula from '@components/mensula';
import Toolbar from '@components/toolbar';
import ToolbarLabel from '@components/toolbar-label';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

const columns = [{ field: 'name', headerName: 'Name', width: 120 }];
const rows = [{ id: 1, name: 'Ada' }];

const renderLabel = (children?: ReactNode) =>
  render(
    <Mensula
      rows={rows}
      columns={columns}
      showToolbar
      label="Pioneers"
      slots={{
        toolbar: () => (
          <Toolbar>
            <ToolbarLabel>{children}</ToolbarLabel>
          </Toolbar>
        ),
      }}
    />,
  );

describe('ToolbarLabel', () => {
  it("shows the grid's label", () => {
    renderLabel();

    expect(screen.getByText('Pioneers')).toHaveClass('MuiDataGrid-toolbarLabel');
  });

  it('shows its children in place of the label', () => {
    renderLabel('Team');

    expect(screen.getByText('Team')).toHaveClass('MuiDataGrid-toolbarLabel');
    expect(screen.queryByText('Pioneers')).not.toBeInTheDocument();
  });
});
