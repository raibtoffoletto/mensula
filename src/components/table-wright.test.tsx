import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TableWright from './table-wright';

describe('TableWright', () => {
  it('renders rows and column headers', () => {
    const columns = [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'name', headerName: 'Name', width: 150 },
    ];
    const rows = [
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Linus' },
    ];

    render(<TableWright rows={rows} columns={columns} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Linus')).toBeInTheDocument();
  });
});
