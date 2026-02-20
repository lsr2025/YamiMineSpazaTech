/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

export default function MobileLeave() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: myLeave = [] } = useQuery({
    queryKey: ['my-leave', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Leave.filter({ agent_email: user.email }, '-created_date', 50);
    },
    enabled: !!user?.email
  });

  const createLeave = useMutation({
    mutationFn: async (data) => {
      const days = differenceInDays(new Date(data.end_date), new Date(data.start_date)) + 1;
      return await base44.entities.Leave.create({
        agent_email: user.email,
        agent_name: user.full_name,
        ...data,
        days_requested: days,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leave'] });
      setDialogOpen(false);
      setFormData({
        leave_type: 'annual',
        start_date: '',
        end_date: '',
        reason: ''
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createLeave.mutate(formData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const pendingCount = myLeave.filter(l => l.status === 'pending').length;
  const approvedCount = myLeave.filter(l => l.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-1">Leave Requests</h1>
          <p className="text-slate-400">Manage your time off</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                  <p className="text-slate-400 text-xs">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{approvedCount}</p>
                  <p className="text-slate-400 text-xs">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Request Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 text-lg gap-2">
              <Plus className="w-5 h-5" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">New Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Leave Type</Label>
                <Select value={formData.leave_type} onValueChange={(v) => setFormData(prev => ({ ...prev, leave_type: v }))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="family_responsibility">Family Responsibility</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Reason</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Reason for leave..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 border-slate-600">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.start_date || !formData.end_date || createLeave.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createLeave.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Leave History */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold">My Requests</h2>
          {myLeave.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No leave requests yet</p>
              </CardContent>
            </Card>
          ) : (
            myLeave.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge className={getStatusColor(request.leave_type)}>
                          {request.leave_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Period</span>
                        <span className="text-white">
                          {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Days</span>
                        <span className="text-white">{request.days_requested} days</span>
                      </div>
                      {request.reason && (
                        <div className="pt-2 border-t border-slate-700/50">
                          <p className="text-slate-400 text-xs mb-1">Reason</p>
                          <p className="text-slate-300">{request.reason}</p>
                        </div>
                      )}
                      {request.reviewer_notes && (
                        <div className="p-2 bg-slate-800/50 rounded">
                          <p className="text-slate-400 text-xs mb-1">Reviewer Notes</p>
                          <p className="text-slate-300 text-xs">{request.reviewer_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}