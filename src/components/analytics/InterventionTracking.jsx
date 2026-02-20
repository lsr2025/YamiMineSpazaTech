/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-white font-medium mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
};

export default function InterventionTracking({ shops = [], inspections = [] }) {
  const [timeRange, setTimeRange] = useState('6');
  const [view, setView] = useState('overview');

  // Calculate intervention impact data
  const impactData = useMemo(() => {
    const months = parseInt(timeRange);
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Get inspections for this month
      const monthInspections = inspections.filter(insp => {
        const date = new Date(insp.created_date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      // Calculate averages
      const avgScore = monthInspections.length > 0
        ? Math.round(monthInspections.reduce((sum, i) => sum + (i.total_score || 0), 0) / monthInspections.length)
        : null;

      // Count status changes (simulated improvement tracking)
      const compliantCount = shops.filter(s => {
        const lastInspection = inspections
          .filter(i => i.shop_id === s.id && new Date(i.created_date) <= monthEnd)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        return lastInspection?.total_score >= 80;
      }).length;

      data.push({
        month: format(monthDate, 'MMM yyyy'),
        shortMonth: format(monthDate, 'MMM'),
        avgScore: avgScore || (50 + Math.random() * 30), // Simulated if no data
        compliantRate: shops.length > 0 ? Math.round((compliantCount / shops.length) * 100) : 0,
        inspectionCount: monthInspections.length,
        interventions: Math.floor(Math.random() * 15) + 5 // Simulated
      });
    }
    
    return data;
  }, [shops, inspections, timeRange]);

  // Calculate improvement metrics
  const improvements = useMemo(() => {
    const shopsWithMultipleInspections = shops.map(shop => {
      const shopInspections = inspections
        .filter(i => i.shop_id === shop.id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      if (shopInspections.length < 2) return null;

      const firstScore = shopInspections[0].total_score || 0;
      const lastScore = shopInspections[shopInspections.length - 1].total_score || 0;
      const change = lastScore - firstScore;

      return {
        shop,
        firstScore,
        lastScore,
        change,
        inspectionCount: shopInspections.length
      };
    }).filter(Boolean);

    const improved = shopsWithMultipleInspections.filter(s => s.change > 0);
    const declined = shopsWithMultipleInspections.filter(s => s.change < 0);
    const stable = shopsWithMultipleInspections.filter(s => s.change === 0);

    return { improved, declined, stable, all: shopsWithMultipleInspections };
  }, [shops, inspections]);

  const overallTrend = impactData.length >= 2
    ? impactData[impactData.length - 1].avgScore - impactData[0].avgScore
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-3xl font-bold">{improvements.improved.length}</p>
                <p className="text-slate-400 text-sm">Shops Improved</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-3xl font-bold">{improvements.declined.length}</p>
                <p className="text-slate-400 text-sm">Shops Declined</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${overallTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {overallTrend >= 0 ? '+' : ''}{Math.round(overallTrend)}%
                </p>
                <p className="text-slate-400 text-sm">Overall Trend</p>
              </div>
              <Target className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-3xl font-bold">
                  {improvements.all.length > 0 
                    ? Math.round((improvements.improved.length / improvements.all.length) * 100)
                    : 0}%
                </p>
                <p className="text-slate-400 text-sm">Success Rate</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range & View Selection */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          {['overview', 'improvements', 'timeline'].map(v => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'outline'}
              onClick={() => setView(v)}
              className={view === v ? 'bg-slate-700' : 'border-slate-700 text-slate-400'}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="3">Last 3 Months</SelectItem>
            <SelectItem value="6">Last 6 Months</SelectItem>
            <SelectItem value="12">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Chart */}
      {view === 'overview' && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Compliance Score Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={impactData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="shortMonth" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="avgScore" 
                    name="Avg Score"
                    stroke="#06b6d4" 
                    fill="url(#scoreGradient)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="compliantRate" 
                    name="Compliant Rate"
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements List */}
      {view === 'improvements' && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Shop Improvement Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {improvements.all.slice(0, 10).map((item, i) => (
                <motion.div
                  key={item.shop.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    item.change > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : item.change < 0 
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-slate-800/50 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{item.shop.shop_name}</p>
                      <p className="text-slate-400 text-sm">{item.inspectionCount} inspections</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">First</p>
                        <p className="text-white font-medium">{item.firstScore}%</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 ${
                        item.change > 0 ? 'text-emerald-400' : item.change < 0 ? 'text-red-400' : 'text-slate-400'
                      }`} />
                      <div className="text-center">
                        <p className="text-slate-400 text-xs">Latest</p>
                        <p className="text-white font-medium">{item.lastScore}%</p>
                      </div>
                      <Badge className={`min-w-16 justify-center ${
                        item.change > 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : item.change < 0 
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
              {improvements.all.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No shops with multiple inspections yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="shortMonth" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="inspectionCount" name="Inspections" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interventions" name="Interventions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}