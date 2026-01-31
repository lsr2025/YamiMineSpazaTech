import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Bug, Thermometer, Droplets, Package, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskCategory = ({ label, icon: Icon, count, total, color, details }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className={`p-4 rounded-xl border ${color.border} ${color.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color.icon}`} />
          <span className="text-white font-medium">{label}</span>
        </div>
        <Badge className={`${color.badge}`}>
          {count} failures
        </Badge>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color.bar}`}
        />
      </div>
      <p className="text-slate-400 text-sm">{percentage}% failure rate</p>
      {details && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs">{details}</p>
        </div>
      )}
    </div>
  );
};

const AreaHeatmapCell = ({ area, riskScore, shopCount, onClick, isSelected }) => {
  const getHeatColor = () => {
    if (riskScore >= 70) return 'bg-red-500/80 hover:bg-red-500';
    if (riskScore >= 50) return 'bg-orange-500/80 hover:bg-orange-500';
    if (riskScore >= 30) return 'bg-amber-500/80 hover:bg-amber-500';
    if (riskScore >= 10) return 'bg-yellow-500/80 hover:bg-yellow-500';
    return 'bg-emerald-500/80 hover:bg-emerald-500';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        p-4 rounded-xl cursor-pointer transition-all
        ${getHeatColor()}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
      `}
    >
      <p className="text-white font-semibold text-lg">{area}</p>
      <p className="text-white/80 text-sm">{shopCount} shops</p>
      <p className="text-white font-bold text-2xl mt-2">{riskScore}%</p>
      <p className="text-white/70 text-xs">Risk Score</p>
    </motion.div>
  );
};

