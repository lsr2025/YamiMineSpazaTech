import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Download,
  Users,
  BarChart3
} from 'lucide-react';

import ComplianceTrendChart from '../components/analytics/ComplianceTrendChart';
import RiskHeatmap from '../components/analytics/RiskHeatmap';
import DataExport from '../components/analytics/DataExport';
import AgentPerformance from '../components/analytics/AgentPerformance';

export default function Analytics() {
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 500)
  });

  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 500)
  });

  const isLoading = shopsLoading || inspectionsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              Advanced Analytics
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Comprehensive reporting for compliance monitoring and funding readiness
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading analytics data...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-1 h-auto p-1">
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-cyan-700 gap-2 py-3"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">Compliance</span> Trends
            </TabsTrigger>
            <TabsTrigger 
              value="risks" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 gap-2 py-3"
            >
              <AlertTriangle className="w-4 h-4" />
              Risk <span className="hidden md:inline">Heatmap</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agents" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-700 gap-2 py-3"
            >
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Agent</span> Performance
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 gap-2 py-3"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Data</span> Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <ComplianceTrendChart shops={shops} inspections={inspections} />
            
            {/* Quick Stats Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl">
                <p className="text-slate-400 text-sm">Total Shops</p>
                <p className="text-3xl font-bold text-white mt-1">{shops.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl">
                <p className="text-slate-400 text-sm">Total Inspections</p>
                <p className="text-3xl font-bold text-cyan-400 mt-1">{inspections.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl">
                <p className="text-slate-400 text-sm">Funding Eligible</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {shops.filter(s => s.funding_status === 'eligible').length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-xl">
                <p className="text-slate-400 text-sm">Avg Compliance</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  {shops.length > 0 
                    ? Math.round(shops.filter(s => s.compliance_score).reduce((sum, s) => sum + (s.compliance_score || 0), 0) / 
                        shops.filter(s => s.compliance_score).length || 1)
                    : 0}%
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risks">
            <RiskHeatmap shops={shops} inspections={inspections} />
          </TabsContent>

          <TabsContent value="agents">
            <AgentPerformance shops={shops} inspections={inspections} />
          </TabsContent>

          <TabsContent value="export">
            <DataExport shops={shops} inspections={inspections} />
          </TabsContent>
        </Tabs>
      )}

      {/* Footer */}
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