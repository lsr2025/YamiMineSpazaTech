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
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-slate-400 text-sm">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function TaskMonitoring() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ supervisor_email: user.email }, '-created_date', 500);
    },
    enabled: !!user?.email
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Team.filter({ supervisor_email: user.email });
    },
    enabled: !!user?.email
  });

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterTeam !== 'all' && task.assigned_team_id !== filterTeam) return false;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'pending').length;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;

  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'in_progress': return 'bg-cyan-500/20 text-cyan-400';
      case 'assigned': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Task Monitoring Dashboard</h1>
          <p className="text-slate-400 text-sm">Real-time task progress and team performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Users} label="Total Tasks" value={totalTasks} color="bg-cyan-500" />
          <StatCard icon={CheckCircle2} label="Completed" value={completedTasks} color="bg-emerald-500" />
          <StatCard icon={TrendingUp} label="In Progress" value={inProgressTasks} color="bg-blue-500" />
          <StatCard icon={Clock} label="Pending" value={pendingTasks} color="bg-amber-500" />
          <StatCard icon={AlertCircle} label="Overdue" value={overdueTasks} color="bg-red-500" />
        </div>

        {/* Completion Rate */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Overall Completion Rate</h3>
              <span className="text-white text-2xl font-bold">{completionRate}%</span>
            </div>
            <Progress value={parseInt(completionRate)} className="h-3" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tasks List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{task.task_title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status?.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned To</span>
                      <span className="text-white">{task.assigned_team_name || task.assigned_agent_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location</span>
                      <span className="text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {task.municipality} {task.ward && `- Ward ${task.ward}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Due Date</span>
                      <span className={`${task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' ? 'text-red-400' : 'text-white'}`}>
                        {task.due_date || 'Not set'}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white font-semibold">{task.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={task.progress_percentage || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No tasks match the selected filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}