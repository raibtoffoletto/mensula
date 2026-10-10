import Mensula from '@components/mensula';
import { GridLogicOperator, type GridApi, type GridFilterModel } from '@mui/x-data-grid';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const columns = [
  { field: 'name', headerName: 'Name', width: 120 },
  { field: 'role', headerName: 'Role', width: 120 },
  { field: 'age', headerName: 'Age', type: 'number' as const, width: 90 },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer', age: 36 },
  { id: 2, name: 'Linus', role: 'Engineer', age: 54 },
  { id: 3, name: 'Grace', role: 'Admiral', age: 85 },
  { id: 4, name: 'Alan', role: 'Researcher', age: 41 },
];

const engineers = { id: 1, field: 'role', operator: 'equals', value: 'Engineer' };
const over50 = { id: 2, field: 'age', operator: '>', value: 50 };

const visibleNames = () =>
  screen
    .queryAllByRole('gridcell')
    .filter((cell) => cell.dataset.field === 'name')
    .map((cell) => cell.textContent);

const header = (name: string) => screen.getByRole('columnheader', { name: new RegExp(name) });

let gridApi: RefObject<GridApi | null> = { current: null };
const renderWithApiRef = (initialState?: { filter: { filterModel: GridFilterModel } }) => {
  gridApi = { current: null };
  return render(
    <Mensula apiRef={gridApi} rows={rows} columns={columns} initialState={initialState} />,
  );
};
const api = () => gridApi.current!;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MultiFilterSync', () => {
  it('applies every item of the initial model, combined with AND', () => {
    const error = vi.spyOn(console, 'error');
    render(
      <Mensula
        rows={rows}
        columns={columns}
        initialState={{ filter: { filterModel: { items: [engineers, over50] } } }}
      />,
    );

    expect(visibleNames()).toEqual(['Linus']);
    expect(error).not.toHaveBeenCalled();
  });

  it('combines items with OR', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        initialState={{
          filter: {
            filterModel: { items: [engineers, over50], logicOperator: GridLogicOperator.Or },
          },
        }}
      />,
    );

    expect(visibleNames()).toEqual(['Ada', 'Linus', 'Grace']);
  });

  it('ignores unfinished items under OR', () => {
    const unfinished = { id: 3, field: 'name', operator: 'contains' };
    render(
      <Mensula
        rows={rows}
        columns={columns}
        filterModel={{ items: [engineers, unfinished], logicOperator: GridLogicOperator.Or }}
      />,
    );

    expect(visibleNames()).toEqual(['Ada', 'Linus']);
  });

  it('applies the quick filter on top of the items', () => {
    render(
      <Mensula
        rows={rows}
        columns={columns}
        filterModel={{
          items: [engineers, over50],
          logicOperator: GridLogicOperator.Or,
          quickFilterValues: ['a'],
        }}
      />,
    );

    // Linus has no "a" in any cell.
    expect(visibleNames()).toEqual(['Ada', 'Grace']);
  });

  it('follows a controlled model without reporting the initial hand-over', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Mensula
        rows={rows}
        columns={columns}
        filterModel={{ items: [engineers, over50] }}
        onFilterModelChange={onChange}
      />,
    );
    expect(visibleNames()).toEqual(['Linus']);

    rerender(
      <Mensula
        rows={rows}
        columns={columns}
        filterModel={{ items: [over50] }}
        onFilterModelChange={onChange}
      />,
    );
    expect(visibleNames()).toEqual(['Linus', 'Grace']);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps every item set through the API', () => {
    renderWithApiRef();

    act(() => api().upsertFilterItem(engineers));
    act(() => api().upsertFilterItem(over50));

    expect(api().state.filter.filterModel.items).toEqual([engineers, over50]);
    expect(visibleNames()).toEqual(['Linus']);

    act(() => api().deleteFilterItem(engineers));
    expect(visibleNames()).toEqual(['Linus', 'Grace']);
  });

  it('gives ids to items without one', () => {
    renderWithApiRef();

    act(() =>
      api().setFilterModel({
        items: [
          { field: 'role', operator: 'equals', value: 'Engineer' },
          { field: 'age', operator: '>', value: 50 },
        ],
      }),
    );

    const ids = api().state.filter.filterModel.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(2);
    expect(ids).not.toContain(undefined);
    expect(visibleNames()).toEqual(['Linus']);
  });

  it('restores a state with several filters', () => {
    renderWithApiRef();

    act(() => api().restoreState({ filter: { filterModel: { items: [engineers, over50] } } }));

    expect(api().state.filter.filterModel.items).toHaveLength(2);
    expect(visibleNames()).toEqual(['Linus']);
  });

  it('adds a filter from the column menu, keeping the others', async () => {
    const user = userEvent.setup();
    renderWithApiRef({ filter: { filterModel: { items: [engineers] } } });

    await user.click(within(header('Age')).getByLabelText('Age column menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Filter' }));

    const items = api().state.filter.filterModel.items;
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual(engineers);
    expect(items[1]).toMatchObject({ field: 'age' });
  });

  it('keeps the single-filter behavior with disableMultipleColumnsFiltering', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Mensula
        rows={rows}
        columns={columns}
        disableMultipleColumnsFiltering
        initialState={{ filter: { filterModel: { items: [engineers, over50] } } }}
      />,
    );

    expect(visibleNames()).toEqual(['Ada', 'Linus']);
  });
});
