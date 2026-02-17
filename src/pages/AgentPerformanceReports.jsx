import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, CheckCircle, MapPin, Clock, Users } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AgentPerformanceReports() {
  const [timePeriod, setTimePeriod] = useState('30');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');

  const { data: agents = [] } = useQuery({
    queryKey: ['field-agents'],
    queryFn: () => base44.entities.FieldAgent.list('-created_date', 200)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500)
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => base44.entities.Attendance.list('-date', 500)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list('-created_date', 100)
  });

  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 1000)
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 1000)
  });

  const filteredData = useMemo(() => {
    const daysAgo = parseInt(timePeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    let filteredAgents = agents;
    let filteredTasks = tasks.filter(t => new Date(t.created_date) >= cutoffDate);
    let filteredAttendance = attendance.filter(a => new Date(a.date) >= cutoffDate);
    let filteredShops = shops.filter(s => new Date(s.created_date) >= cutoffDate);
    let filteredInspections = inspections.filter(i => new Date(i.created_date) >= cutoffDate);

    if (selectedMunicipality !== 'all') {
      filteredAgents = filteredAgents.filter(a => a.municipality === selectedMunicipality);
      filteredTasks = filteredTasks.filter(t => t.municipality === selectedMunicipality);
      filteredAttendance = filteredAttendance.filter(a => a.municipality === selectedMunicipality);
      filteredShops = filteredShops.filter(s => s.municipality === selectedMunicipality);
    }

    if (selectedTeam !== 'all') {
      const team = teams.find(t => t.id === selectedTeam);
      if (team) {
        const teamEmails = team.team_members?.map(m => m.agent_email) || [];
        filteredAgents = filteredAgents.filter(a => teamEmails.includes(a.user_email));
        filteredTasks = filteredTasks.filter(t => 
          teamEmails.includes(t.assigned_agent_email) || t.assigned_team_id === selectedTeam
        );
        filteredAttendance = filteredAttendance.filter(a => teamEmails.includes(a.agent_email));
      }
    }

    return {
      agents: filteredAgents,
      tasks: filteredTasks,
      attendance: filteredAttendance,
      shops: filteredShops,
      inspections: filteredInspections
    };
  }, [agents, tasks, attendance, shops, inspections, teams, timePeriod, selectedTeam, selectedMunicipality]);

  const performanceMetrics = useMemo(() => {
    const { tasks, attendance, shops, inspections } = filteredData;

    const agentStats = filteredData.agents.map(agent => {
      const agentTasks = tasks.filter(t => t.assigned_agent_email === agent.user_email);
      const agentAttendance = attendance.filter(a => a.agent_email === agent.user_email);
      const agentShops = shops.filter(s => s.created_by === agent.user_email);
      const agentInspections = inspections.filter(i => i.inspector_email === agent.user_email);

      const completedTasks = agentTasks.filter(t => t.status === 'completed');
      const avgCompletionTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => {
            if (t.completion_date && t.start_date) {
              const diff = new Date(t.completion_date) - new Date(t.start_date);
              return sum + diff / (1000 * 60 * 60 * 24);
            }
            return sum;
          }, 0) / completedTasks.length
        : 0;

      const totalHours = agentAttendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
      const totalShopsProfiled = agentAttendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
      const totalInspections = agentAttendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);

      return {
        name: agent.full_name,
        email: agent.user_email,
        tasksCompleted: completedTasks.length,
        avgCompletionTime: avgCompletionTime.toFixed(1),
        shopsProfiled: totalShopsProfiled,
        inspections: totalInspections,
        hoursWorked: totalHours.toFixed(1),
        municipality: agent.municipality
      };
    });

    return agentStats.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
  }, [filteredData]);

  const taskStatusData = useMemo(() => {
    const { tasks } = filteredData;
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count
    }));
  }, [filteredData]);

  const municipalityData = useMemo(() => {
    const { tasks, attendance } = filteredData;
    const municipalities = ['KwaDukuza', 'Mandeni', 'Ndwedwe', 'Maphumulo'];
    
    return municipalities.map(muni => {
      const muniTasks = tasks.filter(t => t.municipality === muni);
      const muniAttendance = attendance.filter(a => a.municipality === muni);
      const shopsProfiled = muniAttendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0);
      const inspections = muniAttendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0);

      return {
        name: muni,
        tasks: muniTasks.length,
        shops: shopsProfiled,
        inspections: inspections
      };
    });
  }, [filteredData]);

  const topPerformers = performanceMetrics.slice(0, 5);

  const totalMetrics = useMemo(() => ({
    totalTasks: filteredData.tasks.length,
    completedTasks: filteredData.tasks.filter(t => t.status === 'completed').length,
    totalShops: filteredData.attendance.reduce((sum, a) => sum + (a.shops_profiled || 0), 0),
    totalInspections: filteredData.attendance.reduce((sum, a) => sum + (a.inspections_completed || 0), 0),
    totalHours: filteredData.attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0)
  }), [filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('HRDashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Performance Reports</h1>
              <p className="text-slate-400 text-sm">Detailed agent and team analytics</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Time Period</label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>{team.team_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Municipality</label>
                <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Municipalities</SelectItem>
                    <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
                    <SelectItem value="Mandeni">Mandeni</SelectItem>
                    <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
                    <SelectItem value="Maphumulo">Maphumulo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Tasks Completed</p>
                  <p className="text-white text-xl font-bold">{totalMetrics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Tasks</p>
                  <p className="text-white text-xl font-bold">{totalMetrics.totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Shops Profiled</p>
                  <p className="text-white text-xl font-bold">{totalMetrics.totalShops}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Inspections</p>
                  <p className="text-white text-xl font-bold">{totalMetrics.totalInspections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Hours</p>
                  <p className="text-white text-xl font-bold">{totalMetrics.totalHours.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Status Chart */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPerformers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Bar dataKey="tasksCompleted" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Agent Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 py-3 px-4">Agent</th>
                        <th className="text-left text-slate-400 py-3 px-4">Tasks</th>
                        <th className="text-left text-slate-400 py-3 px-4">Avg Days</th>
                        <th className="text-left text-slate-400 py-3 px-4">Shops</th>
                        <th className="text-left text-slate-400 py-3 px-4">Inspections</th>
                        <th className="text-left text-slate-400 py-3 px-4">Hours</th>
                        <th className="text-left text-slate-400 py-3 px-4">Municipality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceMetrics.map((agent, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="text-white py-3 px-4 font-medium">{agent.name}</td>
                          <td className="text-cyan-400 py-3 px-4">{agent.tasksCompleted}</td>
                          <td className="text-slate-300 py-3 px-4">{agent.avgCompletionTime}</td>
                          <td className="text-emerald-400 py-3 px-4">{agent.shopsProfiled}</td>
                          <td className="text-purple-400 py-3 px-4">{agent.inspections}</td>
                          <td className="text-amber-400 py-3 px-4">{agent.hoursWorked}</td>
                          <td className="text-slate-300 py-3 px-4">{agent.municipality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Performance by Municipality</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={municipalityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Legend />
                    <Bar dataKey="tasks" fill="#06b6d4" name="Tasks" />
                    <Bar dataKey="shops" fill="#10b981" name="Shops Profiled" />
                    <Bar dataKey="inspections" fill="#8b5cf6" name="Inspections" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}