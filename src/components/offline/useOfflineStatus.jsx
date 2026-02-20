/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from './OfflineStorage';

// Global state shared across all consumers
let listeners = [];
let globalState = { isOnline: navigator.onLine, pending: 0, breakdown: { shops: 0, inspections: 0, attendance: 0 } };

function notify() {
  listeners.forEach(fn => fn({ ...globalState }));
}

window.addEventListener('online',  () => { globalState.isOnline = true;  notify(); });
window.addEventListener('offline', () => { globalState.isOnline = false; notify(); });

export async function refreshPendingCount() {
  const breakdown = await offlineStorage.getPendingBreakdown();
  globalState.breakdown = breakdown;
  globalState.pending = breakdown.shops + breakdown.inspections + breakdown.attendance;
  notify();
}

// Poll every 8s
setInterval(refreshPendingCount, 8000);
refreshPendingCount();

export function useOfflineStatus() {
  const [state, setState] = useState({ ...globalState });

  useEffect(() => {
    const handler = (s) => setState({ ...s });
    listeners.push(handler);
    return () => { listeners = listeners.filter(l => l !== handler); };
  }, []);

  return state;
}