import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Search,
  Plus,
  BookOpen,
  Target,
  Award,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AgentCard = ({ agent, attendance }) => {
  const todayAttendance = attendance.find(a => 
    a.agent_email === agent.user_email && 
    a.date === new Date().toISOString().split('T')[0]
  );

  const getStatusBadge = () => {
    if (!todayAttendance) {
      return <Badge className="bg-slate-500/20 text-slate-400">Not Checked In</Badge>;
    }
    if (todayAttendance.status === 'checked_out') {
      return <Badge className="bg-blue-500/20 text-blue-400">Checked Out</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={createPageUrl(`AgentProfile?id=${agent.id}`)}>
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-lg">
                  {agent.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{agent.full_name}</h3>
                    <p className="text-slate-400 text-sm">{agent.employee_id}</p>
                  </div>
                  {getStatusBadge()}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <BookOpen className="w-3 h-3" />
                    {agent.education_level || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Award className="w-3 h-3" />
                    {agent.performance_rating || 'N/A'}/5
                  </div>
                </div>
                {todayAttendance && (
                  <div className="mt-2 text-xs text-slate-400">
                    <span className="text-cyan-400">{todayAttendance.shops_profiled || 0}</span> shops • 
                    <span className="text-emerald-400 ml-1">{todayAttendance.inspections_completed || 0}</span> inspections
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default function HRDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 200)
  });

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const checkedIn = todayAttendance.filter(a => a.status === 'checked_in').length;
  const checkedOut = todayAttendance.filter(a => a.status === 'checked_out').length;
  const absent = agents.filter(agent => 
    !todayAttendance.some(a => a.agent_email === agent.user_email)
  ).length;

  const totalHoursToday = todayAttendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);

  const filteredAgents = agents.filter(agent =>
    agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              HR Management
            </h1>
            <p className="text-slate-400 mt-1">Field Agent Performance & Development</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AttendanceTracking')}>
              <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                <Calendar className="w-4 h-4" />
                Track Attendance
              </Button>
            </Link>
            <Link to={createPageUrl('NewAgent')}>
              <Button className="bg-red-600 hover:bg-red-700 gap-2">
                <Plus className="w-4 h-4" />
                Add Agent
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Agents"
          value={agents.length}
          subtitle="Active field agents"
          icon={Users}
          color="bg-cyan-500"
        />
        <StatCard
          title="Checked In Today"
          value={checkedIn}
          subtitle={`${absent} not checked in`}
          icon={UserCheck}
          color="bg-emerald-500"
        />
        <StatCard
          title="Checked Out"
          value={checkedOut}
          subtitle="Completed for today"
          icon={UserX}
          color="bg-blue-500"
        />
        <StatCard
          title="Hours Today"
          value={totalHoursToday.toFixed(1)}
          subtitle="Total hours worked"
          icon={Clock}
          color="bg-amber-500"
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search agents by name or employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(agent => (
          <AgentCard key={agent.id} agent={agent} attendance={attendance} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No agents found</p>
            <p className="text-slate-500 text-sm mt-2">
              {searchQuery ? 'Try a different search term' : 'Add your first field agent to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}