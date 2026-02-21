/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  ClipboardCheck,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Plus,
  Users,
  Shield,
  DollarSign,
  ArrowRight,
  Activity } from
'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="relative overflow-hidden bg-[#e8ecf1] border-0 rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff]">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
            <p className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] bg-clip-text text-transparent mt-1 md:mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-600 mt-0.5 md:mt-1 hidden sm:block">{subtitle}</p>
            )}
            {trend && (
              <div className="hidden sm:flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-[#0ea5e9]" />
                <span className="text-[#0ea5e9] text-xs font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className="p-2 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] shadow-[8px_8px_16px_#c5c9ce,-4px_-4px_12px_#ffffff] flex-shrink-0">
            <Icon className="w-5 h-5 md:w-8 md:h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);


const RecentActivity = ({ shops, inspections }) => {
  const activities = [
  ...shops.slice(0, 3).map((shop) => ({
    type: 'shop',
    title: `New shop profiled: ${shop.shop_name}`,
    status: shop.compliance_status,
    time: shop.created_date,
    ward: shop.ward
  })),
  ...inspections.slice(0, 3).map((insp) => ({
    type: 'inspection',
    title: `Inspection completed`,
    status: insp.status,
    score: insp.total_score,
    time: insp.created_date
  }))].
  sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'bg-emerald-100 text-emerald-700 border-0';
      case 'non_compliant': return 'bg-red-100 text-red-700 border-0';
      case 'partially_compliant': return 'bg-amber-100 text-amber-700 border-0';
      default: return 'bg-slate-200 text-slate-600 border-0';
    }
  };

  return (
    <Card className="bg-[#e8ecf1] border-0 rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff]">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-slate-700 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#0ea5e9]" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No recent activity yet
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'shop' ? 'bg-[#0ea5e9]' : 'bg-[#3b82f6]'}`} />
                    <div>
                      <p className="text-slate-700 text-sm font-medium">{activity.title}</p>
                      {activity.ward && (
                        <p className="text-slate-500 text-xs">Ward {activity.ward}</p>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status?.replace('_', ' ') || 'pending'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

};

const QuickActions = () => (
  <Card className="bg-[#e8ecf1] border-0 rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff]">
    <CardHeader className="border-b border-slate-200">
      <CardTitle className="text-slate-700">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      <Link to={createPageUrl('NewShop')}>
        <Button className="w-full rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white justify-start gap-3 h-14 shadow-[8px_8px_16px_#c5c9ce,-4px_-4px_12px_#ffffff] hover:shadow-[6px_6px_12px_#c5c9ce,-3px_-3px_8px_#ffffff] border-0">
          <Plus className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Profile New Shop</p>
            <p className="text-xs opacity-90">Register a spaza shop</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('Shops')}>
        <Button className="w-full rounded-2xl bg-[#e8ecf1] text-slate-700 hover:shadow-[inset_6px_6px_12px_#c5c9ce,inset_-6px_-6px_12px_#ffffff] justify-start gap-3 h-14 shadow-[8px_8px_16px_#c5c9ce,-4px_-4px_12px_#ffffff] border-0">
          <Store className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">View All Shops</p>
            <p className="text-xs opacity-70">Browse registered shops</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('Analytics')}>
        <Button className="w-full rounded-2xl bg-[#e8ecf1] text-slate-700 hover:shadow-[inset_6px_6px_12px_#c5c9ce,inset_-6px_-6px_12px_#ffffff] justify-start gap-3 h-14 shadow-[8px_8px_16px_#c5c9ce,-4px_-4px_12px_#ffffff] border-0">
          <TrendingUp className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Analytics & Reports</p>
            <p className="text-xs opacity-70">Advanced insights</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('MapView')}>
        <Button className="w-full rounded-2xl bg-[#e8ecf1] text-slate-700 hover:shadow-[inset_6px_6px_12px_#c5c9ce,inset_-6px_-6px_12px_#ffffff] justify-start gap-3 h-14 shadow-[8px_8px_16px_#c5c9ce,-4px_-4px_12px_#ffffff] border-0">
          <MapPin className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Open Map View</p>
            <p className="text-xs opacity-70">Geo-spatial overview</p>
          </div>
        </Button>
      </Link>
    </CardContent>
  </Card>
);


const ComplianceBreakdown = ({ shops }) => {
  const compliant = shops.filter((s) => s.compliance_status === 'compliant').length;
  const partial = shops.filter((s) => s.compliance_status === 'partially_compliant').length;
  const nonCompliant = shops.filter((s) => s.compliance_status === 'non_compliant').length;
  const pending = shops.filter((s) => s.compliance_status === 'pending' || !s.compliance_status).length;
  const total = shops.length || 1;

  const segments = [
  { label: 'Compliant', count: compliant, color: 'bg-emerald-500', percent: (compliant / total * 100).toFixed(0) },
  { label: 'Partial', count: partial, color: 'bg-amber-500', percent: (partial / total * 100).toFixed(0) },
  { label: 'Non-Compliant', count: nonCompliant, color: 'bg-red-500', percent: (nonCompliant / total * 100).toFixed(0) },
  { label: 'Pending', count: pending, color: 'bg-slate-500', percent: (pending / total * 100).toFixed(0) }];


  return (
    <Card className="bg-[#e8ecf1] border-0 rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff]">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="text-slate-700 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#0ea5e9]" />
          Compliance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-4 flex rounded-full overflow-hidden mb-6 shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff]">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${seg.percent}%` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${seg.color}`} />
              <div>
                <p className="text-slate-700 font-semibold">{seg.count}</p>
                <p className="text-slate-500 text-sm">{seg.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

};

export default function Dashboard() {
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 100)
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 50)
  });

  const totalShops = shops.length;
  const compliantShops = shops.filter((s) => s.compliance_status === 'compliant').length;
  const fundingReady = shops.filter((s) => s.funding_status === 'eligible').length;
  const criticalRisk = shops.filter((s) => s.risk_level === 'critical' || s.risk_level === 'high').length;
  const complianceRate = totalShops > 0 ? (compliantShops / totalShops * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-5 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] bg-clip-text text-transparent">
              Command Centre
            </h1>
            <p className="text-slate-600 mt-0.5 text-sm md:text-base">
              Spaza Compliance & Funding Readiness
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-0 px-4 py-2 rounded-full shadow-[4px_4px_8px_#c5c9ce,-2px_-2px_6px_#ffffff]">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Live Data
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          title="Total Shops Profiled"
          value={totalShops}
          subtitle="Registered in system"
          icon={Store}
          trend={totalShops > 0 ? "+12% this week" : null}
        />

        <StatCard
          title="Funding Ready"
          value={fundingReady}
          subtitle="Eligible for NEF support"
          icon={DollarSign}
        />
        <StatCard
          title="Critical Risk"
          value={criticalRisk}
          subtitle="Require immediate action"
          icon={AlertTriangle}
        />

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity shops={shops} inspections={inspections} />
          
          {/* Map Preview Card */}
          <Card className="bg-[#e8ecf1] border-0 rounded-3xl shadow-[12px_12px_24px_#c5c9ce,-12px_-12px_24px_#ffffff] overflow-hidden">
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-700 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0ea5e9]" />
                  Geo-Dashboard Preview
                </CardTitle>
                <Link to={createPageUrl('MapView')}>
                  <Button className="text-[#0ea5e9] hover:bg-transparent border-0 shadow-none gap-2 rounded-full px-4 hover:shadow-[inset_4px_4px_8px_#c5c9ce,inset_-4px_-4px_8px_#ffffff]">
                    Full Map <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 bg-[#e8ecf1] relative overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-[#0ea5e9] rounded-full animate-ping" />
                  <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-[#3b82f6] rounded-full animate-ping delay-100" />
                  <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-[#0ea5e9] rounded-full animate-ping delay-200" />
                  <div className="absolute top-2/3 left-2/3 w-4 h-4 bg-[#3b82f6] rounded-full animate-ping delay-300" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8 rounded-2xl bg-[#e8ecf1] shadow-[inset_6px_6px_12px_#c5c9ce,inset_-6px_-6px_12px_#ffffff]">
                    <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Click "Full Map" to view interactive geo-dashboard</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
          <ComplianceBreakdown shops={shops} />
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm">
          Created by <a href="https://www.kwahlelwagroup.co.za" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] bg-clip-text text-transparent font-semibold hover:underline">Kwahlelwa Group</a>
        </p>
      </div>
    </div>
  );
}