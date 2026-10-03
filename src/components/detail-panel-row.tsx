import DetailPanel from '@components/detail-panel';
import useDetailPanelContext from '@hooks/use-detail-panel-context';
import type { GridRowProps } from '@mui/x-data-grid';

/** `row` slot: the consumer's row (default `GridRow`) followed by its detail panel when open. */
const DetailPanelRow = (props: GridRowProps) => {
  const {
    rowSlot: Row,
    expandedRowIds,
    getDetailPanelContent,
    getDetailPanelHeight,
    getReservedHeight,
  } = useDetailPanelContext();
  const { rowId, isNotVisible } = props;
  const content = expandedRowIds.has(rowId) ? getDetailPanelContent(rowId) : null;

  return (
    <>
      <Row {...props} />
      {content != null && !isNotVisible && (
        <DetailPanel
          rowId={rowId}
          height={getDetailPanelHeight(rowId)}
          reservedHeight={getReservedHeight(rowId)}
        >
          {content}
        </DetailPanel>
      )}
    </>
  );
};

export default DetailPanelRow;
