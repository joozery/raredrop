"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface BalanceContextType {
  coins: number;
  gemCoins: number;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType>({
  coins: 0,
  gemCoins: 0,
  refreshBalance: async () => {},
});

export function BalanceProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [coins, setCoins] = useState(0);
  const [gemCoins, setGemCoins] = useState(0);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/user/balance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins ?? 0);
        setGemCoins(data.gemCoins ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (session) {
      // seed initial values from session to avoid flash
      setCoins((session.user as any)?.coins ?? 0);
      setGemCoins((session.user as any)?.gemCoins ?? 0);
      refreshBalance();
    } else {
      setCoins(0);
      setGemCoins(0);
    }
  }, [session, refreshBalance]);

  return (
    <BalanceContext.Provider value={{ coins, gemCoins, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  return useContext(BalanceContext);
}
