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
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingDown, 
  Target, 
  ChevronRight,
  Brain,
  ShieldAlert,
  Clock,
  Store
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Simple predictive scoring based on historical patterns
const calculateRiskScore = (shop, inspections) => {
  let riskScore = 50; // Base score
  const factors = [];

  // Factor 1: Current compliance status
  if (shop.compliance_status === 'non_compliant') {
    riskScore += 25;
    factors.push({ factor: 'Currently non-compliant', impact: 'high' });
  } else if (shop.compliance_status === 'partially_compliant') {
    riskScore += 15;
    factors.push({ factor: 'Partially compliant', impact: 'medium' });
  }

  // Factor 2: Recent inspection trend
  const shopInspections = inspections.filter(i => i.shop_id === shop.id);
  if (shopInspections.length >= 2) {
    const sorted = [...shopInspections].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (sorted[0]?.total_score < sorted[1]?.total_score) {
      riskScore += 15;
      factors.push({ factor: 'Declining inspection scores', impact: 'high' });
    }
  }

  // Factor 3: Time since last inspection
  if (shop.last_inspection_date) {
    const daysSince = Math.floor((Date.now() - new Date(shop.last_inspection_date)) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) {
      riskScore += 10;
      factors.push({ factor: `${daysSince} days since last inspection`, impact: 'medium' });
    }
  } else {
    riskScore += 20;
    factors.push({ factor: 'Never inspected', impact: 'high' });
  }

  // Factor 4: Critical risk flags
  if (shop.risk_level === 'critical') {
    riskScore += 20;
    factors.push({ factor: 'Critical risk level', impact: 'high' });
  } else if (shop.risk_level === 'high') {
    riskScore += 10;
    factors.push({ factor: 'High risk level', impact: 'medium' });
  }

  // Factor 5: Tenure security
  if (shop.tenure_security_status === 'highly_insecure' || shop.tenure_security_status === 'insecure') {
    riskScore += 5;
    factors.push({ factor: 'Insecure tenure', impact: 'low' });
  }

  // Factor 6: No documentation
  if (!shop.has_coa && !shop.trading_permit_number) {
    riskScore += 10;
    factors.push({ factor: 'Missing key documentation', impact: 'medium' });
  }

  return { 
    score: Math.min(100, Math.max(0, riskScore)), 
    factors,
    prediction: riskScore >= 70 ? 'high' : riskScore >= 50 ? 'medium' : 'low'
  };
};

const RiskCard = ({ shop, riskData, rank }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <Card className={`bg-slate-800/50 border-slate-700/50 ${
        riskData.prediction === 'high' ? 'border-l-4 border-l-red-500' :
        riskData.prediction === 'medium' ? 'border-l-4 border-l-amber-500' :
        'border-l-4 border-l-emerald-500'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                riskData.prediction === 'high' ? 'bg-red-500/20' :
                riskData.prediction === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
              }`}>
                <span className={`text-lg font-bold ${
                  riskData.prediction === 'high' ? 'text-red-400' :
                  riskData.prediction === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {rank + 1}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{shop.shop_name}</p>
                <p className="text-slate-400 text-sm">{shop.municipality} • Ward {shop.ward || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                riskData.prediction === 'high' ? 'text-red-400' :
                riskData.prediction === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {riskData.score}%
              </div>
              <p className="text-slate-500 text-xs">failure risk</p>
            </div>
          </div>

          <div className="mt-3">
            <Progress 
              value={riskData.score} 
              className={`h-2 ${
                riskData.prediction === 'high' ? 'bg-red-900/30' :
                riskData.prediction === 'medium' ? 'bg-amber-900/30' : 'bg-emerald-900/30'
              }`}
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 text-slate-400 hover:text-white"
          >
            {expanded ? 'Hide factors' : 'Show risk factors'}
            <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </Button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-3 space-y-2"
            >
              {riskData.factors.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    f.impact === 'high' ? 'bg-red-400' :
                    f.impact === 'medium' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <span className="text-slate-300 text-sm">{f.factor}</span>
                </div>
              ))}
              <Link to={createPageUrl(`ShopDetail?id=${shop.id}`)}>
                <Button size="sm" className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700">
                  View Shop Details
                </Button>
              </Link>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function PredictiveAnalytics({ shops = [], inspections = [] }) {
  const [filter, setFilter] = useState('all');

  const predictions = useMemo(() => {
    return shops.map(shop => ({
      shop,
      ...calculateRiskScore(shop, inspections)
    })).sort((a, b) => b.score - a.score);
  }, [shops, inspections]);

  const filtered = filter === 'all' ? predictions : predictions.filter(p => p.prediction === filter);
  const highRiskCount = predictions.filter(p => p.prediction === 'high').length;
  const mediumRiskCount = predictions.filter(p => p.prediction === 'medium').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 text-3xl font-bold">{highRiskCount}</p>
                <p className="text-slate-400 text-sm">High Risk Shops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-3xl font-bold">{mediumRiskCount}</p>
                <p className="text-slate-400 text-sm">Medium Risk Shops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-cyan-400 text-3xl font-bold">{Math.round((highRiskCount / shops.length) * 100) || 0}%</p>
                <p className="text-slate-400 text-sm">Portfolio at Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'All Shops', count: predictions.length },
          { value: 'high', label: 'High Risk', count: highRiskCount },
          { value: 'medium', label: 'Medium Risk', count: mediumRiskCount }
        ].map(tab => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? 'default' : 'outline'}
            onClick={() => setFilter(tab.value)}
            className={filter === tab.value ? 'bg-slate-700' : 'border-slate-700 text-slate-400'}
          >
            {tab.label}
            <Badge className="ml-2 bg-slate-600">{tab.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Risk List */}
      <div className="space-y-3">
        {filtered.slice(0, 10).map((item, index) => (
          <RiskCard 
            key={item.shop.id} 
            shop={item.shop} 
            riskData={item}
            rank={index}
          />
        ))}
      </div>

      {filtered.length > 10 && (
        <p className="text-center text-slate-500 text-sm">
          Showing top 10 of {filtered.length} shops
        </p>
      )}
    </div>
  );
}