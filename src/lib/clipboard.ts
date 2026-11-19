import { GRID_DETAIL_PANEL_TOGGLE_FIELD } from '@lib/detail-panel';
import {
  GRID_CHECKBOX_SELECTION_FIELD,
  type GridApi,
  type GridColDef,
  type GridRowId,
} from '@mui/x-data-grid';

/**
 * Whether a column holds row data: not the checkbox, detail-panel toggle or `actions` columns (the
 * row menu column among them).
 */
export const isDataColumn = ({ field, type }: GridColDef) =>
  type !== 'actions' &&
  field !== GRID_CHECKBOX_SELECTION_FIELD &&
  field !== GRID_DETAIL_PANEL_TOGGLE_FIELD;

const toText = (value: unknown) => (value === null || value === undefined ? '' : String(value));

/** A cell's value as the grid displays it (and copies it with Ctrl + C). */
export const getCellText = (api: GridApi, id: GridRowId, field: string) => {
  const row = api.getRow(id);
  const column = api.getColumn(field);
  return row && column ? toText(api.getRowFormattedValue(row, column)) : '';
};

/** Every data column of the row, hidden ones included, as `Header: value` lines in column order. */
export const getRowText = (api: GridApi, id: GridRowId) => {
  const row = api.getRow(id);
  if (!row) {
    return '';
  }
  return api
    .getAllColumns()
    .filter(isDataColumn)
    .map((column) => {
      const value = toText(api.getRowFormattedValue(row, column));
      return `${column.headerName || column.field}: ${value}`;
    })
    .join('\n');
};

// Same fallback as the grid's own clipboard: insecure contexts have no `navigator.clipboard`.
const copyWithSelection = (text: string) => {
  const span = document.createElement('span');
  span.style.whiteSpace = 'pre';
  span.style.userSelect = 'all';
  span.textContent = text;
  document.body.appendChild(span);
  const range = document.createRange();
  range.selectNode(span);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  try {
    document.execCommand('copy');
  } finally {
    selection?.removeAllRanges();
    document.body.removeChild(span);
  }
};

export const copyToClipboard = (text: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => copyWithSelection(text));
  } else {
    copyWithSelection(text);
  }
};
