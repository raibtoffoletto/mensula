import DetailPanelContext, { type DetailPanelContextValue } from '@contexts/detail-panel';

type DetailPanelProviderProps = Parent<{ value: DetailPanelContextValue }>;

const DetailPanelProvider = ({ value, children }: DetailPanelProviderProps) => (
  <DetailPanelContext.Provider value={value}>{children}</DetailPanelContext.Provider>
);

export default DetailPanelProvider;
