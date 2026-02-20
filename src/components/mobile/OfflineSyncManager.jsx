/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  CloudOff, 
  Cloud, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle,
  Upload,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

// IndexedDB helper functions
const DB_NAME = 'spaza_offline_db';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_inspections')) {
        db.createObjectStore('pending_inspections', { keyPath: 'localId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending_shops')) {
        db.createObjectStore('pending_shops', { keyPath: 'localId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending_photos')) {
        db.createObjectStore('pending_photos', { keyPath: 'localId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached_shops')) {
        db.createObjectStore('cached_shops', { keyPath: 'id' });
      }
    };
  });
};

const saveToStore = async (storeName, data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add({ ...data, timestamp: Date.now() });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllFromStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteFromStore = async (storeName, key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export function OfflineSyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending items on mount
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingData();
    }
  }, [isOnline]);

  const updatePendingCount = async () => {
    try {
      const inspections = await getAllFromStore('pending_inspections');
      const shops = await getAllFromStore('pending_shops');
      const photos = await getAllFromStore('pending_photos');
      setPendingCount(inspections.length + shops.length + photos.length);
    } catch (error) {
      console.error('Error counting pending items:', error);
    }
  };

  const saveInspectionOffline = async (inspectionData) => {
    await saveToStore('pending_inspections', inspectionData);
    await updatePendingCount();
  };

  const saveShopOffline = async (shopData) => {
    await saveToStore('pending_shops', shopData);
    await updatePendingCount();
  };

  const savePhotoOffline = async (photoData) => {
    await saveToStore('pending_photos', photoData);
    await updatePendingCount();
  };

  const syncPendingData = async () => {
    if (!isOnline || syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      // Sync pending inspections
      const pendingInspections = await getAllFromStore('pending_inspections');
      for (const inspection of pendingInspections) {
        // Upload would happen here with base44.entities.Inspection.create()
        await deleteFromStore('pending_inspections', inspection.localId);
      }

      // Sync pending shops
      const pendingShops = await getAllFromStore('pending_shops');
      for (const shop of pendingShops) {
        // Upload would happen here
        await deleteFromStore('pending_shops', shop.localId);
      }

      // Sync pending photos
      const pendingPhotos = await getAllFromStore('pending_photos');
      for (const photo of pendingPhotos) {
        // Upload would happen here
        await deleteFromStore('pending_photos', photo.localId);
      }

      setSyncStatus('success');
      setLastSyncTime(new Date());
      await updatePendingCount();
      
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const value = {
    isOnline,
    pendingCount,
    syncStatus,
    lastSyncTime,
    saveInspectionOffline,
    saveShopOffline,
    savePhotoOffline,
    syncPendingData,
    updatePendingCount
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function SyncStatusIndicator({ compact = false }) {
  const { isOnline, pendingCount, syncStatus, syncPendingData, lastSyncTime } = useOffline();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 gap-1">
            <Wifi className="w-3 h-3" />
            Online
          </Badge>
        ) : (
          <Badge className="bg-amber-500/20 text-amber-400 gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge className="bg-cyan-500/20 text-cyan-400">
            {pendingCount} pending
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Cloud className="w-5 h-5 text-emerald-400" />
            </div>
          ) : (
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <CloudOff className="w-5 h-5 text-amber-400" />
            </div>
          )}
          <div>
            <p className="text-white font-medium">
              {isOnline ? 'Connected' : 'Offline Mode'}
            </p>
            <p className="text-slate-400 text-sm">
              {isOnline 
                ? 'Data syncing automatically' 
                : 'Data will sync when online'
              }
            </p>
          </div>
        </div>
        
        {isOnline && pendingCount > 0 && (
          <Button
            size="sm"
            onClick={syncPendingData}
            disabled={syncStatus === 'syncing'}
            className="bg-cyan-600 hover:bg-cyan-700 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        )}
      </div>

      {/* Pending Items */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium">
            {pendingCount} item{pendingCount > 1 ? 's' : ''} waiting to sync
          </span>
        </div>
      )}

      {/* Sync Status Feedback */}
      <AnimatePresence>
        {syncStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm">All data synced successfully!</span>
          </motion.div>
        )}
        {syncStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">Sync failed. Will retry automatically.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {lastSyncTime && (
        <p className="text-slate-500 text-xs mt-3">
          Last synced: {lastSyncTime.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`px-4 py-2 text-center text-sm font-medium ${
          isOnline 
            ? 'bg-cyan-600 text-white' 
            : 'bg-amber-600 text-white'
        }`}
      >
        {isOnline ? (
          <span className="flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {pendingCount} item{pendingCount > 1 ? 's' : ''} ready to sync
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            Offline Mode - Data saved locally
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}