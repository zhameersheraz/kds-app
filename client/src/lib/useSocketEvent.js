// useSocketEvent — subscribe to a Socket.IO event and clean up on unmount.

import { useEffect } from 'react';
import { onSocketEvent } from './socket';

export function useSocketEvent(event, handler) {
  useEffect(() => {
    const off = onSocketEvent(event, handler);
    return off;
  }, [event, handler]);
}
