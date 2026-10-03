import useColumnOrderContext from '@hooks/use-column-order-context';
import { closestAtPoint, isMovingToward, trackPointerDrag } from '@lib/pointer-drag';
import { inputBaseClasses } from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';
import { debounce } from '@mui/material/utils';
import {
  GridShadowScrollArea,
  gridClasses,
  gridColumnDefinitionsSelector,
  gridColumnFieldsSelector,
  gridColumnVisibilityModelSelector,
  useGridApiContext,
  useGridRootProps,
  useGridSelector,
  type ColumnsManagementPropsOverrides,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridColumnsManagementProps,
} from '@mui/x-data-grid';
// Only the grid's CSS-variable names, so the panel looks exactly like the one it replaces.
import { vars } from '@mui/x-data-grid/internals';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

declare module '@mui/x-data-grid' {
  interface ColumnsManagementPropsOverrides {
    /** Accessible name of a column's drag handle. @default (name) => `Reorder ${name}` */
    getReorderHandleLabel?: (columnName: string) => string;
  }
}

export type ColumnsManagementProps = GridColumnsManagementProps & ColumnsManagementPropsOverrides;

const ROW_SELECTOR = '[data-field]';

const collator = new Intl.Collator();

const defaultSearchPredicate = (column: GridColDef, searchValue: string) =>
  (column.headerName || column.field).toLowerCase().includes(searchValue);

const defaultReorderHandleLabel = (columnName: string) => `Reorder ${columnName}`;

// `true` and a missing key both mean visible.
const hiddenFields = (model: GridColumnVisibilityModel) =>
  Object.keys(model)
    .filter((field) => model[field] === false)
    .sort();

const sameVisibility = (a: GridColumnVisibilityModel, b: GridColumnVisibilityModel) =>
  hiddenFields(a).join('\n') === hiddenFields(b).join('\n');

const scrollParent = (element: HTMLElement | null) => {
  let current = element?.parentElement ?? null;
  while (current && !/(auto|scroll)/.test(getComputedStyle(current).overflowY)) {
    current = current.parentElement;
  }
  return current;
};

// Same slots and styles as the community `GridColumnsManagement`, so theme overrides still apply.
const Header = styled('div', { name: 'MuiDataGrid', slot: 'ColumnsManagementHeader' })({
  padding: vars.spacing(1.5, 2),
  borderBottom: `1px solid ${vars.colors.border.base}`,
});

const SearchInput = styled('div', { name: 'MuiDataGrid', slot: 'ColumnsManagementSearchInput' })({
  [`& .${inputBaseClasses.input}::-webkit-search-decoration,
    & .${inputBaseClasses.input}::-webkit-search-cancel-button,
    & .${inputBaseClasses.input}::-webkit-search-results-button,
    & .${inputBaseClasses.input}::-webkit-search-results-decoration`]: { display: 'none' },
});

const ScrollArea = styled(GridShadowScrollArea, {
  name: 'MuiDataGrid',
  slot: 'ColumnsManagementScrollArea',
})({ maxHeight: 300 });

const Body = styled('div', { name: 'MuiDataGrid', slot: 'ColumnsManagement' })({
  display: 'flex',
  flexDirection: 'column',
  padding: vars.spacing(0.5, 1.5),
  '&[data-handles]': { paddingLeft: vars.spacing(0.5) },
});

const Row = styled('div')({
  display: 'flex',
  alignItems: 'center',
  borderRadius: vars.radius.base,
  '&[data-dragging]': { backgroundColor: vars.colors.interactive.hover },
});

const Handle = styled('span')({
  display: 'inline-flex',
  flexShrink: 0,
  color: vars.colors.foreground.muted,
  touchAction: 'none',
  '& > *': { cursor: 'grab' },
  '&[data-hidden]': { visibility: 'hidden' },
});

const Footer = styled('div', { name: 'MuiDataGrid', slot: 'ColumnsManagementFooter' })({
  padding: vars.spacing(1, 1, 1, 1.5),
  display: 'flex',
  justifyContent: 'space-between',
  borderTop: `1px solid ${vars.colors.border.base}`,
});

const EmptyText = styled('div', { name: 'MuiDataGrid', slot: 'ColumnsManagementEmptyText' })({
  padding: vars.spacing(1, 0),
  alignSelf: 'center',
  font: vars.typography.font.body,
});

/**
 * Default `columnsManagement` slot: the community columns panel (search, visibility checkboxes,
 * show/hide all, reset) plus a drag handle per column. Drag a handle, or focus it and press
 * ArrowUp/ArrowDown, to move the column within its pinned section. Handles are hidden with
 * `disableColumnReorder` or a `sort`, and for columns with `disableReorder`. Reset also restores
 * the column order.
 */
