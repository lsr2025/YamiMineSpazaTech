import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Search, 
  Plus, 
  MapPin, 
  Phone,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }) => {
  const configs = {
    compliant: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Compliant' },
    partially_compliant: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Partial' },
    non_compliant: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Non-Compliant' },
    pending: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock, label: 'Pending' }
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} gap-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const RiskIndicator = ({ level }) => {
  const colors = {
    low: 'bg-emerald-500',
    medium: 'bg-amber-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[level] || colors.medium}`} />
      <span className="text-xs text-slate-400 capitalize">{level || 'medium'} risk</span>
    </div>
  );
};

const ShopCard = ({ shop, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Link to={createPageUrl(`ShopDetail?id=${shop.id}`)}>
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Shop Image or Placeholder */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-800 flex-shrink-0 relative overflow-hidden">
              {shop.shop_photo_url ? (
                <img 
                  src={shop.shop_photo_url} 
                  alt={shop.shop_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-10 h-10 text-slate-600" />
                </div>
              )}
              {/* Funding Status Ribbon */}
              {shop.funding_status === 'eligible' && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5">
                    NEF Ready
                  </Badge>
                </div>
              )}
            </div>

            {/* Shop Details */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {shop.shop_name}
                    </h3>
                    <p className="text-slate-400 text-sm">{shop.owner_name}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={shop.compliance_status} />
                <RiskIndicator level={shop.risk_level} />
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                {shop.municipality && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {shop.municipality}
                  </span>
                )}
                {shop.ward && (
                  <span>Ward {shop.ward}</span>
                )}
                {shop.compliance_score && (
                  <span className="text-cyan-400 font-semibold">
                    {shop.compliance_score}% Score
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

export default function Shops() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 200)
  });

  const filteredShops = shops.filter(shop => {
    const matchesSearch = !searchQuery || 
      shop.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ward?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shop.compliance_status === statusFilter;
    const matchesMunicipality = municipalityFilter === 'all' || shop.municipality === municipalityFilter;
    const matchesRisk = riskFilter === 'all' || shop.risk_level === riskFilter;

    return matchesSearch && matchesStatus && matchesMunicipality && matchesRisk;
  });

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
            <h1 className="text-2xl md:text-3xl font-bold text-white">Registered Shops</h1>
            <p className="text-slate-400 text-sm">{shops.length} shops in database</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name, owner, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-12"
            />
          </div>
          <Link to={createPageUrl('NewShop')}>
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-12 px-6 gap-2 w-full md:w-auto">
              <Plus className="w-5 h-5" />
              Profile New Shop
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="partially_compliant">Partial</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Municipality" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Municipalities</SelectItem>
              <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
              <SelectItem value="Mandeni">Mandeni</SelectItem>
              <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
              <SelectItem value="Maphumulo">Maphumulo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-slate-400 text-sm">
          Showing <span className="text-white font-semibold">{filteredShops.length}</span> shops
        </p>
      </div>

      {/* Shop List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-32 h-32 bg-slate-700" />
                  <div className="flex-1 p-4 space-y-3">
                    <div className="h-5 w-1/2 bg-slate-700 rounded" />
                    <div className="h-4 w-1/3 bg-slate-700 rounded" />
                    <div className="h-6 w-24 bg-slate-700 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredShops.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700/50">
          <CardContent className="p-12 text-center">
            <Store className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No shops found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || statusFilter !== 'all' || municipalityFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start by profiling your first spaza shop'}
            </p>
            <Link to={createPageUrl('NewShop')}>
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Profile New Shop
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredShops.map((shop, index) => (
              <ShopCard key={shop.id} shop={shop} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}