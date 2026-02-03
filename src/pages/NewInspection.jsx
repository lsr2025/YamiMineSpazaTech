import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Building,
  Droplets,
  Thermometer,
  Bug,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  Loader2,
  AlertTriangle,
  Package,
  Wifi,
  WifiOff,
  Info,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GuidedChecklistItem, SectionHeader, StepNavigation } from '../components/mobile/GuidedChecklist';
import { PhotoCapture } from '../components/mobile/PhotoCapture';
import { SyncStatusIndicator } from '../components/mobile/OfflineSyncManager';

// Checklist items configuration with guidance
const checklistConfig = {
  structural: [
    {
      id: 'structural_walls_floors',
      label: 'Walls & Floors Smooth and Washable',
      description: 'Surfaces must be easy to clean and maintain',
      guidance: 'Look for cracks, holes, peeling paint, or porous surfaces. Floors should be smooth concrete, tiles, or sealed surfaces. Walls should be painted or tiled with no exposed brick.',
      photoField: 'structural_walls_floors_photo',
      required: true,
      critical: false
    },
    {
      id: 'structural_ventilation',
      label: 'Adequate Ventilation',
      description: 'Natural or mechanical ventilation present',
      guidance: 'Check for windows that open, vents, extractor fans, or air conditioning. Stale or smoky air indicates poor ventilation.',
      required: true,
      critical: false
    },
    {
      id: 'structural_pest_control',
      label: 'Pest Control Measures',
      description: 'No evidence of rodents, insects, or infestation',
      guidance: 'Look for droppings, gnaw marks, dead insects, nests, or holes. Check behind shelves, under fridges, and in storage areas. Evidence of any pests is an automatic critical fail.',
      photoField: 'structural_pest_control_photo',
      required: true,
      critical: true
    }
  ],
  hygiene: [
    {
      id: 'hygiene_handwashing',
      label: 'Hand Washing Station Present',
      description: 'Basin with running water available',
      guidance: 'Must have a dedicated handwashing basin (not used for food prep). Check that water actually flows. Basin should be easily accessible to food handlers.',
      photoField: 'hygiene_handwashing_photo',
      required: true,
      critical: true
    },
    {
      id: 'hygiene_soap_towels',
      label: 'Soap and Towels Available',
      description: 'Handwashing supplies present and accessible',
      guidance: 'Check for liquid soap dispenser or bar soap near basin. Paper towels or clean cloth towels should be available. Hand sanitizer alone is not sufficient.',
      required: true,
      critical: false
    },
    {
      id: 'hygiene_protective_clothing',
      label: 'Protective Clothing (PPE)',
      description: 'Food handler wearing clean apron/hairnet',
      guidance: 'Person handling food should wear clean apron and hair covering. Check cleanliness of the PPE - stained or dirty items fail. Gloves are bonus but not required.',
      photoField: 'hygiene_protective_clothing_photo',
      required: true,
      critical: false
    }
  ],
  coldchain: [
    {
      id: 'coldchain_separation',
      label: 'Raw/Cooked Food Separation',
      description: 'Raw meat stored separately from ready-to-eat food',
      guidance: 'Raw meat, poultry, and fish must be stored below or separate from cooked/ready-to-eat foods. Check fridge organization - raw items at bottom, cooked at top.',
      photoField: 'coldchain_separation_photo',
      required: true,
      critical: true
    }
  ],
  inventory: [
    {
      id: 'waste_disposal',
      label: 'Waste Disposal Bins Present',
      description: 'Proper waste management facilities',
      guidance: 'Check for bins with lids, especially in food prep areas. Bins should not be overflowing. Look for separate bins for recyclables if applicable.',
      required: true,
      critical: false
    },
    {
      id: 'chemical_storage',
      label: 'Chemical Storage Separate from Food',
      description: 'Cleaning agents/paraffin stored away from food items',
      guidance: 'All cleaning chemicals, paraffin, pesticides must be stored in a separate area from food. Check under counters and storage areas.',
      required: true,
      critical: false
    }
  ]
};

