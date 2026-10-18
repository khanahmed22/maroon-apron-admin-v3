import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from '@capawesome/capacitor-app-update';

const MIN_FORCE_PRIORITY = 0; // only releases with priority >= this are forced; 0 = force every release

export function useForceUpdate(online: boolean) {
  const [blocked, setBlocked] = useState(false);
  const running = useRef(false);
  const blockedRef = useRef(false);

  const check = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !online || running.current) return;
    running.current = true;
    try {
      const info = await AppUpdate.getAppUpdateInfo();

      const updateExists =
        info.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE ||
        info.updateAvailability === AppUpdateAvailability.UPDATE_IN_PROGRESS;

      if (
        updateExists &&
        info.immediateUpdateAllowed &&
        (info.updatePriority ?? 0) >= MIN_FORCE_PRIORITY
      ) {
        const result = await AppUpdate.performImmediateUpdate();
        const failed = result.code !== AppUpdateResultCode.OK;
        blockedRef.current = failed;
        setBlocked(failed);
      }
    } catch {
      // fail open: never lock users out because of a Play Services error
    } finally {
      running.current = false;
    }
  }, [online]);

  const retry = useCallback(() => {
    blockedRef.current = false;
    setBlocked(false);
    check();
  }, [check]);

  const openStore = useCallback(async () => {
    try {
      await AppUpdate.openAppStore();
    } catch {}
  }, []);

  useEffect(() => {
    if (!blockedRef.current) check();
    const sub = App.addListener('appStateChange', ({ isActive }) => {
      // don't re-prompt on resume while the blocker is showing
      if (isActive && !blockedRef.current) check();
    });
    return () => {
      sub.then((s) => s.remove());
    };
  }, [check]);

  return { blocked, retry, openStore };
}