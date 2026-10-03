export const PinnedColumnSide = {
  Left: 'left',
  Right: 'right',
} as const;

export type PinnedColumnSide = (typeof PinnedColumnSide)[keyof typeof PinnedColumnSide];

export const PinnedRowPosition = {
  Top: 'top',
  Bottom: 'bottom',
} as const;

export type PinnedRowPosition = (typeof PinnedRowPosition)[keyof typeof PinnedRowPosition];