const ScoreMeter = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getTextColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="text-center p-6 bg-slate-800/50 rounded-xl">
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="14"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="url(#scoreGradient)"
            strokeWidth="14"
            fill="none"
            strokeDasharray={`${(score / 100) * 440} 440`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGradient">
              <stop offset="0%" stopColor={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'} />
              <stop offset="100%" stopColor={score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#dc2626'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${getTextColor()}`}>{score}</span>
          <span className="text-slate-400 text-sm">Score</span>
        </div>
      </div>
      <p className={`text-lg font-semibold ${getTextColor()}`}>
        {score >= 80 ? 'Funding Eligible' : score >= 60 ? 'Needs Improvement' : 'Non-Compliant'}
      </p>
      <p className="text-slate-400 text-sm">
        {score >= 80 ? 'This shop meets NEF requirements' : 'Address the failed items to improve score'}
      </p>
    </div>
  );
};

export default function NewInspection() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shopId = urlParams.get('shop_id');
  
  const [currentSection, setCurrentSection] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [validationErrors, setValidationErrors] = useState([]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: shop } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      const shops = await base44.entities.Shop.filter({ id: shopId });
      return shops[0];
    },
    enabled: !!shopId
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [formData, setFormData] = useState({
    shop_id: shopId,
    inspection_type: 'routine',
    inspector_email: '',
    inspector_name: '',
    gps_latitude: null,
    gps_longitude: null,
    check_in_time: new Date().toISOString(),
    
    // Structural
    structural_walls_floors: '',
    structural_walls_floors_photo: '',
    structural_ventilation: '',
    structural_pest_control: '',
    structural_pest_control_photo: '',
    
    // Hygiene
    hygiene_handwashing: '',
    hygiene_handwashing_photo: '',
    hygiene_soap_towels: '',
    hygiene_protective_clothing: '',
    hygiene_protective_clothing_photo: '',
    
    // Cold Chain
    coldchain_fridge_temp: '',
    coldchain_fridge_temp_photo: '',
    coldchain_separation: '',
    coldchain_separation_photo: '',
    
    // Inventory
    inventory_expired_count: 0,
    inventory_expired_photo: '',
    
    // Other
    waste_disposal: '',
    water_supply: '',
    chemical_storage: '',
    
    status: 'completed',
    corrective_actions: [],
    risk_flags: []
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        inspector_email: user.email,
        inspector_name: user.full_name
      }));
    }
  }, [user]);

  const sections = [
    {
      id: 'structural',
      title: 'Structural Hygiene',
      icon: Building,
      color: 'text-cyan-400'
    },
    {
      id: 'hygiene',
      title: 'Food Handling',
      icon: Droplets,
      color: 'text-emerald-400'
    },
    {
      id: 'coldchain',
      title: 'Cold Chain',
      icon: Thermometer,
      color: 'text-blue-400'
    },
    {
      id: 'inventory',
      title: 'Inventory & Waste',
      icon: Package,
      color: 'text-amber-400'
    }
  ];

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateScore = () => {
    const checks = [
      { value: formData.structural_walls_floors, weight: 10, critical: false },
      { value: formData.structural_ventilation, weight: 10, critical: false },
      { value: formData.structural_pest_control, weight: 15, critical: true },
      { value: formData.hygiene_handwashing, weight: 20, critical: true },
      { value: formData.hygiene_soap_towels, weight: 10, critical: false },
      { value: formData.hygiene_protective_clothing, weight: 10, critical: false },
      { value: formData.coldchain_separation, weight: 15, critical: true },
      { value: formData.waste_disposal, weight: 5, critical: false },
      { value: formData.chemical_storage, weight: 5, critical: false }
    ];

    let totalWeight = 0;
    let earnedPoints = 0;

    checks.forEach(check => {
      if (check.value && check.value !== 'na') {
        totalWeight += check.weight;
        if (check.value === 'pass') {
          earnedPoints += check.weight;
        }
      }
    });

    // Fridge temp penalty
    const fridgeTemp = parseFloat(formData.coldchain_fridge_temp);
    if (!isNaN(fridgeTemp)) {
      if (fridgeTemp > 5) {
        earnedPoints = Math.max(0, earnedPoints - 20);
      }
    }

    // Expired items penalty
    if (formData.inventory_expired_count > 0) {
      earnedPoints = Math.max(0, earnedPoints - (formData.inventory_expired_count * 5));
    }

    return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;
  };

  const captureGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude
          }));
          setGpsLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const createInspection = useMutation({
    mutationFn: async (data) => {
      const inspection = await base44.entities.Inspection.create(data);
      
      // Update shop compliance status
      const score = calculateScore();
      const complianceStatus = score >= 80 ? 'compliant' : score >= 60 ? 'partially_compliant' : 'non_compliant';
      const fundingStatus = score >= 80 ? 'eligible' : 'not_eligible';
      
      await base44.entities.Shop.update(shopId, {
        compliance_score: score,
        compliance_status: complianceStatus,
        funding_status: fundingStatus,
        last_inspection_date: new Date().toISOString(),
        risk_level: score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical'
      });
      
      return inspection;
    },
    onSuccess: () => {
      navigate(createPageUrl(`ShopDetail?id=${shopId}`));
    }
  });

  const handleSubmit = () => {
    const score = calculateScore();
    const riskFlags = [];
    
    if (formData.structural_pest_control === 'fail') riskFlags.push('Pest infestation detected');
    if (formData.hygiene_handwashing === 'fail') riskFlags.push('No handwashing facility');
    if (parseFloat(formData.coldchain_fridge_temp) > 5) riskFlags.push('Fridge temperature above 5°C');
    if (formData.inventory_expired_count > 0) riskFlags.push(`${formData.inventory_expired_count} expired items found`);

    const inspectionData = {
      ...formData,
      total_score: score,
      risk_flags: riskFlags,
      check_out_time: new Date().toISOString()
    };

    createInspection.mutate(inspectionData);
  };

  const progress = ((currentSection + 1) / sections.length) * 100;
  const score = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="px-4 py-2 bg-amber-600 text-white text-center text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Data will sync when connected
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to={createPageUrl(`ShopDetail?id=${shopId}`)}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Health Inspection</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">{shop?.shop_name}</p>
              <Badge className={`text-xs ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isOnline ? <><Wifi className="w-3 h-3 mr-1" />Online</> : <><WifiOff className="w-3 h-3 mr-1" />Offline</>}
              </Badge>
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-slate-700" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={currentSection === i ? 'default' : 'outline'}
              onClick={() => setCurrentSection(i)}
              className={`flex-shrink-0 gap-2 ${
                currentSection === i 
                  ? 'bg-slate-700 text-white' 
                  : 'border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${section.color}`} />
              <span className="hidden md:inline">{section.title}</span>
            </Button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                {React.createElement(sections[currentSection].icon, { 
                  className: `w-5 h-5 ${sections[currentSection].color}` 
                })}
                {sections[currentSection].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Structural Section */}
                  {currentSection === 0 && (
                    <>
                      <SectionHeader
                        icon={Building}
                        title="Structural Hygiene"
                        description="Check walls, floors, ventilation, and pest control"
                        color="text-cyan-400"
                        completedCount={getSectionStats('structural').completed}
                        totalCount={getSectionStats('structural').total}
                        errors={validateSection('structural')}
                      />
                      {checklistConfig.structural.map(item => (
                        <GuidedChecklistItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          description={item.description}
                          guidance={item.guidance}
                          value={formData[item.id]}
                          onChange={(v) => updateField(item.id, v)}
                          photoValue={item.photoField ? formData[item.photoField] : null}
                          onPhotoChange={item.photoField ? (v) => updateField(item.photoField, v) : null}
                          required={item.required}
                          critical={item.critical}
                          photoRequiredOnFail={!!item.photoField}
                        />
                      ))}
                    </>
                  )}

                  {/* Hygiene Section */}
                  {currentSection === 1 && (
                    <>
                      <SectionHeader
                        icon={Droplets}
                        title="Food Handling & Hygiene"
                        description="Handwashing, soap availability, and protective clothing"
                        color="text-emerald-400"
                        completedCount={getSectionStats('hygiene').completed}
                        totalCount={getSectionStats('hygiene').total}
                        errors={validateSection('hygiene')}
                      />
                      {checklistConfig.hygiene.map(item => (
                        <GuidedChecklistItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          description={item.description}
                          guidance={item.guidance}
                          value={formData[item.id]}
                          onChange={(v) => updateField(item.id, v)}
                          photoValue={item.photoField ? formData[item.photoField] : null}
                          onPhotoChange={item.photoField ? (v) => updateField(item.photoField, v) : null}
                          required={item.required}
                          critical={item.critical}
                          photoRequiredOnFail={!!item.photoField}
                        />
                      ))}
                    </>
                  )}

                  {/* Cold Chain Section */}
                  {currentSection === 2 && (
                    <>
                      <SectionHeader
                        icon={Thermometer}
                        title="Cold Chain Management"
                        description="Temperature control and food separation"
                        color="text-blue-400"
                        completedCount={getSectionStats('coldchain').completed + (formData.coldchain_fridge_temp ? 1 : 0)}
                        totalCount={getSectionStats('coldchain').total + 1}
                        errors={validateSection('coldchain')}
                      />
                      
                      {/* Temperature Input with Guidance */}
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white font-medium">Fridge Temperature Reading (°C)</Label>
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">Required</Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">Use thermometer to check internal temperature</p>
                        
                        {/* Guidance Tip */}
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300 text-sm">
                              Safe temperature for refrigerated foods is <strong className="text-cyan-400">0°C to 5°C</strong>. 
                              Place thermometer in center of fridge, wait 2 minutes, then read.
                            </p>
                          </div>
                        </div>
                        
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.coldchain_fridge_temp}
                          onChange={(e) => updateField('coldchain_fridge_temp', e.target.value)}
                          placeholder="e.g. 4.5"
                          className={`bg-slate-700 border-slate-600 text-white h-14 text-2xl text-center font-mono ${
                            parseFloat(formData.coldchain_fridge_temp) > 5 ? 'border-red-500 text-red-400' : 
                            formData.coldchain_fridge_temp && parseFloat(formData.coldchain_fridge_temp) <= 5 ? 'border-emerald-500 text-emerald-400' : ''
                          }`}
                        />
                        
                        {/* Status Feedback */}
                        {formData.coldchain_fridge_temp && (
                          parseFloat(formData.coldchain_fridge_temp) > 5 ? (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
                            >
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                              <div>
                                <span className="text-red-400 font-semibold">CRITICAL FAILURE</span>
                                <p className="text-red-300 text-sm">Temperature exceeds 5°C safe limit. Perishable food at risk.</p>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Temperature within safe range</span>
                            </motion.div>
                          )
                        )}
                        
                        {/* Photo of thermometer */}
                        <div className="mt-4">
                          <PhotoCapture
                            label="Thermometer Photo"
                            description="Capture photo showing the thermometer reading"
                            value={formData.coldchain_fridge_temp_photo}
                            onChange={(v) => updateField('coldchain_fridge_temp_photo', v)}
                          />
                        </div>
                      </div>

                      {checklistConfig.coldchain.map(item => (
                        <GuidedChecklistItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          description={item.description}
                          guidance={item.guidance}
                          value={formData[item.id]}
                          onChange={(v) => updateField(item.id, v)}
                          photoValue={item.photoField ? formData[item.photoField] : null}
                          onPhotoChange={item.photoField ? (v) => updateField(item.photoField, v) : null}
                          required={item.required}
                          critical={item.critical}
                          photoRequiredOnFail={!!item.photoField}
                        />
                      ))}
                    </>
                  )}

                  {/* Inventory Section */}
                  {currentSection === 3 && (
                    <>
                      <SectionHeader
                        icon={Package}
                        title="Inventory & Waste Management"
                        description="Check for expired items, waste disposal, and chemical storage"
                        color="text-amber-400"
                        completedCount={getSectionStats('inventory').completed + (formData.water_supply ? 1 : 0) + 1}
                        totalCount={getSectionStats('inventory').total + 2}
                        errors={validateSection('inventory')}
                      />
                      
                      {/* Expired Items Counter with Guidance */}
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white font-medium">Expired Items Found</Label>
                          <Badge className="bg-slate-700 text-slate-300 text-xs">Sample of 5 items</Badge>
                        </div>
                        
                        {/* Guidance */}
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                            <p className="text-slate-300 text-sm">
                              Randomly select 5 products from shelves. Check expiry dates. Count how many are expired or have no date visible.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateField('inventory_expired_count', Math.max(0, formData.inventory_expired_count - 1))}
                            className="h-14 w-14 border-slate-600 text-white text-2xl"
                          >
                            −
                          </Button>
                          <div className={`flex-1 h-14 flex items-center justify-center text-3xl font-bold rounded-lg ${
                            formData.inventory_expired_count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {formData.inventory_expired_count}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateField('inventory_expired_count', Math.min(5, formData.inventory_expired_count + 1))}
                            className="h-14 w-14 border-slate-600 text-white text-2xl"
                          >
                            +
                          </Button>
                        </div>
                        
                        {formData.inventory_expired_count > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3"
                          >
                            <PhotoCapture
                              label="Photo of Expired Items"
                              description="Capture evidence showing expired products"
                              value={formData.inventory_expired_photo}
                              onChange={(v) => updateField('inventory_expired_photo', v)}
                              required
                            />
                          </motion.div>
                        )}
                      </div>

                      {checklistConfig.inventory.map(item => (
                        <GuidedChecklistItem
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          description={item.description}
                          guidance={item.guidance}
                          value={formData[item.id]}
                          onChange={(v) => updateField(item.id, v)}
                          photoValue={item.photoField ? formData[item.photoField] : null}
                          onPhotoChange={item.photoField ? (v) => updateField(item.photoField, v) : null}
                          required={item.required}
                          critical={item.critical}
                          photoRequiredOnFail={!!item.photoField}
                        />
                      ))}

                      {/* Water Supply */}
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white font-medium">Water Supply Type</Label>
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">Required</Badge>
                        </div>
                        <RadioGroup
                          value={formData.water_supply}
                          onValueChange={(v) => updateField('water_supply', v)}
                          className="mt-3 grid grid-cols-3 gap-2"
                        >
                          {[
                            { value: 'tap', label: 'Municipal Tap', desc: 'Piped water' },
                            { value: 'tank', label: 'Tank/JoJo', desc: 'Stored water' },
                            { value: 'none', label: 'None', desc: 'No water' }
                          ].map(option => (
                            <div key={option.value}>
                              <RadioGroupItem value={option.value} id={option.value} className="hidden peer" />
                              <Label 
                                htmlFor={option.value} 
                                className={`block p-3 rounded-lg border cursor-pointer transition-all text-center
                                  ${formData.water_supply === option.value 
                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                                  }
                                `}
                              >
                                <p className="font-medium">{option.label}</p>
                                <p className="text-xs opacity-70">{option.desc}</p>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <StepNavigation
                currentStep={currentSection}
                totalSteps={sections.length}
                onPrevious={() => setCurrentSection(prev => prev - 1)}
                onNext={() => {
                  const errors = validateSection(sections[currentSection].id);
                  if (errors.length > 0) {
                    setValidationErrors(errors);
                  } else {
                    setValidationErrors([]);
                    setCurrentSection(prev => prev + 1);
                  }
                }}
                onComplete={handleSubmit}
                canProceed={true}
                validationErrors={validationErrors}
                isSubmitting={createInspection.isPending}
              />
            </CardContent>
          </Card>
        </div>

        {/* Score Panel */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 sticky top-4">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white">Live Compliance Score</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScoreMeter score={score} />
              
              {/* Risk Flags */}
              {(formData.structural_pest_control === 'fail' || 
                formData.hygiene_handwashing === 'fail' ||
                parseFloat(formData.coldchain_fridge_temp) > 5 ||
                formData.inventory_expired_count > 0) && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Risk Flags</span>
                  </div>
                  <ul className="space-y-2 text-sm text-red-300">
                    {formData.structural_pest_control === 'fail' && <li>• Pest infestation detected</li>}
                    {formData.hygiene_handwashing === 'fail' && <li>• No handwashing facility</li>}
                    {parseFloat(formData.coldchain_fridge_temp) > 5 && <li>• Fridge temp above 5°C</li>}
                    {formData.inventory_expired_count > 0 && <li>• {formData.inventory_expired_count} expired items</li>}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}