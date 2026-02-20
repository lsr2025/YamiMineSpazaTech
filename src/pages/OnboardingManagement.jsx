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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function OnboardingManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    agent_email: '',
    start_date: '',
    supervisor_email: '',
    supervisor_name: '',
    district_coordinator_name: '',
    district_coordinator_email: ''
  });

  const districtCoordinators = [
    { name: 'Tholi Ncibane', email: 'tholi.ncibane@yamimine.co.za' },
    { name: 'Dolly', email: 'dolly@yamimine.co.za' },
    { name: 'Queen Soga', email: 'queen.soga@yamimine.co.za' }
  ];

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: onboardingRecords = [] } = useQuery({
    queryKey: ['onboarding-records'],
    queryFn: () => base44.entities.Onboarding.list('-created_date', 100)
  });

  const { data: supervisors = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin' || u.role === 'user');
    }
  });

  const createOnboarding = useMutation({
    mutationFn: async (data) => {
      const agent = agents.find(a => a.user_email === data.agent_email);
      const supervisor = supervisors.find(s => s.email === data.supervisor_email);
      return await base44.entities.Onboarding.create({
        ...data,
        agent_name: agent?.full_name || '',
        supervisor_name: supervisor?.full_name || supervisor?.email || '',
        status: 'not_started',
        progress_percentage: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-records'] });
      setDialogOpen(false);
      setFormData({
        agent_email: '',
        start_date: '',
        supervisor_email: '',
        supervisor_name: '',
        district_coordinator_name: '',
        district_coordinator_email: ''
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createOnboarding.mutate(formData);
  };

  const activeOnboarding = onboardingRecords.filter(o => o.status !== 'completed');
  const completedOnboarding = onboardingRecords.filter(o => o.status === 'completed');

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
              <h1 className="text-2xl font-bold text-white">Onboarding Management</h1>
              <p className="text-slate-400 text-sm">Track new hire onboarding progress</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                <Plus className="w-4 h-4" />
                New Onboarding
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Start New Onboarding</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Select Agent</Label>
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
                  <Label className="text-white">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Assign Supervisor</Label>
                  <Select value={formData.supervisor_email} onValueChange={(v) => setFormData(prev => ({ ...prev, supervisor_email: v }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {supervisors.map(supervisor => (
                        <SelectItem key={supervisor.id} value={supervisor.email}>
                          {supervisor.full_name || supervisor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">District Coordinator</Label>
                  <Select 
                    value={formData.district_coordinator_name} 
                    onValueChange={(v) => {
                      const coordinator = districtCoordinators.find(dc => dc.name === v);
                      setFormData(prev => ({ 
                        ...prev, 
                        district_coordinator_name: v,
                        district_coordinator_email: coordinator?.email || ''
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select coordinator" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {districtCoordinators.map(dc => (
                        <SelectItem key={dc.name} value={dc.name}>
                          {dc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!formData.agent_email || !formData.start_date || createOnboarding.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createOnboarding.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="w-12 h-12 text-amber-400" />
                <div>
                  <p className="text-3xl font-bold text-white">{activeOnboarding.length}</p>
                  <p className="text-slate-400">Active Onboarding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                <div>
                  <p className="text-3xl font-bold text-white">{completedOnboarding.length}</p>
                  <p className="text-slate-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Onboarding */}
        <div className="mb-8">
          <h2 className="text-white font-semibold mb-4">Active Onboarding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOnboarding.length === 0 ? (
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 col-span-2">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No active onboarding</p>
                </CardContent>
              </Card>
            ) : (
              activeOnboarding.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(`OnboardingChecklist?id=${record.id}`)}>
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-white font-semibold mb-1">{record.agent_name}</h3>
                            <p className="text-slate-400 text-sm">
                              Started: {format(new Date(record.start_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge className={
                            record.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {record.status?.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm">Progress</span>
                            <span className="text-white font-semibold">{record.progress_percentage}%</span>
                          </div>
                          <Progress value={record.progress_percentage} className="h-2" />
                        </div>

                        {record.supervisor_email && (
                          <p className="text-slate-500 text-xs">
                            Supervisor: {record.supervisor_email}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Completed Onboarding */}
        {completedOnboarding.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-4">Completed Onboarding</h2>
            <div className="space-y-3">
              {completedOnboarding.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{record.agent_name}</p>
                          <p className="text-slate-400 text-sm">
                            Completed: {format(new Date(record.completion_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
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