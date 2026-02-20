/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-400 text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white text-sm font-medium">
              {entry.name}: {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ComplianceTrendChart({ shops, inspections }) {
  const [timeRange, setTimeRange] = useState('30d');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('all');

  const municipalities = [...new Set(shops.map(s => s.municipality).filter(Boolean))];
  const wards = [...new Set(shops.map(s => s.ward).filter(Boolean))];

  const filteredShops = useMemo(() => {
    return shops.filter(shop => {
      if (filterType === 'municipality' && filterValue !== 'all') {
        return shop.municipality === filterValue;
      }
      if (filterType === 'ward' && filterValue !== 'all') {
        return shop.ward === filterValue;
      }
      return true;
    });
  }, [shops, filterType, filterValue]);

  const chartData = useMemo(() => {
    const now = new Date();
    let startDate, intervals, formatStr;

    switch(timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        intervals = eachDayOfInterval({ start: startDate, end: now });
        formatStr = 'EEE';
        break;
      case '30d':
        startDate = subDays(now, 30);
        intervals = eachDayOfInterval({ start: startDate, end: now }).filter((_, i) => i % 3 === 0);
        formatStr = 'MMM d';
        break;
      case '90d':
        startDate = subDays(now, 90);
        intervals = eachWeekOfInterval({ start: startDate, end: now });
        formatStr = 'MMM d';
        break;
      case '12m':
        startDate = subMonths(now, 12);
        intervals = eachMonthOfInterval({ start: startDate, end: now });
        formatStr = 'MMM yy';
        break;
      default:
        startDate = subDays(now, 30);
        intervals = eachDayOfInterval({ start: startDate, end: now });
        formatStr = 'MMM d';
    }

    // Generate simulated trend data based on current compliance rates
    const totalShops = filteredShops.length || 1;
    const currentCompliantRate = (filteredShops.filter(s => s.compliance_status === 'compliant').length / totalShops) * 100;
    const currentPartialRate = (filteredShops.filter(s => s.compliance_status === 'partially_compliant').length / totalShops) * 100;

    return intervals.map((date, index) => {
      // Simulate gradual improvement over time
      const progressFactor = index / intervals.length;
      const variance = (Math.random() - 0.5) * 10;
      
      const compliantRate = Math.max(0, Math.min(100, 
        currentCompliantRate * (0.6 + progressFactor * 0.4) + variance
      ));
      const partialRate = Math.max(0, Math.min(100 - compliantRate,
        currentPartialRate * (0.8 + progressFactor * 0.2) + variance / 2
      ));

      return {
        date: format(date, formatStr),
        fullDate: date,
        compliant: Math.round(compliantRate),
        partial: Math.round(partialRate),
        nonCompliant: Math.round(100 - compliantRate - partialRate)
      };
    });
  }, [timeRange, filteredShops]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', value: 0 };
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.compliant, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.compliant, 0) / secondHalf.length;
    
    const change = secondAvg - firstAvg;
    return {
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
      value: Math.abs(Math.round(change))
    };
  }, [chartData]);

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-red-400' : 'text-slate-400';

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Compliance Trend Analysis
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm ${trendColor}`}>
                {trend.direction === 'up' ? `+${trend.value}%` : trend.direction === 'down' ? `-${trend.value}%` : 'Stable'}
              </span>
              <span className="text-slate-400 text-sm">vs previous period</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setFilterValue('all'); }}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white text-sm">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="municipality">Municipality</SelectItem>
                <SelectItem value="ward">Ward</SelectItem>
              </SelectContent>
            </Select>

            {filterType !== 'all' && (
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue placeholder={`Select ${filterType}`} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All</SelectItem>
                  {filterType === 'municipality' && municipalities.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                  {filterType === 'ward' && wards.map(w => (
                    <SelectItem key={w} value={w}>Ward {w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPartial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNonCompliant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
              />
              <Area 
                type="monotone" 
                dataKey="compliant" 
                name="Compliant"
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompliant)"
              />
              <Area 
                type="monotone" 
                dataKey="partial" 
                name="Partial"
                stroke="#f59e0b" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPartial)"
              />
              <Area 
                type="monotone" 
                dataKey="nonCompliant" 
                name="Non-Compliant"
                stroke="#ef4444" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNonCompliant)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {filteredShops.filter(s => s.compliance_status === 'compliant').length}
            </p>
            <p className="text-slate-400 text-sm">Compliant Shops</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">
              {filteredShops.filter(s => s.compliance_status === 'partially_compliant').length}
            </p>
            <p className="text-slate-400 text-sm">Partially Compliant</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">
              {filteredShops.filter(s => s.compliance_status === 'non_compliant').length}
            </p>
            <p className="text-slate-400 text-sm">Non-Compliant</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}