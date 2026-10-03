import PinningContext, { type PinningContextValue } from '@contexts/pinning';

type PinningProviderProps = Parent<{ value: PinningContextValue }>;

const PinningProvider = ({ value, children }: PinningProviderProps) => (
  <PinningContext.Provider value={value}>{children}</PinningContext.Provider>
);

export default PinningProvider;
