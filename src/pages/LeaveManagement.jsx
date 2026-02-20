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
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  
  const [formData, setFormData] = useState({
    agent_email: '',
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    supporting_document_url: ''
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: leave = [] } = useQuery({
    queryKey: ['leave'],
    queryFn: () => base44.entities.Leave.list('-created_date', 200)
  });

  const createLeave = useMutation({
    mutationFn: async (data) => {
      const agent = agents.find(a => a.user_email === data.agent_email);
      const days = differenceInDays(new Date(data.end_date), new Date(data.start_date)) + 1;
      return await base44.entities.Leave.create({
        ...data,
        agent_name: agent?.full_name || '',
        days_requested: days,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateLeaveStatus = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.Leave.update(id, {
        status,
        reviewed_by: user?.email,
        review_date: new Date().toISOString(),
        reviewer_notes: notes
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      setSelectedLeave(null);
    }
  });

  const resetForm = () => {
    setFormData({
      agent_email: '',
      leave_type: 'annual',
      start_date: '',
      end_date: '',
      reason: '',
      supporting_document_url: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createLeave.mutate(formData);
  };

  const handleApprove = (leaveRequest) => {
    updateLeaveStatus.mutate({
      id: leaveRequest.id,
      status: 'approved',
      notes: `Approved by ${user?.full_name}`
    });
  };

  const handleReject = (leaveRequest) => {
    const notes = prompt('Reason for rejection:');
    if (notes) {
      updateLeaveStatus.mutate({
        id: leaveRequest.id,
        status: 'rejected',
        notes
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'cancelled': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const pendingLeave = leave.filter(l => l.status === 'pending');
  const approvedLeave = leave.filter(l => l.status === 'approved');
  const rejectedLeave = leave.filter(l => l.status === 'rejected');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('HRDashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Leave Management</h1>
              <p className="text-slate-400 text-sm">Manage leave requests and approvals</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                <Plus className="w-4 h-4" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">New Leave Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Field Agent *</Label>
                  <Select value={formData.agent_email} onValueChange={(v) => setFormData(prev => ({ ...prev, agent_email: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.user_email}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Leave Type *</Label>
                  <Select value={formData.leave_type} onValueChange={(v) => setFormData(prev => ({ ...prev, leave_type: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="family_responsibility">Family Responsibility</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                      <SelectItem value="study">Study Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">End Date *</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Reason *</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                    placeholder="Reason for leave..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.agent_email || !formData.start_date || !formData.end_date || createLeave.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createLeave.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{pendingLeave.length}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Approved</p>
                  <p className="text-2xl font-bold text-white">{approvedLeave.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Rejected</p>
                  <p className="text-2xl font-bold text-white">{rejectedLeave.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardContent className="p-6">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700 mb-6">
                <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600">
                  Pending ({pendingLeave.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600">
                  Approved ({approvedLeave.length})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600">
                  Rejected ({rejectedLeave.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingLeave.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No pending requests</p>
                ) : (
                  pendingLeave.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{request.agent_name}</h3>
                          <Badge className={getStatusColor(request.status)}>
                            {request.leave_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request)}
                            className="gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Start Date</p>
                          <p className="text-white">{format(new Date(request.start_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">End Date</p>
                          <p className="text-white">{format(new Date(request.end_date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Days</p>
                          <p className="text-white">{request.days_requested} days</p>
                        </div>
                      </div>
                      {request.reason && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <p className="text-slate-400 text-xs mb-1">Reason</p>
                          <p className="text-slate-300 text-sm">{request.reason}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {approvedLeave.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No approved requests</p>
                ) : (
                  approvedLeave.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{request.agent_name}</h3>
                          <Badge className={getStatusColor(request.leave_type)}>
                            {request.leave_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400">Approved</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Period</p>
                          <p className="text-white">
                            {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Days</p>
                          <p className="text-white">{request.days_requested} days</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Approved By</p>
                          <p className="text-white text-xs">{request.reviewed_by || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4">
                {rejectedLeave.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No rejected requests</p>
                ) : (
                  rejectedLeave.map(request => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{request.agent_name}</h3>
                          <Badge className={getStatusColor(request.leave_type)}>
                            {request.leave_type?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>
                      </div>
                      {request.reviewer_notes && (
                        <div className="mt-3 p-3 bg-red-500/10 rounded-lg">
                          <p className="text-red-400 text-xs mb-1">Rejection Reason</p>
                          <p className="text-slate-300 text-sm">{request.reviewer_notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}