import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Store,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  Building,
  Navigation,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const StatusBadge = ({ status, size = 'default' }) => {
  const configs = {
    compliant: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Compliant' },
    partially_compliant: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Partially Compliant' },
    non_compliant: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Non-Compliant' },
    pending: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock, label: 'Pending Review' }
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} gap-1 ${size === 'large' ? 'px-4 py-2 text-sm' : ''}`}>
      <Icon className={size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} />
      {config.label}
    </Badge>
  );
};

const FundingStatusBadge = ({ status }) => {
  const configs = {
    eligible: { color: 'bg-emerald-500 text-white', icon: DollarSign, label: 'NEF Eligible' },
    not_eligible: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Not Eligible' },
    pending_review: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Under Review' },
    application_submitted: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: FileText, label: 'Application Submitted' }
  };
  const config = configs[status] || configs.pending_review;
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} gap-1 px-3 py-1.5`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </Badge>
  );
};

const RiskBadge = ({ level }) => {
  const configs = {
    low: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Low Risk' },
    medium: { color: 'bg-amber-500/20 text-amber-400', label: 'Medium Risk' },
    high: { color: 'bg-orange-500/20 text-orange-400', label: 'High Risk' },
    critical: { color: 'bg-red-500/20 text-red-400', label: 'Critical Risk' }
  };
  const config = configs[level] || configs.medium;

  return (
    <Badge className={config.color}>
      <AlertTriangle className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-700/50 last:border-0">
    <Icon className="w-5 h-5 text-slate-500 mt-0.5" />
    <div className="flex-1">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-white ${highlight ? 'text-cyan-400 font-semibold' : ''}`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

const ScoreGauge = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getGradient = () => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="url(#gradient)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${(score / 100) * 352} 352`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`stop-${score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red'}-500`} stopColor={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} />
            <stop offset="100%" className={`stop-${score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red'}-600`} stopColor={score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor()}`}>{score || 0}%</span>
        <span className="text-slate-400 text-xs">Score</span>
      </div>
    </div>
  );
};

const InspectionCard = ({ inspection }) => (
  <Card className="bg-slate-800/50 border-slate-700/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-medium capitalize">{inspection.inspection_type?.replace('_', ' ')}</p>
          <p className="text-slate-400 text-sm">{inspection.inspector_name || 'Unknown Inspector'}</p>
          <p className="text-slate-500 text-xs mt-1">
            {inspection.created_date && format(new Date(inspection.created_date), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        <div className="text-right">
          {inspection.total_score !== null && (
            <div className={`text-2xl font-bold ${
              inspection.total_score >= 80 ? 'text-emerald-400' : 
              inspection.total_score >= 60 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {inspection.total_score}%
            </div>
          )}
          <Badge className={
            inspection.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
            inspection.status === 'completed' ? 'bg-cyan-500/20 text-cyan-400' :
            'bg-slate-500/20 text-slate-400'
          }>
            {inspection.status || 'pending'}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ShopDetail() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shopId = urlParams.get('id');

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const shops = await base44.entities.Shop.filter({ id: shopId });
      return shops[0];
    },
    enabled: !!shopId
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections', shopId],
    queryFn: () => base44.entities.Inspection.filter({ shop_id: shopId }, '-created_date'),
    enabled: !!shopId
  });

  const deleteShop = useMutation({
    mutationFn: () => base44.entities.Shop.delete(shopId),
    onSuccess: () => {
      navigate(createPageUrl('Shops'));
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading shop details...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 flex items-center justify-center">
        <Card className="bg-slate-900 border-slate-700 p-8 text-center">
          <Store className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Shop Not Found</h2>
          <p className="text-slate-400 mb-4">The requested shop could not be found.</p>
          <Link to={createPageUrl('Shops')}>
            <Button className="bg-cyan-600 hover:bg-cyan-700">Back to Shops</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl('Shops')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{shop.shop_name}</h1>
            <p className="text-slate-400">{shop.owner_name}</p>
          </div>
        </div>
      </div>

      {/* Hero Card with Photo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 overflow-hidden mb-6">
          <div className="md:flex">
            {/* Shop Image */}
            <div className="w-full md:w-1/3 h-48 md:h-auto bg-slate-800 relative">
              {shop.shop_photo_url ? (
                <img 
                  src={shop.shop_photo_url} 
                  alt={shop.shop_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-20 h-20 text-slate-600" />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="flex-1 p-6">
              <div className="flex flex-wrap gap-3 mb-6">
                <StatusBadge status={shop.compliance_status} size="large" />
                <FundingStatusBadge status={shop.funding_status} />
                <RiskBadge level={shop.risk_level} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <ScoreGauge score={shop.compliance_score || 0} />
                  <p className="text-slate-400 text-sm mt-2">Compliance</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-cyan-400">{inspections.length}</div>
                  <p className="text-slate-400 text-sm">Inspections</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-amber-400">{shop.trading_months || '—'}</div>
                  <p className="text-slate-400 text-sm">Months Trading</p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-emerald-400">{shop.municipality?.[0] || '—'}</div>
                  <p className="text-slate-400 text-sm">{shop.municipality}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Link to={createPageUrl(`NewInspection?shop_id=${shop.id}`)}>
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    Start Inspection
                  </Button>
                </Link>
                {shop.gps_latitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${shop.gps_latitude},${shop.gps_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700 gap-2">
                      <Navigation className="w-4 h-4" />
                      Navigate
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">Details</TabsTrigger>
          <TabsTrigger value="inspections" className="data-[state=active]:bg-slate-700">Inspections</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-slate-700">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Owner Information */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow icon={User} label="Full Name" value={shop.owner_name} />
                <InfoRow icon={FileText} label="ID Number" value={shop.owner_id_number ? '••••••' + shop.owner_id_number.slice(-4) : null} />
                <InfoRow icon={MapPin} label="Nationality" value={shop.owner_nationality?.replace('_', ' ')} />
                <InfoRow icon={Phone} label="Phone" value={shop.phone_number} highlight />
                <InfoRow icon={User} label="Gender" value={shop.owner_gender} />
                <InfoRow icon={User} label="Age Group" value={shop.owner_age_group} />
                <InfoRow icon={User} label="PDG Status" value={shop.owner_pdg_status?.replace('_', ' ')} />
                <InfoRow icon={User} label="Education" value={shop.owner_education_level?.replace('_', ' ')} />
                <div className="py-3 border-b border-slate-700/50">
                  <p className="text-slate-400 text-sm mb-2">Special Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {shop.owner_youth_status && <Badge className="bg-purple-500/20 text-purple-400">Youth-Owned</Badge>}
                    {shop.owner_woman_owned && <Badge className="bg-pink-500/20 text-pink-400">Woman-Owned</Badge>}
                    {shop.owner_disability_status && <Badge className="bg-blue-500/20 text-blue-400">Disability</Badge>}
                    {!shop.owner_youth_status && !shop.owner_woman_owned && !shop.owner_disability_status && <span className="text-slate-500">None</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-400" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow icon={Building} label="Municipality" value={shop.municipality} />
                <InfoRow icon={MapPin} label="Ward" value={shop.ward ? `Ward ${shop.ward}` : null} />
                <InfoRow 
                  icon={Navigation} 
                  label="GPS Coordinates" 
                  value={shop.gps_latitude ? `${shop.gps_latitude.toFixed(6)}, ${shop.gps_longitude.toFixed(6)}` : null}
                />
                {shop.gps_accuracy && (
                  <InfoRow icon={MapPin} label="GPS Accuracy" value={`±${shop.gps_accuracy}m`} />
                )}
              </CardContent>
            </Card>

            {/* Land & Tenure */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  Land & Tenure Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow icon={Building} label="Ownership Type" value={shop.land_ownership_type?.replace(/_/g, ' ')} />
                <InfoRow icon={FileText} label="Tenure Security" value={shop.tenure_security_status?.replace(/_/g, ' ')} />
                {shop.monthly_rent && <InfoRow icon={DollarSign} label="Monthly Rent" value={`R${shop.monthly_rent}`} />}
                <div className="py-3">
                  <p className="text-slate-400 text-sm mb-2">Documentation</p>
                  <div className="flex flex-wrap gap-2">
                    {shop.tenure_documentation?.length > 0 ? shop.tenure_documentation.map(d => (
                      <Badge key={d} className="bg-emerald-500/20 text-emerald-400 capitalize">
                        {d.replace(/_/g, ' ')}
                      </Badge>
                    )) : <span className="text-slate-500">None specified</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Demographics */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Employee Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{shop.num_employees || 0}</div>
                    <p className="text-slate-400 text-xs">Total</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-400">{shop.num_employees_fulltime || 0}</div>
                    <p className="text-slate-400 text-xs">Full-time</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">{shop.num_employees_parttime || 0}</div>
                    <p className="text-slate-400 text-xs">Part-time</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Male / Female</span>
                    <span className="text-white">{shop.num_employees_male || 0} / {shop.num_employees_female || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Youth (18-35)</span>
                    <span className="text-white">{shop.num_employees_youth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">With Disabilities</span>
                    <span className="text-white">{shop.num_employees_disabled || 0}</span>
                  </div>
                </div>
                {shop.employees_pdg_breakdown && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm mb-2">PDG Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(shop.employees_pdg_breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white">{value || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {shop.employees_education_breakdown && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-slate-400 text-sm mb-2">Education Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(shop.employees_education_breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white">{value || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-400" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <InfoRow icon={Building} label="Structure Type" value={shop.structure_type?.replace('_', ' ')} />
                <InfoRow icon={Calendar} label="Trading Duration" value={shop.trading_months ? `${shop.trading_months} months` : null} />
                <div className="py-3 border-b border-slate-700/50">
                  <p className="text-slate-400 text-sm mb-2">Services Offered</p>
                  <div className="flex flex-wrap gap-2">
                    {shop.services?.length > 0 ? shop.services.map(s => (
                      <Badge key={s} className="bg-cyan-500/20 text-cyan-400 capitalize">
                        {s.replace('_', ' ')}
                      </Badge>
                    )) : <span className="text-slate-500">None specified</span>}
                  </div>
                </div>
                <div className="py-3">
                  <p className="text-slate-400 text-sm mb-2">Stock Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {shop.stock_categories?.length > 0 ? shop.stock_categories.map(s => (
                      <Badge key={s} className="bg-amber-500/20 text-amber-400 capitalize">
                        {s.replace('_', ' ')}
                      </Badge>
                    )) : <span className="text-slate-500">None specified</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white">Photos</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { url: shop.shop_photo_url, label: 'Shop Front' },
                    { url: shop.owner_photo_url, label: 'Owner' },
                    { url: shop.interior_photo_url, label: 'Interior' }
                  ].map((photo, i) => (
                    <div key={i} className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                      {photo.url ? (
                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs text-center p-2">
                          {photo.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inspections">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50 flex flex-row items-center justify-between">
              <CardTitle className="text-white">Inspection History</CardTitle>
              <Link to={createPageUrl(`NewInspection?shop_id=${shop.id}`)}>
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  New Inspection
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              {inspections.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">No inspections yet</p>
                  <p className="text-slate-400 mb-4">Start the first inspection for this shop</p>
                  <Link to={createPageUrl(`NewInspection?shop_id=${shop.id}`)}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                      <Plus className="w-4 h-4" />
                      Start Inspection
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.map(inspection => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Documents & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3">Trading Permit</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Permit Number</p>
                      <p className="text-white">{shop.trading_permit_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Expiry Date</p>
                      <p className="text-white">
                        {shop.trading_permit_expiry ? format(new Date(shop.trading_permit_expiry), 'MMM d, yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3">Certificate of Acceptability (CoA)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Status</p>
                      <Badge className={shop.has_coa ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {shop.has_coa ? 'Has CoA' : 'No CoA'}
                      </Badge>
                    </div>
                    {shop.has_coa && (
                      <>
                        <div>
                          <p className="text-slate-400">CoA Number</p>
                          <p className="text-white">{shop.coa_number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Expiry Date</p>
                          <p className="text-white">
                            {shop.coa_expiry ? format(new Date(shop.coa_expiry), 'MMM d, yyyy') : '—'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-white font-medium mb-3">NEF Funding Eligibility</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Business Bank Account</span>
                      <Badge className={shop.has_business_bank_account ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {shop.has_business_bank_account ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">SARS Registered</span>
                      <Badge className={shop.is_sars_registered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                        {shop.is_sars_registered ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">CIPC Number</span>
                      <span className="text-white">{shop.cipc_number || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {shop.notes && (
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mt-6">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Notes</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-slate-300 whitespace-pre-wrap">{shop.notes}</p>
          </CardContent>
        </Card>
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