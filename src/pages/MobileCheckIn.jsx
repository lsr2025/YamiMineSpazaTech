/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Clock, LogIn, LogOut, Loader2, Navigation,
  CheckCircle2, WifiOff, Wifi, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { offlineStorage, STORES } from '@/components/offline/OfflineStorage';
import { useOfflineStatus, refreshPendingCount } from '@/components/offline/useOfflineStatus';

const CHECKIN_CACHE_KEY = 'offline_today_attendance';

export default function MobileCheckIn() {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStatus();
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [offlineAttendance, setOfflineAttendance] = useState(null);
  const [actionDone, setActionDone] = useState(null); // 'checkin' | 'checkout'

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 60_000,
  });

  // Load today's attendance — from API when online, from localStorage cache when offline
  const { data: serverAttendance, refetch } = useQuery({
    queryKey: ['today-attendance', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const today = new Date().toISOString().split('T')[0];
      const records = await base44.entities.Attendance.filter({ agent_email: user.email, date: today });
      const record = records[0] || null;
      // Cache to localStorage for offline use
      if (record) localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(record));
      return record;
    },
    enabled: !!user?.email && isOnline,
  });

  // When offline, load from localStorage cache
  useEffect(() => {
    if (!isOnline) {
      try {
        const cached = localStorage.getItem(CHECKIN_CACHE_KEY);
        if (cached) setOfflineAttendance(JSON.parse(cached));
      } catch {}
    }
  }, [isOnline]);

  // When coming back online, clear offline attendance and refetch
  useEffect(() => {
    if (isOnline) {
      setOfflineAttendance(null);
      setActionDone(null);
      refetch();
    }
  }, [isOnline]);

  const todayAttendance = isOnline ? serverAttendance : offlineAttendance;

  const captureGPS = useCallback(() => {
    setGpsLoading(true);
    if (!("geolocation" in navigator)) {
      alert('Geolocation not supported on this device.');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsLoading(false);
      },
      () => {
        alert('Unable to get location. Please enable GPS.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { captureGPS(); }, []);

  // ── Check In ──────────────────────────────────────────────────────────────
  const checkInMutation = useMutation({
    mutationFn: async (data) => {
      const record = {
        agent_email: user.email,
        agent_name: user.full_name,
        date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        check_in_location: data.locationName,
        check_in_latitude: data.location.latitude,
        check_in_longitude: data.location.longitude,
        status: 'checked_in',
        notes: data.notes,
      };

      if (!isOnline) {
        await offlineStorage.saveAttendance(record);
        await refreshPendingCount();
        // Optimistically update local cache
        const optimistic = { ...record, id: `offline_${Date.now()}`, _offline: true };
        localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(optimistic));
        setOfflineAttendance(optimistic);
        return optimistic;
      }

      const created = await base44.entities.Attendance.create(record);
      localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(created));
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      setNotes('');
      setLocationName('');
      setActionDone('checkin');
    },
  });

  // ── Check Out ─────────────────────────────────────────────────────────────
  const checkOutMutation = useMutation({
    mutationFn: async (data) => {
      const checkInTime = new Date(todayAttendance.check_in_time);
      const hoursWorked = ((new Date() - checkInTime) / (1000 * 60 * 60)).toFixed(2);

      const update = {
        check_out_time: new Date().toISOString(),
        check_out_location: data.locationName,
        check_out_latitude: data.location.latitude,
        check_out_longitude: data.location.longitude,
        status: 'checked_out',
        hours_worked: parseFloat(hoursWorked),
        notes: (todayAttendance.notes || '') + (data.notes ? `\n${data.notes}` : ''),
      };

      if (!isOnline) {
        // If the original record was also created offline (no server id yet), merge into the pending attendance
        if (todayAttendance._offline) {
          await offlineStorage.saveAttendance({ ...todayAttendance, ...update });
          await refreshPendingCount();
        } else {
          await offlineStorage.saveCheckout(todayAttendance.id, update);
          await refreshPendingCount();
        }
        const optimistic = { ...todayAttendance, ...update, _offline: true };
        localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(optimistic));
        setOfflineAttendance(optimistic);
        return optimistic;
      }

      await base44.entities.Attendance.update(todayAttendance.id, update);
      const updated = { ...todayAttendance, ...update };
      localStorage.setItem(CHECKIN_CACHE_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      setNotes('');
      setLocationName('');
      setActionDone('checkout');
    },
  });

  const handleCheckIn = () => {
    if (!location) { alert('Please capture your location first'); return; }
    checkInMutation.mutate({ location, locationName, notes });
  };

  const handleCheckOut = () => {
    if (!location) { alert('Please capture your location first'); return; }
    checkOutMutation.mutate({ location, locationName, notes });
  };

  const isCheckedIn = todayAttendance?.status === 'checked_in';
  const isCheckedOut = todayAttendance?.status === 'checked_out';
  const isMutating = checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-24 lg:pb-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-2xl font-bold text-white mb-1">Daily Check-In</h1>
          <p className="text-slate-400">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</p>
          {user && <p className="text-cyan-400 text-sm mt-1">👋 {user.full_name}</p>}
        </motion.div>

        {/* Offline Banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm">
                <WifiOff className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold">Offline Mode</p>
                  <p className="text-xs text-amber-400/80">Check-ins saved locally — will sync when online</p>
                </div>
              </div>
            </motion.div>
          )}
          {isOnline && todayAttendance?._offline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm">
                <Wifi className="w-4 h-4 shrink-0" />
                <p>Back online — syncing pending records…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Banner */}
        <AnimatePresence>
          {actionDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>
                  {actionDone === 'checkin'
                    ? (!isOnline ? 'Check-in saved offline — will sync when connected.' : 'Checked in successfully!')
                    : (!isOnline ? 'Check-out saved offline — will sync when connected.' : 'Checked out successfully!')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-6">
              <div className="text-center">
                {isCheckedIn ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 mb-3">
                      Checked In {todayAttendance?._offline && '(Offline)'}
                    </Badge>
                    <p className="text-white text-lg font-semibold mb-1">
                      {format(new Date(todayAttendance.check_in_time), 'h:mm a')}
                    </p>
                    <p className="text-slate-400 text-sm">{todayAttendance.check_in_location || 'Location captured'}</p>
                  </>
                ) : isCheckedOut ? (
                  <>
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-blue-400" />
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 mb-3">
                      Day Complete {todayAttendance?._offline && '(Offline)'}
                    </Badge>
                    <p className="text-white text-lg font-semibold mb-1">
                      {todayAttendance.hours_worked?.toFixed(1) || 0} hours
                    </p>
                    <p className="text-slate-400 text-sm">
                      {format(new Date(todayAttendance.check_in_time), 'h:mm a')} –{' '}
                      {format(new Date(todayAttendance.check_out_time), 'h:mm a')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-10 h-10 text-slate-400" />
                    </div>
                    <Badge className="bg-slate-500/20 text-slate-400 mb-3">Not Checked In</Badge>
                    <p className="text-slate-400 text-sm">Ready to start your day?</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Card */}
        {!isCheckedOut && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                    Location
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={captureGPS}
                    disabled={gpsLoading}
                    className="border-slate-600 text-white"
                  >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  </Button>
                </div>

                {location ? (
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-emerald-400 text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Location captured
                    </p>
                    <p className="text-slate-400 text-xs font-mono">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">Accuracy: {location.accuracy}m</p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-amber-400 text-sm">Waiting for GPS…</p>
                  </div>
                )}

                <Input
                  placeholder="Location name (e.g., KwaDukuza Office)"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />

                <Textarea
                  placeholder="Add notes about your day..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-20"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isCheckedOut ? (
            <div className="p-4 bg-blue-500/10 rounded-lg text-center">
              <p className="text-blue-400">
                {todayAttendance?._offline
                  ? 'Day complete (saved offline). See you tomorrow!'
                  : 'You have completed your day. See you tomorrow!'}
              </p>
            </div>
          ) : isCheckedIn ? (
            <Button
              onClick={handleCheckOut}
              disabled={!location || isMutating}
              className="w-full h-16 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-lg gap-3"
            >
              {isMutating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-6 h-6" />
                  Check Out {!isOnline && '(Offline)'}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckIn}
              disabled={!location || isMutating}
              className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-lg gap-3"
            >
              {isMutating ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Check In {!isOnline && '(Offline)'}
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}