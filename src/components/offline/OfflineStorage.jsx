/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
// Offline Storage Utility using IndexedDB
const DB_NAME = 'SpazaOfflineDB';
const DB_VERSION = 3; // bumped to add shop cache

export const STORES = {
  SHOPS: 'pending_shops',
  INSPECTIONS: 'pending_inspections',
  PHOTOS: 'pending_photos',
  SHOP_CACHE: 'shop_cache',       // read cache for offline ShopDetail/Shops
  ATTENDANCE: 'pending_attendance',
};

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.SHOPS)) {
          const s = db.createObjectStore(STORES.SHOPS, { keyPath: 'id', autoIncrement: true });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.INSPECTIONS)) {
          const s = db.createObjectStore(STORES.INSPECTIONS, { keyPath: 'id', autoIncrement: true });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
          const s = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id', autoIncrement: true });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.SHOP_CACHE)) {
          // keyed by server id
          db.createObjectStore(STORES.SHOP_CACHE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
          const s = db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id', autoIncrement: true });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  async _tx(storeName, mode, fn) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ── Shop cache (read cache for offline browsing) ──────────────────────────
  async cacheShops(shops) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORES.SHOP_CACHE], 'readwrite');
      const store = tx.objectStore(STORES.SHOP_CACHE);
      shops.forEach(shop => store.put({ ...shop, _cached_at: new Date().toISOString() }));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedShops() {
    return this._tx(STORES.SHOP_CACHE, 'readonly', s => s.getAll());
  }

  async getCachedShop(id) {
    return this._tx(STORES.SHOP_CACHE, 'readonly', s => s.get(id));
  }

  async updateCachedShop(shop) {
    return this._tx(STORES.SHOP_CACHE, 'readwrite', s => s.put({ ...shop, _cached_at: new Date().toISOString() }));
  }

  // ── Pending shop (new/edit saved offline) ─────────────────────────────────
  async saveShop(shopData) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORES.SHOPS], 'readwrite');
      const store = tx.objectStore(STORES.SHOPS);
      const req = store.add({ ...shopData, timestamp: new Date().toISOString(), synced: false });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingShops() {
    const all = await this._tx(STORES.SHOPS, 'readonly', s => s.getAll());
    return all.filter(x => !x.synced);
  }

  // ── Pending inspection ────────────────────────────────────────────────────
  async saveInspection(data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORES.INSPECTIONS], 'readwrite');
      const store = tx.objectStore(STORES.INSPECTIONS);
      const req = store.add({ ...data, timestamp: new Date().toISOString(), synced: false });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingInspections() {
    const all = await this._tx(STORES.INSPECTIONS, 'readonly', s => s.getAll());
    return all.filter(x => !x.synced);
  }

  // ── Pending attendance ────────────────────────────────────────────────────
  async saveAttendance(data) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORES.ATTENDANCE], 'readwrite');
      const store = tx.objectStore(STORES.ATTENDANCE);
      const req = store.add({ ...data, timestamp: new Date().toISOString(), synced: false });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingAttendance() {
    const all = await this._tx(STORES.ATTENDANCE, 'readonly', s => s.getAll());
    return all.filter(x => !x.synced);
  }

  // ── Generic delete/mark ───────────────────────────────────────────────────
  async deleteSynced(storeName, id) {
    return this._tx(storeName, 'readwrite', s => s.delete(id));
  }

  async markAsSynced(storeName, id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const get = store.get(id);
      get.onsuccess = () => {
        if (get.result) {
          const put = store.put({ ...get.result, synced: true });
          put.onsuccess = () => resolve();
          put.onerror = () => reject(put.error);
        } else resolve();
      };
      get.onerror = () => reject(get.error);
    });
  }

  // ── Count all pending items ───────────────────────────────────────────────
  async getAllPendingCount() {
    const [shops, inspections, attendance] = await Promise.all([
      this.getPendingShops(),
      this.getPendingInspections(),
      this.getPendingAttendance(),
    ]);
    return shops.length + inspections.length + attendance.length;
  }

  async getPendingBreakdown() {
    const [shops, inspections, attendance] = await Promise.all([
      this.getPendingShops(),
      this.getPendingInspections(),
      this.getPendingAttendance(),
    ]);
    return { shops: shops.length, inspections: inspections.length, attendance: attendance.length };
  }
}

export const offlineStorage = new OfflineStorage();