const ColumnsManagement = ({
  sort,
  searchPredicate = defaultSearchPredicate,
  autoFocusSearchField = true,
  disableShowHideToggle = false,
  disableResetButton = false,
  toggleAllMode = 'all',
  getTogglableColumns,
  searchInputProps,
  searchDebounceMs,
  getReorderHandleLabel = defaultReorderHandleLabel,
}: ColumnsManagementProps) => {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const { slots, slotProps, localeText } = rootProps;
  const order = useColumnOrderContext();
  // Pointer and key handlers read the latest order API, which changes as columns move.
  const orderRef = useRef(order);
  useLayoutEffect(() => {
    orderRef.current = order;
  });

  const columns = useGridSelector(apiRef, gridColumnDefinitionsSelector);
  const visibilityModel = useGridSelector(apiRef, gridColumnVisibilityModelSelector);
  const initialVisibilityModel = useGridSelector(
    apiRef,
    () => apiRef.current.state.columns.initialColumnVisibilityModel,
  );
  const [searchValue, setSearchValue] = useState('');
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const handleRefs = useRef(new Map<string, HTMLElement>());
  const refocusFieldRef = useRef<string | null>(null);
  const stopDragRef = useRef<(() => void) | undefined>(undefined);

  const debouncedSearch = useMemo(
    () => debounce(setSearchValue, searchDebounceMs ?? rootProps.columnFilterDebounceMs ?? 150),
    [searchDebounceMs, rootProps.columnFilterDebounceMs],
  );
  useEffect(() => () => debouncedSearch.clear(), [debouncedSearch]);

  const sortedColumns = useMemo(() => {
    if (!sort) {
      return columns;
    }
    const direction = sort === 'asc' ? 1 : -1;
    return [...columns].sort(
      (a, b) => direction * collator.compare(a.headerName || a.field, b.headerName || b.field),
    );
  }, [columns, sort]);

  const currentColumns = useMemo(() => {
    const togglable = getTogglableColumns?.(sortedColumns);
    const shown = togglable
      ? sortedColumns.filter(({ field }) => togglable.includes(field))
      : sortedColumns;
    return searchValue
      ? shown.filter((column) => searchPredicate(column, searchValue.toLowerCase()))
      : shown;
  }, [sortedColumns, searchValue, searchPredicate, getTogglableColumns]);

  const hideableColumns = currentColumns.filter((column) => column.hideable);
  const allHideableVisible = hideableColumns.every(
    (column) => visibilityModel[column.field] !== false,
  );
  const allHideableHidden = hideableColumns.every(
    (column) => visibilityModel[column.field] === false,
  );
  // A sorted list does not show the column order, so it cannot reorder it.
  const showHandles = !order.disableColumnReorder && !sort;
  const isResetDisabled =
    sameVisibility(visibilityModel, initialVisibilityModel) && !order.hasColumnOrderChanged;

  useEffect(() => {
    if (autoFocusSearchField) {
      searchInputRef.current?.focus();
    } else {
      firstCheckboxRef.current?.focus();
    }
  }, [autoFocusSearchField]);

  // Moving a row re-inserts its DOM node, which drops focus from the handle that moved it.
  useLayoutEffect(() => {
    const field = refocusFieldRef.current;
    refocusFieldRef.current = null;
    if (field) {
      handleRefs.current.get(field)?.focus();
    }
  });

  useEffect(() => () => stopDragRef.current?.(), []);

  const toggleColumn = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name;
    apiRef.current.setColumnVisibility(field, visibilityModel[field] === false);
  };

  const toggleAllColumns = (isVisible: boolean) => {
    const togglable = getTogglableColumns?.(columns);
    const model = { ...visibilityModel };
    (toggleAllMode === 'filteredOnly' ? currentColumns : columns).forEach((column) => {
      if (column.hideable && (!togglable || togglable.includes(column.field))) {
        if (isVisible) {
          delete model[column.field];
        } else {
          model[column.field] = false;
        }
      }
    });
    apiRef.current.setColumnVisibilityModel(model);
  };

  const reset = () => {
    apiRef.current.setColumnVisibilityModel(initialVisibilityModel);
    order.resetColumnOrder();
  };

  const resetSearch = () => {
    debouncedSearch.clear();
    setSearchValue('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      searchInputRef.current.focus();
    }
  };

  const onHandleKeyDown = (field: string) => (event: KeyboardEvent) => {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key] as -1 | 1 | undefined;
    if (!step) {
      return;
    }
    event.preventDefault();
    // `moveColumn` applies the same rules as a drag (pinned sections, fixed columns).
    const target =
      currentColumns[currentColumns.findIndex((column) => column.field === field) + step]?.field;
    if (target && orderRef.current.moveColumn(field, target)) {
      refocusFieldRef.current = field;
    }
  };

  const onHandlePointerDown = (field: string) => (event: PointerEvent) => {
    if (event.button !== 0) {
      return;
    }
    const oldIndex = gridColumnFieldsSelector(apiRef).indexOf(field);
    const body = bodyRef.current;
    const row = event.currentTarget.closest<HTMLElement>(ROW_SELECTOR);
    const panel = row?.closest<HTMLElement>(`.${gridClasses.panel}`);
    stopDragRef.current?.();
    stopDragRef.current = trackPointerDrag(event.nativeEvent, {
      axis: 'y',
      scrollContainer: scrollParent(body),
      preview: row && panel ? { element: row, container: panel } : undefined,
      onStart: () => setDraggingField(field),
      onMove: (point, direction) => {
        const over = closestAtPoint(point, ROW_SELECTOR, (row) => row.parentElement === body)
          ?.dataset.field;
        const fields = gridColumnFieldsSelector(apiRef);
        if (
          over &&
          over !== field &&
          isMovingToward(fields.indexOf(field), fields.indexOf(over), direction)
        ) {
          orderRef.current.moveColumnSilently(field, over);
        }
      },
      onEnd: () => {
        stopDragRef.current = undefined;
        setDraggingField(null);
        orderRef.current.notifyColumnOrderChange(field, oldIndex);
      },
    });
  };

  const setHandleRef = (field: string) => (element: HTMLElement | null) => {
    if (element) {
      handleRefs.current.set(field, element);
    } else {
      handleRefs.current.delete(field);
    }
  };

  const firstHideableField = currentColumns.find((column) => column.hideable !== false)?.field;

  return (
    <>
      <Header className={gridClasses.columnsManagementHeader}>
        <SearchInput
          as={slots.baseTextField}
          placeholder={localeText.columnsManagementSearchTitle}
          inputRef={searchInputRef}
          className={gridClasses.columnsManagementSearchInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) => debouncedSearch(event.target.value)}
          size="small"
          type="search"
          slotProps={{
            input: {
              startAdornment: <slots.quickFilterIcon fontSize="small" />,
              endAdornment: (
                <slots.baseIconButton
                  size="small"
                  aria-label={localeText.columnsManagementDeleteIconLabel}
                  style={{ visibility: searchValue ? 'visible' : 'hidden' }}
                  tabIndex={-1}
                  onClick={resetSearch}
                  edge="end"
                  {...slotProps?.baseIconButton}
                >
                  <slots.quickFilterClearIcon fontSize="small" />
                </slots.baseIconButton>
              ),
            },
            htmlInput: { 'aria-label': localeText.columnsManagementSearchTitle },
          }}
          autoComplete="off"
          fullWidth
          {...slotProps?.baseTextField}
          {...searchInputProps}
        />
      </Header>
      <ScrollArea>
        <Body
          ref={bodyRef}
          className={gridClasses.columnsManagement}
          data-handles={showHandles || undefined}
        >
          {currentColumns.map((column) => {
            const name = column.headerName || column.field;
            const reorderable = order.isColumnReorderable(column.field);
            return (
              <Row
                key={column.field}
                data-field={column.field}
                data-dragging={draggingField === column.field || undefined}
              >
                {showHandles && (
                  <Handle data-hidden={!reorderable || undefined}>
                    <slots.baseIconButton
                      ref={setHandleRef(column.field)}
                      size="small"
                      aria-label={getReorderHandleLabel(name)}
                      disabled={!reorderable}
                      onPointerDown={onHandlePointerDown(column.field)}
                      onKeyDown={onHandleKeyDown(column.field)}
                      {...slotProps?.baseIconButton}
                    >
                      <slots.columnReorderIcon fontSize="small" />
                    </slots.baseIconButton>
                  </Handle>
                )}
                <slots.baseCheckbox
                  className={gridClasses.columnsManagementRow}
                  disabled={column.hideable === false}
                  checked={visibilityModel[column.field] !== false}
                  onChange={toggleColumn}
                  name={column.field}
                  inputRef={column.field === firstHideableField ? firstCheckboxRef : undefined}
                  label={name}
                  density="compact"
                  fullWidth
                  {...slotProps?.baseCheckbox}
                />
              </Row>
            );
          })}
          {currentColumns.length === 0 && (
            <EmptyText>{localeText.columnsManagementNoColumns}</EmptyText>
          )}
        </Body>
      </ScrollArea>
      {(!disableShowHideToggle || !disableResetButton) && (
        <Footer className={gridClasses.columnsManagementFooter}>
          {disableShowHideToggle ? (
            <span />
          ) : (
            <slots.baseCheckbox
              disabled={hideableColumns.length === 0}
              checked={allHideableVisible}
              indeterminate={!allHideableVisible && !allHideableHidden}
              onChange={() => toggleAllColumns(!allHideableVisible)}
              name={localeText.columnsManagementShowHideAllText}
              label={localeText.columnsManagementShowHideAllText}
              density="compact"
              {...slotProps?.baseCheckbox}
            />
          )}
          {!disableResetButton && (
            <slots.baseButton onClick={reset} disabled={isResetDisabled} {...slotProps?.baseButton}>
              {localeText.columnsManagementReset}
            </slots.baseButton>
          )}
        </Footer>
      )}
    </>
  );
};

export default ColumnsManagement;
