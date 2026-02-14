import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Store,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  BarChart3,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${color} bg-opacity-20`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function SuperDashboard() {
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 500)
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 100)
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 500)
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 500)
  });

  const { data: leave = [] } = useQuery({
    queryKey: ['leave'],
    queryFn: () => base44.entities.Leave.list('-created_date', 200)
  });

  // Filter by municipality
  const filteredShops = selectedMunicipality === 'all' 
    ? shops 
    : shops.filter(s => s.municipality === selectedMunicipality);

  // Calculate metrics
  const activeAgents = agents.filter(a => a.employment_status === 'active').length;
  const todayAttendance = attendance.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const checkedIn = todayAttendance.filter(a => a.status === 'checked_in').length;
  const pendingLeave = leave.filter(l => l.status === 'pending').length;
  
  const totalShopsProfiled = attendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
  const totalInspections = attendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);
  const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);

  const compliantShops = filteredShops.filter(s => s.compliance_status === 'compliant').length;
  const complianceRate = filteredShops.length > 0 ? ((compliant Shops / filteredShops.length) * 100).toFixed(0) : 0;
  const criticalRisk = filteredShops.filter(s => s.risk_level === 'critical' || s.risk_level === 'high').length;

  // Chart data - last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayAttendance = attendance.filter(a => a.date === date);
    const dayInspections = inspections.filter(i => i.created_date?.startsWith(date));
    
    return {
      date: format(subDays(new Date(), 6 - i), 'MMM dd'),
      shops: dayAttendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0),
      inspections: dayInspections.length,
      agents: dayAttendance.length
    };
  });

  // Department breakdown
  const municipalities = ['KwaDukuza', 'Mandeni', 'Ndwedwe', 'Maphumulo'];
  const departmentData = municipalities.map(mun => {
    const munShops = shops.filter(s => s.municipality === mun);
    const munAgents = agents.filter(a => a.municipality === mun);
    return {
      name: mun,
      shops: munShops.length,
      agents: munAgents.length,
      compliant: munShops.filter(s => s.compliance_status === 'compliant').length
    };
  });

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
              Super Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Comprehensive Operations Overview</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
              <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Municipalities</SelectItem>
                {municipalities.map(mun => (
                  <SelectItem key={mun} value={mun}>{mun}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              Live Data
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Agents"
          value={activeAgents}
          subtitle={`${checkedIn} checked in today`}
          icon={Users}
          color="bg-cyan-500"
        />
        <StatCard
          title="Total Shops"
          value={filteredShops.length}
          subtitle={`${compliantShops} compliant`}
          icon={Store}
          color="bg-emerald-500"
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          subtitle={`${criticalRisk} critical risk`}
          icon={CheckCircle2}
          color="bg-amber-500"
        />
        <StatCard
          title="Pending Leave"
          value={pendingLeave}
          subtitle="Require approval"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Trend */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              7-Day Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorShops" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="shops" stroke="#06b6d4" fillOpacity={1} fill="url(#colorShops)" />
                <Area type="monotone" dataKey="inspections" stroke="#10b981" fillOpacity={1} fill="url(#colorInspections)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="shops" fill="#06b6d4" />
                <Bar dataKey="compliant" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to={createPageUrl('HRDashboard')}>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-cyan-500/50 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">HR Management</h3>
                  <p className="text-slate-400 text-sm">View agents & attendance</p>
                </div>
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ShiftManagement')}>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-emerald-500/50 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">Shift Management</h3>
                  <p className="text-slate-400 text-sm">Schedule & assign shifts</p>
                </div>
                <Calendar className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Analytics')}>
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-amber-500/50 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold mb-1">Analytics</h3>
                  <p className="text-slate-400 text-sm">Detailed reports</p>
                </div>
                <BarChart3 className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}