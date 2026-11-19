import { useCallback, useState } from 'react';

/**
 * Vertical border props. Unlike the stock grid's, they can change at runtime: users toggle them
 * from the view menu (right-click the footer or the empty part of the header row). Pass a value
 * with its callback to control one. A value alone sets where it starts (and resets it whenever the
 * value changes); users can still toggle it. Leave both out to start from `initialState`.
 */
export type VerticalBordersProps = {
  /** Shows the borders between cells. Controlled only together with its callback. */
  showCellVerticalBorder?: boolean;
  /** Fired when the user toggles the cell borders. */
  onShowCellVerticalBorderChange?: (show: boolean) => void;
  /** Shows the borders between column headers. Controlled only together with its callback. */
  showColumnVerticalBorder?: boolean;
  /** Fired when the user toggles the header borders. */
  onShowColumnVerticalBorderChange?: (show: boolean) => void;
};

type VerticalBordersStateOptions = VerticalBordersProps & {
  initialShowCellVerticalBorder?: boolean;
  initialShowColumnVerticalBorder?: boolean;
};

/**
 * A boolean that follows its prop when the prop comes with a callback. A prop without one only
 * seeds the state, and overwrites it again each time the prop changes.
 */
const useControllableBoolean = (
  value: boolean | undefined,
  onChange: ((value: boolean) => void) | undefined,
  initialValue: boolean,
) => {
  const [state, setState] = useState(value ?? initialValue);
  const [previousValue, setPreviousValue] = useState(value);
  // Adjusting state while rendering (not in an effect) applies a new prop without a stale frame.
  if (value !== previousValue) {
    setPreviousValue(value);
    if (value !== undefined) {
      setState(value);
    }
  }
  const isControlled = value !== undefined && onChange !== undefined;
  const setValue = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setState(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? value : state, setValue] as const;
};

/** Owns both vertical border flags (each controlled or not). */
const useVerticalBordersState = ({
  showCellVerticalBorder: showCellProp,
  onShowCellVerticalBorderChange,
  showColumnVerticalBorder: showColumnProp,
  onShowColumnVerticalBorderChange,
  initialShowCellVerticalBorder = false,
  initialShowColumnVerticalBorder = false,
}: VerticalBordersStateOptions) => {
  const [showCellVerticalBorder, setShowCellVerticalBorder] = useControllableBoolean(
    showCellProp,
    onShowCellVerticalBorderChange,
    initialShowCellVerticalBorder,
  );
  const [showColumnVerticalBorder, setShowColumnVerticalBorder] = useControllableBoolean(
    showColumnProp,
    onShowColumnVerticalBorderChange,
    initialShowColumnVerticalBorder,
  );
  return {
    showCellVerticalBorder,
    setShowCellVerticalBorder,
    showColumnVerticalBorder,
    setShowColumnVerticalBorder,
  };
};

export default useVerticalBordersState;
