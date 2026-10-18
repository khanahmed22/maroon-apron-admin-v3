import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true); // optimistic until the first check resolves

  const recheck = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const status = await Network.getStatus();
      setOnline(status.connected);
    } catch {
      // if the plugin fails, don't block the app
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    recheck();
    const sub = Network.addListener('networkStatusChange', (s) =>
      setOnline(s.connected),
    );
    return () => {
      sub.then((h) => h.remove());
    };
  }, [recheck]);

  return { online, recheck };
}