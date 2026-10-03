import PinningContext from '@contexts/pinning';
import { useContext } from 'react';

/** Internal: full pinning context, including what the grid-side sync needs. */
const usePinningContext = () => {
  const context = useContext(PinningContext);
  if (!context) {
    throw new Error('tablewright: pinning hooks must be used inside a TableWright.');
  }
  return context;
};

export default usePinningContext;
