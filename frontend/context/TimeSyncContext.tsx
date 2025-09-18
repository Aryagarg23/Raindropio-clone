import React, { createContext, useState, useMemo, ReactNode } from 'react';

interface TimeSyncContextType {
  offset: number;
  updateOffset: (serverTime: string) => void;
}

export const TimeSyncContext = createContext<TimeSyncContextType | undefined>(undefined);

interface TimeSyncProviderProps {
  children: ReactNode;
}

export const TimeSyncProvider: React.FC<TimeSyncProviderProps> = ({ children }) => {
  const [offset, setOffset] = useState<number>(0);

  const value = useMemo(() => ({
    offset,
    updateOffset: (serverTime: string) => {
      const serverTimeMs = new Date(serverTime).getTime();
      const clientTimeMs = Date.now();
      const newOffset = serverTimeMs - clientTimeMs;
      // We only set the offset once to avoid jitter
      // A more advanced implementation could use a moving average
      setOffset(prevOffset => prevOffset === 0 ? newOffset : prevOffset);
    }
  }), [offset]);

  return (
    <TimeSyncContext.Provider value={value}>
      {children}
    </TimeSyncContext.Provider>
  );
};
