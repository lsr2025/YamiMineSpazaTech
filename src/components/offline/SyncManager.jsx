/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { offlineStorage, STORES } from './OfflineStorage';
import { useOfflineStatus, refreshPendingCount } from './useOfflineStatus';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi, WifiOff, Upload, Check, Loader2, AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyncManager() {
  const { isOnline, pending, breakdown } = useOfflineStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const syncData = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setResult(null);
    let success = 0, failed = 0;

    try {
      // Sync pending new shops
      const pendingShops = await offlineStorage.getPendingShops();
      for (const shop of pendingShops) {
        try {
          const { id, timestamp, synced, ...data } = shop;
          await base44.entities.Shop.create(data);
          await offlineStorage.deleteSynced(STORES.SHOPS, id);
          success++;
        } catch { failed++; }
      }

      // Sync pending inspections
      const pendingInspections = await offlineStorage.getPendingInspections();
      for (const insp of pendingInspections) {
        try {
          const { id, timestamp, synced, ...data } = insp;
          await base44.entities.Inspection.create(data);
          // If shopUpdate is bundled in, apply it
          if (data._shopUpdate && data.shop_id) {
            await base44.entities.Shop.update(data.shop_id, data._shopUpdate);
          }
          await offlineStorage.deleteSynced(STORES.INSPECTIONS, id);
          success++;
        } catch { failed++; }
      }

      // Sync pending attendance
      const pendingAttendance = await offlineStorage.getPendingAttendance();
      for (const att of pendingAttendance) {
        try {
          const { id, timestamp, synced, ...data } = att;
          await base44.entities.Attendance.create(data);
          await offlineStorage.deleteSynced(STORES.ATTENDANCE, id);
          success++;
        } catch { failed++; }
      }

      setLastSync(new Date());
      setResult({ success, failed });
    } finally {
      setSyncing(false);
      await refreshPendingCount();
    }
  }, [isOnline, syncing]);

  // Auto-sync when coming back online
  React.useEffect(() => {
    if (isOnline && pending > 0 && !syncing) {
      const t = setTimeout(syncData, 2500);
      return () => clearTimeout(t);
    }
  }, [isOnline, pending]);

  // Reset dismissed when new pending items arrive
  React.useEffect(() => {
    if (pending > 0) setDismissed(false);
  }, [pending]);

  const visible = !dismissed && (!isOnline || pending > 0 || (result && result.success > 0));
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 lg:top-4 right-4 z-50 w-72 shadow-2xl"
    >
      <div className={`rounded-xl border overflow-hidden ${
        !isOnline ? 'bg-amber-950/95 border-amber-800' : 'bg-slate-900/97 border-slate-700'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          {isOnline
            ? <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            : <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />}
          <span className={`text-sm font-semibold flex-1 ${isOnline ? 'text-white' : 'text-amber-200'}`}>
            {!isOnline ? 'Offline Mode' : syncing ? 'Syncing…' : pending > 0 ? 'Pending Sync' : 'All Synced'}
          </span>
          {pending > 0 && (
            <Badge className="bg-amber-500/25 text-amber-300 border-0 text-xs">{pending}</Badge>
          )}
          {pending > 0 && (
            <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-white">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-white ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence>
          {(expanded || syncing || result) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-700/50"
            >
              <div className="px-4 py-3 space-y-2">
                {/* Breakdown */}
                {pending > 0 && !syncing && (
                  <div className="space-y-1 text-xs text-slate-400">
                    {breakdown.shops > 0 && <p>• {breakdown.shops} shop profile{breakdown.shops > 1 ? 's' : ''}</p>}
                    {breakdown.inspections > 0 && <p>• {breakdown.inspections} inspection{breakdown.inspections > 1 ? 's' : ''}</p>}
                    {breakdown.attendance > 0 && <p>• {breakdown.attendance} attendance record{breakdown.attendance > 1 ? 's' : ''}</p>}
                    {!isOnline && <p className="text-amber-400 mt-1">Will upload when online</p>}
                  </div>
                )}

                {/* Sync progress */}
                {syncing && (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Uploading {pending} record{pending > 1 ? 's' : ''}…
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className="space-y-1 text-xs">
                    {result.success > 0 && (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3 h-3" /> {result.success} uploaded successfully
                      </div>
                    )}
                    {result.failed > 0 && (
                      <div className="flex items-center gap-1.5 text-red-400">
                        <AlertCircle className="w-3 h-3" /> {result.failed} failed — will retry
                      </div>
                    )}
                  </div>
                )}

                {isOnline && pending > 0 && !syncing && (
                  <Button
                    size="sm"
                    onClick={syncData}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5"
                  >
                    <Upload className="w-3 h-3" /> Sync Now
                  </Button>
                )}

                {lastSync && (
                  <p className="text-slate-600 text-xs">Last sync: {lastSync.toLocaleTimeString()}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}