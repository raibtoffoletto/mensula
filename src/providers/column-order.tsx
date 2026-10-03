import ColumnOrderContext, { type ColumnOrderContextValue } from '@contexts/column-order';

type ColumnOrderProviderProps = Parent<{ value: ColumnOrderContextValue }>;

const ColumnOrderProvider = ({ value, children }: ColumnOrderProviderProps) => (
  <ColumnOrderContext.Provider value={value}>{children}</ColumnOrderContext.Provider>
);

export default ColumnOrderProvider;
