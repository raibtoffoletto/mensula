import useDetailPanelContext from '@hooks/use-detail-panel-context';
import { styled } from '@mui/material';
import type { GridRowId } from '@mui/x-data-grid';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

type DetailPanelProps = {
  rowId: GridRowId;
  height: number | 'auto';
  /** Space the grid reserved below the row; the panel slides up into it. */
  reservedHeight: number;
  children: ReactNode;
};

const DetailPanelRoot = styled('div')({
  boxSizing: 'border-box',
  width: 'var(--DataGrid-rowWidth)',
  overflow: 'auto',
  backgroundColor: 'var(--DataGrid-t-color-background-base)',
  borderBottom: '1px solid var(--DataGrid-rowBorderColor)',
});

/**
 * Rendered right after its row inside the render zone (a flex column, so margins never
 * collapse). The row carries the reserved height as bottom margin; a matching negative top
 * margin lifts the panel into that gap, keeping flow height equal to what the virtualizer counts.
 */
const DetailPanel = ({ rowId, height, reservedHeight, children }: DetailPanelProps) => {
  const { reportDetailPanelHeight } = useDetailPanelContext();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (height !== 'auto' || !element) {
      return undefined;
    }
    reportDetailPanelHeight(rowId, element.offsetHeight);
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(() => reportDetailPanelHeight(rowId, element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [height, reportDetailPanelHeight, rowId]);

  return (
    <DetailPanelRoot
      ref={ref}
      role="presentation"
      className="MuiDataGrid-detailPanel"
      data-id={rowId}
      style={{ height, marginTop: -reservedHeight }}
    >
      {children}
    </DetailPanelRoot>
  );
};

export default DetailPanel;
