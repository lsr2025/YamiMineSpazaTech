import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Award,
  Star,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AgentCard = ({ agent, rank }) => {
  const getRankBadge = () => {
    if (rank === 1) return { color: 'bg-yellow-500', label: '🥇 Top Performer' };
    if (rank === 2) return { color: 'bg-slate-400', label: '🥈 Excellent' };
    if (rank === 3) return { color: 'bg-amber-600', label: '🥉 Great' };
    return null;
  };

  const rankBadge = getRankBadge();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
    >
      <Card className="bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {agent.name?.[0] || 'A'}
                </span>
              </div>
              {rank <= 3 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-sm">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-semibold">{agent.name || 'Unknown Agent'}</h4>
                {rankBadge && (
                  <Badge className={`${rankBadge.color} text-white text-xs`}>
                    {rankBadge.label}
                  </Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm mb-3">{agent.email}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-cyan-400">{agent.inspectionCount}</p>
                  <p className="text-slate-400 text-xs">Inspections</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                  <p className={`text-2xl font-bold ${
                    agent.avgComplianceRate >= 80 ? 'text-emerald-400' :
                    agent.avgComplianceRate >= 60 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {agent.avgComplianceRate}%
                  </p>
                  <p className="text-slate-400 text-xs">Avg Score</p>
                </div>
                <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-400">{agent.shopsProfiled}</p>
                  <p className="text-slate-400 text-xs">Shops</p>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Performance Score</span>
                  <span className="text-white font-medium">{agent.performanceScore}/100</span>
                </div>
                <Progress 
                  value={agent.performanceScore} 
                  className="h-2 bg-slate-700"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-cyan-400 text-sm">
          {payload[0].value} inspections
        </p>
      </div>
    );
  }
  return null;
};

export default function AgentPerformance({ shops, inspections }) {
  const [timeRange, setTimeRange] = useState('all');
  const [sortBy, setSortBy] = useState('inspections');

  const agentStats = useMemo(() => {
    const agentMap = {};

    // Collect inspection data by agent
    inspections.forEach(insp => {
      const email = insp.inspector_email || insp.created_by;
      if (!email) return;

      if (!agentMap[email]) {
        agentMap[email] = {
          email,
          name: insp.inspector_name || email.split('@')[0],
          inspections: [],
          shopIds: new Set()
        };
      }
      
      agentMap[email].inspections.push(insp);
      if (insp.shop_id) agentMap[email].shopIds.add(insp.shop_id);
    });

    // Also track shop profiles by creator
    shops.forEach(shop => {
      const email = shop.created_by;
      if (!email) return;

      if (!agentMap[email]) {
        agentMap[email] = {
          email,
          name: email.split('@')[0],
          inspections: [],
          shopIds: new Set()
        };
      }
      
      agentMap[email].shopIds.add(shop.id);
    });

    // Calculate stats
    return Object.values(agentMap).map(agent => {
      const scores = agent.inspections
        .filter(i => i.total_score !== null && i.total_score !== undefined)
        .map(i => i.total_score);
      
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const completedInspections = agent.inspections.filter(i => i.status === 'completed').length;
      
      // Performance score calculation
      const performanceScore = Math.min(100, Math.round(
        (agent.inspections.length * 10) + 
        (avgScore * 0.5) + 
        (agent.shopIds.size * 5)
      ));

      return {
        ...agent,
        inspectionCount: agent.inspections.length,
        completedCount: completedInspections,
        avgComplianceRate: avgScore,
        shopsProfiled: agent.shopIds.size,
        performanceScore
      };
    });
  }, [shops, inspections]);

  const sortedAgents = useMemo(() => {
    const sorted = [...agentStats];
    
    switch(sortBy) {
      case 'inspections':
        sorted.sort((a, b) => b.inspectionCount - a.inspectionCount);
        break;
      case 'compliance':
        sorted.sort((a, b) => b.avgComplianceRate - a.avgComplianceRate);
        break;
      case 'performance':
        sorted.sort((a, b) => b.performanceScore - a.performanceScore);
        break;
      case 'shops':
        sorted.sort((a, b) => b.shopsProfiled - a.shopsProfiled);
        break;
    }
    
    return sorted;
  }, [agentStats, sortBy]);

  const chartData = useMemo(() => {
    return sortedAgents.slice(0, 10).map(agent => ({
      name: agent.name?.split(' ')[0] || 'Unknown',
      inspections: agent.inspectionCount,
      score: agent.avgComplianceRate
    }));
  }, [sortedAgents]);

  const totalStats = useMemo(() => ({
    totalInspections: inspections.length,
    avgTeamScore: agentStats.length > 0 
      ? Math.round(agentStats.reduce((sum, a) => sum + a.avgComplianceRate, 0) / agentStats.length)
      : 0,
    totalAgents: agentStats.length,
    totalShopsProfiled: shops.length
  }), [agentStats, inspections, shops]);

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Field Agent Performance
          </CardTitle>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="inspections">By Inspections</SelectItem>
                <SelectItem value="compliance">By Compliance</SelectItem>
                <SelectItem value="performance">By Performance</SelectItem>
                <SelectItem value="shops">By Shops</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Team Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-center">
            <ClipboardCheck className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalStats.totalInspections}</p>
            <p className="text-slate-400 text-sm">Total Inspections</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalStats.avgTeamScore}%</p>
            <p className="text-slate-400 text-sm">Avg Team Score</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
            <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalStats.totalAgents}</p>
            <p className="text-slate-400 text-sm">Active Agents</p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <Award className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalStats.totalShopsProfiled}</p>
            <p className="text-slate-400 text-sm">Shops Profiled</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Inspections by Agent
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="inspections" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#06b6d4'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Agent Leaderboard */}
        <div>
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Agent Leaderboard
          </h4>
          {sortedAgents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No agent data available yet</p>
              <p className="text-sm">Complete inspections to see performance metrics</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAgents.slice(0, 5).map((agent, index) => (
                <AgentCard key={agent.email} agent={agent} rank={index + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Performance Metrics Legend */}
        <div className="p-4 bg-slate-800/30 rounded-xl">
          <h5 className="text-slate-400 text-sm font-medium mb-2">Performance Score Calculation</h5>
          <div className="text-xs text-slate-500 space-y-1">
            <p>• 10 points per completed inspection</p>
            <p>• 0.5 × average compliance score achieved</p>
            <p>• 5 points per unique shop profiled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}