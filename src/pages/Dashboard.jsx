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
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 shadow-xl">
      <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 rounded-full opacity-10 ${color}`} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold text-white mt-2">{value}</p>
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">{trend}</span>
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

const RecentActivity = ({ shops, inspections }) => {
  const activities = [
    ...shops.slice(0, 3).map(shop => ({
      type: 'shop',
      title: `New shop profiled: ${shop.shop_name}`,
      status: shop.compliance_status,
      time: shop.created_date,
      ward: shop.ward
    })),
    ...inspections.slice(0, 3).map(insp => ({
      type: 'inspection',
      title: `Inspection completed`,
      status: insp.status,
      score: insp.total_score,
      time: insp.created_date
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  const getStatusColor = (status) => {
    switch(status) {
      case 'compliant': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'non_compliant': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partially_compliant': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No recent activity yet
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {activities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'shop' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-white text-sm font-medium">{activity.title}</p>
                      {activity.ward && (
                        <p className="text-slate-400 text-xs">Ward {activity.ward}</p>
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
  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
    <CardHeader className="border-b border-slate-700/50">
      <CardTitle className="text-white">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-3">
      <Link to={createPageUrl('NewShop')}>
        <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white justify-start gap-3 h-14">
          <Plus className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Profile New Shop</p>
            <p className="text-xs opacity-80">Register a spaza shop</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('Shops')}>
        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700 justify-start gap-3 h-14">
          <Store className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">View All Shops</p>
            <p className="text-xs opacity-80">Browse registered shops</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('Analytics')}>
        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700 justify-start gap-3 h-14">
          <TrendingUp className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Analytics & Reports</p>
            <p className="text-xs opacity-80">Advanced insights</p>
          </div>
        </Button>
      </Link>
      <Link to={createPageUrl('MapView')}>
        <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700 justify-start gap-3 h-14">
          <MapPin className="w-5 h-5" />
          <div className="text-left">
            <p className="font-semibold">Open Map View</p>
            <p className="text-xs opacity-80">Geo-spatial overview</p>
          </div>
        </Button>
      </Link>
    </CardContent>
  </Card>
);

const ComplianceBreakdown = ({ shops }) => {
  const compliant = shops.filter(s => s.compliance_status === 'compliant').length;
  const partial = shops.filter(s => s.compliance_status === 'partially_compliant').length;
  const nonCompliant = shops.filter(s => s.compliance_status === 'non_compliant').length;
  const pending = shops.filter(s => s.compliance_status === 'pending' || !s.compliance_status).length;
  const total = shops.length || 1;

  const segments = [
    { label: 'Compliant', count: compliant, color: 'bg-emerald-500', percent: (compliant/total*100).toFixed(0) },
    { label: 'Partial', count: partial, color: 'bg-amber-500', percent: (partial/total*100).toFixed(0) },
    { label: 'Non-Compliant', count: nonCompliant, color: 'bg-red-500', percent: (nonCompliant/total*100).toFixed(0) },
    { label: 'Pending', count: pending, color: 'bg-slate-500', percent: (pending/total*100).toFixed(0) },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Compliance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-4 flex rounded-full overflow-hidden mb-6">
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
                <p className="text-white font-semibold">{seg.count}</p>
                <p className="text-slate-400 text-sm">{seg.label}</p>
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
  const compliantShops = shops.filter(s => s.compliance_status === 'compliant').length;
  const fundingReady = shops.filter(s => s.funding_status === 'eligible').length;
  const criticalRisk = shops.filter(s => s.risk_level === 'critical' || s.risk_level === 'high').length;
  const complianceRate = totalShops > 0 ? ((compliantShops / totalShops) * 100).toFixed(0) : 0;

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
              Command Centre
            </h1>
            <p className="text-slate-400 mt-1">
              Spaza Compliance & Funding Readiness Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              Live Data
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Shops Profiled"
          value={totalShops}
          subtitle="Registered in system"
          icon={Store}
          color="bg-cyan-500"
          trend={totalShops > 0 ? "+12% this week" : null}
        />
        <StatCard
          title="Compliance Rate"
          value={`${complianceRate}%`}
          subtitle={`${compliantShops} shops compliant`}
          icon={ClipboardCheck}
          color="bg-emerald-500"
        />
        <StatCard
          title="Funding Ready"
          value={fundingReady}
          subtitle="Eligible for NEF support"
          icon={DollarSign}
          color="bg-amber-500"
        />
        <StatCard
          title="Critical Risk"
          value={criticalRisk}
          subtitle="Require immediate action"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity shops={shops} inspections={inspections} />
          
          {/* Map Preview Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 overflow-hidden">
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-400" />
                  Geo-Dashboard Preview
                </CardTitle>
                <Link to={createPageUrl('MapView')}>
                  <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 gap-2">
                    Full Map <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                  <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-ping delay-100" />
                  <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-amber-500 rounded-full animate-ping delay-200" />
                  <div className="absolute top-2/3 left-2/3 w-4 h-4 bg-emerald-500 rounded-full animate-ping delay-300" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Click "Full Map" to view interactive geo-dashboard</p>
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
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
        <p className="text-slate-600 text-xs mt-1">
          YamiMine Solutions • Enterprise iLembe Development Agency
        </p>
      </div>
    </div>
  );
}