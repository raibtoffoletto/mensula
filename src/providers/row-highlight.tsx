import RowHighlightContext, { type RowHighlightApi } from '@contexts/row-highlight';

type RowHighlightProviderProps = Parent<{ value: RowHighlightApi }>;

const RowHighlightProvider = ({ value, children }: RowHighlightProviderProps) => (
  <RowHighlightContext.Provider value={value}>{children}</RowHighlightContext.Provider>
);

export default RowHighlightProvider;