export default function RiskHeatmap({ shops, inspections }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const [viewMode, setViewMode] = useState('municipality');

  const riskAnalysis = useMemo(() => {
    const analysis = {
      pestControl: { failures: 0, total: 0 },
      temperature: { failures: 0, total: 0 },
      handwashing: { failures: 0, total: 0 },
      expiredItems: { failures: 0, total: 0 },
      foodSeparation: { failures: 0, total: 0 }
    };

    inspections.forEach(insp => {
      // Pest control
      if (insp.structural_pest_control) {
        analysis.pestControl.total++;
        if (insp.structural_pest_control === 'fail') analysis.pestControl.failures++;
      }
      
      // Temperature
      if (insp.coldchain_fridge_temp !== null && insp.coldchain_fridge_temp !== undefined) {
        analysis.temperature.total++;
        if (parseFloat(insp.coldchain_fridge_temp) > 5) analysis.temperature.failures++;
      }
      
      // Handwashing
      if (insp.hygiene_handwashing) {
        analysis.handwashing.total++;
        if (insp.hygiene_handwashing === 'fail') analysis.handwashing.failures++;
      }
      
      // Expired items
      if (insp.inventory_expired_count !== null && insp.inventory_expired_count !== undefined) {
        analysis.expiredItems.total++;
        if (insp.inventory_expired_count > 0) analysis.expiredItems.failures++;
      }
      
      // Food separation
      if (insp.coldchain_separation) {
        analysis.foodSeparation.total++;
        if (insp.coldchain_separation === 'fail') analysis.foodSeparation.failures++;
      }
    });

    return analysis;
  }, [inspections]);

  const areaRiskData = useMemo(() => {
    const groupBy = viewMode === 'municipality' ? 'municipality' : 'ward';
    const areaMap = {};

    shops.forEach(shop => {
      const area = shop[groupBy] || 'Unknown';
      if (!areaMap[area]) {
        areaMap[area] = {
          name: area,
          shops: [],
          riskFactors: { critical: 0, high: 0, medium: 0, low: 0 }
        };
      }
      areaMap[area].shops.push(shop);
      
      // Categorize risk
      if (shop.risk_level === 'critical') areaMap[area].riskFactors.critical++;
      else if (shop.risk_level === 'high') areaMap[area].riskFactors.high++;
      else if (shop.risk_level === 'medium') areaMap[area].riskFactors.medium++;
      else areaMap[area].riskFactors.low++;
    });

    return Object.values(areaMap).map(area => {
      const total = area.shops.length;
      // Calculate risk score: critical=100, high=75, medium=50, low=25
      const riskScore = total > 0 ? Math.round(
        (area.riskFactors.critical * 100 + 
         area.riskFactors.high * 75 + 
         area.riskFactors.medium * 50 + 
         area.riskFactors.low * 25) / total
      ) : 0;
      
      return {
        ...area,
        riskScore,
        shopCount: total
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [shops, viewMode]);

  const selectedAreaDetails = useMemo(() => {
    if (!selectedArea) return null;
    return areaRiskData.find(a => a.name === selectedArea);
  }, [selectedArea, areaRiskData]);

  const riskCategories = [
    {
      label: 'Pest Control',
      icon: Bug,
      count: riskAnalysis.pestControl.failures,
      total: riskAnalysis.pestControl.total,
      color: {
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        icon: 'text-red-400',
        badge: 'bg-red-500/20 text-red-400',
        bar: 'bg-red-500'
      },
      details: 'Evidence of rodents, insects, or infestation'
    },
    {
      label: 'Temperature Control',
      icon: Thermometer,
      count: riskAnalysis.temperature.failures,
      total: riskAnalysis.temperature.total,
      color: {
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        icon: 'text-blue-400',
        badge: 'bg-blue-500/20 text-blue-400',
        bar: 'bg-blue-500'
      },
      details: 'Fridge temperature exceeding 5°C safe limit'
    },
    {
      label: 'Hand Hygiene',
      icon: Droplets,
      count: riskAnalysis.handwashing.failures,
      total: riskAnalysis.handwashing.total,
      color: {
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10',
        icon: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-400',
        bar: 'bg-cyan-500'
      },
      details: 'No handwashing station or supplies'
    },
    {
      label: 'Expired Stock',
      icon: Package,
      count: riskAnalysis.expiredItems.failures,
      total: riskAnalysis.expiredItems.total,
      color: {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        icon: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-400',
        bar: 'bg-amber-500'
      },
      details: 'Expired products found on shelves'
    },
    {
      label: 'Food Separation',
      icon: AlertTriangle,
      count: riskAnalysis.foodSeparation.failures,
      total: riskAnalysis.foodSeparation.total,
      color: {
        border: 'border-orange-500/30',
        bg: 'bg-orange-500/10',
        icon: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-400',
        bar: 'bg-orange-500'
      },
      details: 'Raw and cooked food not properly separated'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Risk Heatmap Analysis
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="categories" className="data-[state=active]:bg-slate-700">
              Risk Categories
            </TabsTrigger>
            <TabsTrigger value="geographic" className="data-[state=active]:bg-slate-700">
              Geographic Heatmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {riskCategories.map((category, index) => (
                <motion.div
                  key={category.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RiskCategory {...category} />
                </motion.div>
              ))}
            </div>

            {/* Overall Risk Summary */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
              <h4 className="text-white font-semibold mb-4">Critical Findings Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                  <p className="text-3xl font-bold text-red-400">
                    {shops.filter(s => s.risk_level === 'critical').length}
                  </p>
                  <p className="text-slate-400 text-sm">Critical Risk</p>
                </div>
                <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <p className="text-3xl font-bold text-orange-400">
                    {shops.filter(s => s.risk_level === 'high').length}
                  </p>
                  <p className="text-slate-400 text-sm">High Risk</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-3xl font-bold text-amber-400">
                    {shops.filter(s => s.risk_level === 'medium').length}
                  </p>
                  <p className="text-slate-400 text-sm">Medium Risk</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <p className="text-3xl font-bold text-emerald-400">
                    {shops.filter(s => s.risk_level === 'low').length}
                  </p>
                  <p className="text-slate-400 text-sm">Low Risk</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="geographic">
            <div className="mb-4">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="municipality">By Municipality</SelectItem>
                  <SelectItem value="ward">By Ward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areaRiskData.map((area, index) => (
                <motion.div
                  key={area.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AreaHeatmapCell
                    area={viewMode === 'ward' ? `Ward ${area.name}` : area.name}
                    riskScore={area.riskScore}
                    shopCount={area.shopCount}
                    onClick={() => setSelectedArea(selectedArea === area.name ? null : area.name)}
                    isSelected={selectedArea === area.name}
                  />
                </motion.div>
              ))}
            </div>

            {/* Selected Area Details */}
            {selectedAreaDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  {viewMode === 'ward' ? `Ward ${selectedAreaDetails.name}` : selectedAreaDetails.name} Details
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{selectedAreaDetails.riskFactors.critical}</p>
                    <p className="text-slate-400 text-xs">Critical</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400">{selectedAreaDetails.riskFactors.high}</p>
                    <p className="text-slate-400 text-xs">High</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">{selectedAreaDetails.riskFactors.medium}</p>
                    <p className="text-slate-400 text-xs">Medium</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{selectedAreaDetails.riskFactors.low}</p>
                    <p className="text-slate-400 text-xs">Low</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-slate-400">Risk Level:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-slate-300">Low (0-10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-slate-300">Medium (10-30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500" />
                <span className="text-slate-300">Elevated (30-50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-slate-300">High (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-slate-300">Critical (70%+)</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}