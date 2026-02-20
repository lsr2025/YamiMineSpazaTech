/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

export default function MySchedule() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['my-shifts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Shift.filter({ agent_email: user.email }, '-shift_date', 100);
    },
    enabled: !!user?.email
  });

  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDay = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.shift_date === dateStr);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-emerald-500/20 text-emerald-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const upcomingShifts = shifts.filter(s => new Date(s.shift_date) >= new Date() && s.status === 'scheduled');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">My Schedule</h1>
          <p className="text-slate-400">Your upcoming shifts</p>
        </motion.div>

        {/* This Week */}
        <div className="mb-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            This Week
          </h2>
          <div className="space-y-3">
            {weekDays.map((day, index) => {
              const dayShifts = getShiftsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.div
                  key={day.toString()}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white font-medium">{format(day, 'EEEE')}</p>
                          <p className="text-slate-400 text-sm">{format(day, 'MMM dd')}</p>
                        </div>
                        {isToday && (
                          <Badge className="bg-cyan-500/20 text-cyan-400">Today</Badge>
                        )}
                      </div>
                      
                      {dayShifts.length === 0 ? (
                        <p className="text-slate-500 text-sm">No shifts</p>
                      ) : (
                        <div className="space-y-2">
                          {dayShifts.map(shift => (
                            <div key={shift.id} className="p-3 bg-slate-800/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={getStatusColor(shift.status)}>
                                  {shift.status}
                                </Badge>
                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {shift.start_time} - {shift.end_time}
                                </span>
                              </div>
                              {shift.municipality && (
                                <p className="text-slate-300 text-sm flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {shift.municipality}
                                  {shift.ward && ` - Ward ${shift.ward}`}
                                </p>
                              )}
                              {shift.notes && (
                                <p className="text-slate-400 text-xs mt-2 flex items-start gap-1">
                                  <FileText className="w-3 h-3 mt-0.5" />
                                  {shift.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Shifts */}
        {upcomingShifts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-white font-semibold mb-4">Future Shifts</h2>
            <div className="space-y-3">
              {upcomingShifts.slice(0, 5).map((shift, index) => (
                <motion.div
                  key={shift.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{format(new Date(shift.shift_date), 'EEEE, MMM dd')}</p>
                        <Badge className={getStatusColor(shift.status)}>
                          {shift.status}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        {shift.start_time} - {shift.end_time}
                      </p>
                      {shift.municipality && (
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {shift.municipality}
                          {shift.ward && ` - Ward ${shift.ward}`}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}