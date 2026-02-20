/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
/**
 * Compact inline status bar for use inside pages (Shops, ShopDetail, NewInspection).
 * Shows online/offline state + pending count with a sync link.
 */
import React from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';

export default function OfflineStatusBar({ className = '' }) {
  const { isOnline, pending, breakdown } = useOfflineStatus();

  if (isOnline && pending === 0) return null;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium ${
      !isOnline
        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
        : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
    } ${className}`}>
      {!isOnline
        ? <><WifiOff className="w-3.5 h-3.5 shrink-0" /><span>Offline — data saved locally</span></>
        : <><RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" /><span>Syncing {pending} pending record{pending > 1 ? 's' : ''}…</span></>
      }
      {pending > 0 && !isOnline && (
        <span className="ml-auto bg-amber-500/25 px-1.5 py-0.5 rounded text-amber-200">{pending} pending</span>
      )}
    </div>
  );
}