import { DataGrid, type DataGridProps } from '@mui/x-data-grid';

export type TableWrightProps = DataGridProps;

const TableWright = (props: TableWrightProps) => {
  return <DataGrid {...props} />;
};

export default TableWright;
