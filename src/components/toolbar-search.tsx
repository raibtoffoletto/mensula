import useCompactToolbar from '@hooks/use-compact-toolbar';
import { styled } from '@mui/material/styles';
import {
  ToolbarButton as GridToolbarButton,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  gridClasses,
  useGridRootProps,
  type GridSlotProps,
  type GridToolbarQuickFilterProps,
} from '@mui/x-data-grid';

/** The quick filter's options, as in the toolbar slot's `quickFilterProps`. */
export type ToolbarSearchProps = GridToolbarQuickFilterProps;

type OwnerState = { expanded: boolean };

const TextFieldSlot = (props: GridSlotProps['baseTextField']) => {
  const rootProps = useGridRootProps();
  return <rootProps.slots.baseTextField {...props} />;
};

// Trigger and field share one grid cell, so the field grows out from under the trigger.
const QuickFilterRoot = styled('div', { name: 'MuiDataGrid', slot: 'ToolbarQuickFilter' })({
  display: 'grid',
  alignItems: 'center',
});

const QuickFilterTriggerButton = styled(GridToolbarButton, {
  name: 'MuiDataGrid',
  slot: 'ToolbarQuickFilterTrigger',
})<{ ownerState: OwnerState }>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  width: 'min-content',
  height: 'min-content',
  zIndex: 1,
  opacity: ownerState.expanded ? 0 : 1,
  pointerEvents: ownerState.expanded ? 'none' : 'auto',
  transition: theme.transitions.create('opacity', { duration: theme.transitions.duration.short }),
}));

// Collapsed, the field shrinks to the trigger's width (`--trigger-width`, set by `QuickFilter`).
const QuickFilterTextField = styled(TextFieldSlot, {
  name: 'MuiDataGrid',
  slot: 'ToolbarQuickFilterControl',
})<{ ownerState: OwnerState }>(({ theme, ownerState }) => ({
  gridArea: '1 / 1',
  overflowX: 'clip',
  width: ownerState.expanded ? 260 : 'var(--trigger-width)',
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(['width', 'opacity'], {
    duration: theme.transitions.duration.short,
  }),
}));

/**
 * Toolbar drop-in: the quick filter as an always-open search field. Below `md` it collapses behind
 * a search button, like the stock toolbar's, and expands when clicked or while it holds a value.
 */
const ToolbarSearch = ({
  quickFilterParser,
  quickFilterFormatter,
  debounceMs,
  className,
  slotProps,
  ...other
}: ToolbarSearchProps) => {
  const rootProps = useGridRootProps();
  const { localeText } = rootProps;
  const compact = useCompactToolbar();

  return (
    <QuickFilter
      // Remount on a breakpoint change: `QuickFilter` measures the trigger only on mount, and
      // a remount does not pull focus to the trigger the way a collapse does.
      key={compact ? 'compact' : 'wide'}
      parser={quickFilterParser}
      formatter={quickFilterFormatter}
      debounceMs={debounceMs}
      // Wide, it is locked open: no trigger, no collapse. Compact, `QuickFilter` drives it.
      expanded={compact ? undefined : true}
      render={(rootDivProps, state) => (
        <QuickFilterRoot
          {...rootDivProps}
          className={[gridClasses.toolbarQuickFilter, className].filter(Boolean).join(' ')}
        >
          {compact && (
            <QuickFilterTrigger
              render={(triggerProps) => (
                <rootProps.slots.baseTooltip
                  title={localeText.toolbarQuickFilterLabel}
                  // Keeps the tooltip from lagging behind the fading trigger.
                  enterDelay={0}
                >
                  <QuickFilterTriggerButton
                    className={gridClasses.toolbarQuickFilterTrigger}
                    {...triggerProps}
                    ownerState={state}
                    color="inherit"
                    aria-disabled={state.expanded}
                  >
                    <rootProps.slots.quickFilterIcon fontSize="small" />
                  </QuickFilterTriggerButton>
                </rootProps.slots.baseTooltip>
              )}
            />
          )}
          <QuickFilterControl
            render={({ ref, slotProps: controlSlotProps, ...controlProps }) => (
              <QuickFilterTextField
                className={gridClasses.toolbarQuickFilterControl}
                ownerState={state}
                inputRef={ref}
                aria-label={localeText.toolbarQuickFilterLabel}
                placeholder={localeText.toolbarQuickFilterPlaceholder}
                size="small"
                slotProps={{
                  ...controlSlotProps,
                  input: {
                    startAdornment: <rootProps.slots.quickFilterIcon fontSize="small" />,
                    endAdornment: controlProps.value ? (
                      <QuickFilterClear
                        render={
                          <rootProps.slots.baseIconButton
                            size="small"
                            edge="end"
                            aria-label={localeText.toolbarQuickFilterDeleteIconLabel}
                          >
                            <rootProps.slots.quickFilterClearIcon fontSize="small" />
                          </rootProps.slots.baseIconButton>
                        }
                      />
                    ) : null,
                    ...controlSlotProps?.input,
                  },
                }}
                {...rootProps.slotProps?.baseTextField}
                {...controlProps}
                {...slotProps?.root}
                {...other}
              />
            )}
          />
        </QuickFilterRoot>
      )}
    />
  );
};

export default ToolbarSearch;
