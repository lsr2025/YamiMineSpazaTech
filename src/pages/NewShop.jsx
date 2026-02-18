import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { offlineStorage } from '@/components/offline/OfflineStorage';
import SyncManager from '@/components/offline/SyncManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

import { motion, AnimatePresence } from 'framer-motion';

import { 
  ArrowLeft,
  ArrowRight,
  MapPin,
  User,
  Store,
  FileText,
  Camera,
  CheckCircle2,
  Loader2,
  Navigation,
  Users,
  Home,
  ShieldCheck,
  Utensils,
  CreditCard,
  Truck,
  Building,
  ClipboardList,
  Award,
  WifiOff
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Shop & Owner', icon: User },
  { id: 2, title: 'Registration', icon: FileText },
  { id: 3, title: 'Infrastructure', icon: Building },
  { id: 4, title: 'Hygiene', icon: ShieldCheck },
  { id: 5, title: 'Food Safety', icon: Utensils },
  { id: 6, title: 'Safety', icon: ClipboardList },
  { id: 7, title: 'Business', icon: CreditCard },
  { id: 8, title: 'NEF Eligibility', icon: Award },
  { id: 9, title: 'Photos', icon: Camera }
];

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-center gap-1 mb-6 px-2 overflow-x-auto pb-2">
    {steps.map((step, index) => {
      const Icon = step.icon;
      const isActive = currentStep === step.id;
      const isCompleted = currentStep > step.id;

      return (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center min-w-[48px]">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs
              ${isCompleted ? 'bg-emerald-500 text-white' : 
                isActive ? 'bg-red-600 text-white' : 
                'bg-slate-700 text-slate-400'}
            `}>
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] mt-1 text-center hidden lg:block ${isActive ? 'text-white' : 'text-slate-500'}`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-4 mx-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          )}
        </div>
      );
    })}
  </div>
);

const PhotoUpload = ({ label, value, onChange, description }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-white">{label}</Label>
      <div className="relative">
        {value ? (
          <div className="relative h-32 rounded-lg overflow-hidden border border-slate-700">
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-500 transition-colors cursor-pointer bg-slate-800/50">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-slate-400 text-xs">Tap to capture</span>
              </>
            )}
          </label>
        )}
      </div>
      {description && <p className="text-slate-500 text-xs">{description}</p>}
    </div>
  );
};

const YesNoSelect = ({ value, onChange, includeOther = false }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
      <SelectValue placeholder="Select" />
    </SelectTrigger>
    <SelectContent className="bg-slate-800 border-slate-700">
      <SelectItem value="yes">Yes</SelectItem>
      <SelectItem value="no">No</SelectItem>
      {includeOther && <SelectItem value="other">Other</SelectItem>}
    </SelectContent>
  </Select>
);

const CheckboxItem = ({ label, checked, onChange }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`p-3 rounded-lg border cursor-pointer transition-all ${
      checked 
        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
        : 'bg-slate-800 border-slate-700 text-slate-400'
    }`}
  >
    <span className="text-sm">{label}</span>
  </div>
);

export default function NewShop() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [formData, setFormData] = useState({
    // Section 1: Shop & Owner Details
    shop_name: '',
    owner_name: '',
    owner_email: '',
    phone_number: '',
    physical_address: '',
    municipality: '',
    ward: '',
    gps_latitude: null,
    gps_longitude: null,
    gps_accuracy: null,
    
    // Section 2: Business Registration & Compliance
    is_cipc_registered: false,
    cipc_number: '',
    has_business_bank_account: false,
    bank_name: '',
    has_coa: false,
    coa_number: '',
    
    // Section 3: Infrastructure & Operations
    years_operating: '',
    structure_type: '',
    structure_type_other: '',
    shop_size: '',
    storage_types: [],
    storage_other: '',
    products_sold: [],
    products_other: '',
    
    // Section 4: General Hygiene
    hygiene_overall_cleanliness: null,
    hygiene_waste_usage: '',
    hygiene_waste_other: '',
    hygiene_no_dust_dirt: null,
    hygiene_handwashing: null,
    hygiene_animals_pets: null,
    hygiene_other: '',
    
    // Section 5: Food Safety
    food_stored_on_floor: null,
    food_expired_damaged: null,
    food_within_expiry: null,
    food_separated: null,
    food_safety_other: '',
    
    // Section 6: General & Safety Requirements
    safety_lighting_ventilation: null,
    safety_floors_walls_ceiling: null,
    safety_cleaning_materials: null,
    safety_signage_hazards: null,
    safety_disability_accessible: null,
    safety_not_living_space: null,
    
    // Section 7: YMS Observations
    yms_observations: '',
    
    // Part 2 - Section A: Digital & Payment Systems
    payment_methods: [],
    has_pos_system: null,
    
    // Section B: Ordering, Delivery & Collection
    ordering_sources: [],
    makes_deliveries: null,
    customers_can_collect: null,
    collection_methods: [],
    
    // Section C: Community Service Potential
    collection_point_services: [],
    space_security_adequate: null,
    
    // Section D: Business Activity & Support Needs
    monthly_turnover: '',
    num_employees: '',
    support_needed: [],
    
    // Section E: NEF Grant Eligibility
    nef_sa_citizen_valid_id: null,
    nef_cipc_registered: null,
    nef_bank_account_willing: null,
    nef_sars_registered_willing: null,
    nef_valid_coa: null,
    nef_fixed_structure: null,
    nef_min_6_months: null,
    nef_basic_hygiene: null,
    nef_willing_training: null,
    nef_growth_potential: null,
    
    // Photos
    shop_photo_url: '',
    owner_photo_url: '',
    interior_photo_url: '',
    
    // Signatures & Consent
    consent_given: false,
    owner_signature_url: '',
    fieldworker_signature_url: ''
  });

  const createShop = useMutation({
    mutationFn: async (data) => {
      if (isOnline) {
        return await base44.entities.Shop.create(data);
      } else {
        // Save offline
        const id = await offlineStorage.saveShop(data);
        return { id, offline: true };
      }
    },
    onSuccess: (result) => {
      if (result.offline) {
        navigate(createPageUrl('Shops'));
      } else {
        navigate(createPageUrl(`ShopDetail?id=${result.id}`));
      }
    }
  });

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

  const captureGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude,
            gps_accuracy: Math.round(position.coords.accuracy)
          }));
          setGpsLoading(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = () => {
    const shopData = {
      ...formData,
      compliance_status: 'pending',
      funding_status: 'pending_review',
      risk_level: 'medium',
      consent_date: formData.consent_given ? new Date().toISOString() : null
    };
    createShop.mutate(shopData);
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.shop_name && formData.owner_name && formData.municipality;
      case 9: return formData.consent_given;
      default: return true;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <SyncManager />
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to={createPageUrl('Shops')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Spaza Shop Assessment</h1>
            <p className="text-slate-400 text-sm">Step {currentStep} of {steps.length}</p>
          </div>
          {!isOnline && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
        <Progress value={progress} className="h-2 bg-slate-700" />
      </div>

      <StepIndicator currentStep={currentStep} />

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 max-w-2xl mx-auto">
        <CardContent className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Shop & Owner Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <User className="w-10 h-10 text-cyan-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 1: Shop & Owner Details</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-white text-sm">Store Name *</Label>
                      <Input
                        value={formData.shop_name}
                        onChange={(e) => updateField('shop_name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-white text-sm">Full Name *</Label>
                      <Input
                        value={formData.owner_name}
                        onChange={(e) => updateField('owner_name', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Email</Label>
                        <Input
                          type="email"
                          value={formData.owner_email}
                          onChange={(e) => updateField('owner_email', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Contact Number</Label>
                        <Input
                          value={formData.phone_number}
                          onChange={(e) => updateField('phone_number', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-white text-sm">Physical Address</Label>
                      <Textarea
                        value={formData.physical_address}
                        onChange={(e) => updateField('physical_address', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white min-h-16"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Municipality *</Label>
                        <Select value={formData.municipality} onValueChange={(v) => updateField('municipality', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
                            <SelectItem value="Mandeni">Mandeni</SelectItem>
                            <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
                            <SelectItem value="Maphumulo">Maphumulo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Ward No.</Label>
                        <Input
                          value={formData.ward}
                          onChange={(e) => updateField('ward', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={captureGPS}
                      disabled={gpsLoading}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                    >
                      {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      {gpsLoading ? 'Acquiring GPS...' : 'Capture GPS Location'}
                    </Button>

                    {formData.gps_latitude && (
                      <div className="p-3 bg-slate-800 rounded-lg text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Coordinates</span>
                          <span className="text-white font-mono text-xs">
                            {formData.gps_latitude.toFixed(6)}, {formData.gps_longitude.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Business Registration & Compliance */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <FileText className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 2: Business Registration & Compliance</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <Label className="text-white">Registered with CIPC?</Label>
                      <YesNoSelect 
                        value={formData.is_cipc_registered ? 'yes' : formData.is_cipc_registered === false ? 'no' : ''} 
                        onChange={(v) => updateField('is_cipc_registered', v === 'yes')} 
                      />
                    </div>

                    {formData.is_cipc_registered && (
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Registration No.</Label>
                        <Input
                          value={formData.cipc_number}
                          onChange={(e) => updateField('cipc_number', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <Label className="text-white">Business bank account?</Label>
                      <YesNoSelect 
                        value={formData.has_business_bank_account ? 'yes' : formData.has_business_bank_account === false ? 'no' : ''} 
                        onChange={(v) => updateField('has_business_bank_account', v === 'yes')} 
                      />
                    </div>

                    {formData.has_business_bank_account && (
                      <div className="space-y-1">
                        <Label className="text-white text-sm">Bank Name</Label>
                        <Input
                          value={formData.bank_name}
                          onChange={(e) => updateField('bank_name', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <Label className="text-white">Municipal CoA for Food Handling?</Label>
                      <YesNoSelect 
                        value={formData.has_coa ? 'yes' : formData.has_coa === false ? 'no' : ''} 
                        onChange={(v) => updateField('has_coa', v === 'yes')} 
                      />
                    </div>

                    {formData.has_coa && (
                      <div className="space-y-1">
                        <Label className="text-white text-sm">CoA No.</Label>
                        <Input
                          value={formData.coa_number}
                          onChange={(e) => updateField('coa_number', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Infrastructure & Operations */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Building className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 3: Infrastructure & Operations</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-white text-sm">Years operating</Label>
                      <Input
                        type="number"
                        value={formData.years_operating}
                        onChange={(e) => updateField('years_operating', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white text-sm">Type of structure</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'container', label: 'Container' },
                          { value: 'temporary', label: 'Temporary Structure' },
                          { value: 'standalone', label: 'Stand-alone' },
                          { value: 'residential', label: 'Residential Property' },
                          { value: 'other', label: 'Other' }
                        ].map(opt => (
                          <CheckboxItem 
                            key={opt.value}
                            label={opt.label}
                            checked={formData.structure_type === opt.value}
                            onChange={() => updateField('structure_type', opt.value)}
                          />
                        ))}
                      </div>
                      {formData.structure_type === 'other' && (
                        <Input
                          placeholder="Specify..."
                          value={formData.structure_type_other}
                          onChange={(e) => updateField('structure_type_other', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white text-sm">Shop size</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['small', 'medium', 'large'].map(size => (
                          <CheckboxItem 
                            key={size}
                            label={size.charAt(0).toUpperCase() + size.slice(1)}
                            checked={formData.shop_size === size}
                            onChange={() => updateField('shop_size', size)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white text-sm">Storage (Select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'fridge', label: 'Fridge' },
                          { value: 'freezer', label: 'Freezer' },
                          { value: 'shelves', label: 'Shelves' },
                          { value: 'other', label: 'Other' }
                        ].map(opt => (
                          <CheckboxItem 
                            key={opt.value}
                            label={opt.label}
                            checked={formData.storage_types.includes(opt.value)}
                            onChange={() => toggleArrayField('storage_types', opt.value)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white text-sm">Products (Select all that apply)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'groceries', label: 'Groceries' },
                          { value: 'beverages', label: 'Beverages' },
                          { value: 'snacks', label: 'Snacks' },
                          { value: 'bread', label: 'Bread' },
                          { value: 'dairy', label: 'Dairy' },
                          { value: 'fresh_produce', label: 'Fresh Produce' },
                          { value: 'cooked_food', label: 'Cooked Food' },
                          { value: 'airtime', label: 'Airtime' },
                          { value: 'other', label: 'Other' }
                        ].map(opt => (
                          <CheckboxItem 
                            key={opt.value}
                            label={opt.label}
                            checked={formData.products_sold.includes(opt.value)}
                            onChange={() => toggleArrayField('products_sold', opt.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: General Hygiene */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 4: General Hygiene</h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { field: 'hygiene_overall_cleanliness', label: 'Acceptable Overall Cleanliness' },
                      { field: 'hygiene_no_dust_dirt', label: 'No Excessive Dust and/or Dirt on Surfaces' },
                      { field: 'hygiene_handwashing', label: 'Hand-washing' },
                      { field: 'hygiene_animals_pets', label: 'Animals/Pets on Premises' }
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <Label className="text-white text-sm">{item.label}</Label>
                        <YesNoSelect 
                          value={formData[item.field] === true ? 'yes' : formData[item.field] === false ? 'no' : ''} 
                          onChange={(v) => updateField(item.field, v === 'yes')} 
                        />
                      </div>
                    ))}

                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <Label className="text-white text-sm">Acceptable Waste Usage</Label>
                      <YesNoSelect 
                        value={formData.hygiene_waste_usage} 
                        onChange={(v) => updateField('hygiene_waste_usage', v)} 
                        includeOther
                      />
                    </div>

                    {formData.hygiene_waste_usage === 'other' && (
                      <Input
                        placeholder="Specify..."
                        value={formData.hygiene_waste_other}
                        onChange={(e) => updateField('hygiene_waste_other', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    )}

                    <div className="space-y-1">
                      <Label className="text-white text-sm">Other (Specify)</Label>
                      <Input
                        value={formData.hygiene_other}
                        onChange={(e) => updateField('hygiene_other', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Food Safety */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Utensils className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 5: Food Safety</h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { field: 'food_stored_on_floor', label: 'Food Stored Directly on Floor' },
                      { field: 'food_expired_damaged', label: 'Expired, Damaged, Dented Food Containers on Shelves' },
                      { field: 'food_within_expiry', label: 'Food Items Labelled within Expiry Date' },
                      { field: 'food_separated', label: 'Food & non-food items stored separately' }
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <Label className="text-white text-sm flex-1 mr-2">{item.label}</Label>
                        <YesNoSelect 
                          value={formData[item.field] === true ? 'yes' : formData[item.field] === false ? 'no' : ''} 
                          onChange={(v) => updateField(item.field, v === 'yes')} 
                        />
                      </div>
                    ))}

                    <div className="space-y-1">
                      <Label className="text-white text-sm">Other (Specify)</Label>
                      <Input
                        value={formData.food_safety_other}
                        onChange={(e) => updateField('food_safety_other', e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: General & Safety Requirements */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <ClipboardList className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section 6: General & Safety Requirements</h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { field: 'safety_lighting_ventilation', label: 'Acceptable Lighting & Ventilation' },
                      { field: 'safety_floors_walls_ceiling', label: 'Acceptable Floors, Walls & Ceiling' },
                      { field: 'safety_cleaning_materials', label: 'Cleaning Materials on Site' },
                      { field: 'safety_signage_hazards', label: 'Safety Signage & Hazards' },
                      { field: 'safety_disability_accessible', label: 'Disability Accessible' },
                      { field: 'safety_not_living_space', label: 'Shop not used for sleeping or living purposes' }
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <Label className="text-white text-sm flex-1 mr-2">{item.label}</Label>
                        <YesNoSelect 
                          value={formData[item.field] === true ? 'yes' : formData[item.field] === false ? 'no' : ''} 
                          onChange={(v) => updateField(item.field, v === 'yes')} 
                        />
                      </div>
                    ))}

                    <div className="space-y-1">
                      <Label className="text-white text-sm">YMS Observations</Label>
                      <Textarea
                        value={formData.yms_observations}
                        onChange={(e) => updateField('yms_observations', e.target.value)}
                        placeholder="Field agent observations..."
                        className="bg-slate-800 border-slate-700 text-white min-h-24"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Business Development */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <CreditCard className="w-10 h-10 text-cyan-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Part 2: Business Development</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Section A: Digital & Payment */}
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <h3 className="text-cyan-400 text-sm font-medium mb-3">Section A: Digital & Payment Systems</h3>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Payments</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {['cash', 'card', 'eft', 'mobile'].map(method => (
                            <CheckboxItem 
                              key={method}
                              label={method.toUpperCase()}
                              checked={formData.payment_methods.includes(method)}
                              onChange={() => toggleArrayField('payment_methods', method)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mt-3">
                        <Label className="text-white text-sm">Point Of Sale (POS) system?</Label>
                        <YesNoSelect 
                          value={formData.has_pos_system === true ? 'yes' : formData.has_pos_system === false ? 'no' : ''} 
                          onChange={(v) => updateField('has_pos_system', v === 'yes')} 
                        />
                      </div>
                    </div>

                    {/* Section B: Ordering */}
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <h3 className="text-cyan-400 text-sm font-medium mb-3">Section B: Ordering, Delivery & Collection</h3>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Where do you order?</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'cash_and_carry', label: 'Cash & Carry' },
                            { value: 'local', label: 'Local' },
                            { value: 'informal', label: 'Informal' },
                            { value: 'group_buying', label: 'Group buying' }
                          ].map(opt => (
                            <CheckboxItem 
                              key={opt.value}
                              label={opt.label}
                              checked={formData.ordering_sources.includes(opt.value)}
                              onChange={() => toggleArrayField('ordering_sources', opt.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mt-3">
                        <Label className="text-white text-sm">Do you make deliveries?</Label>
                        <YesNoSelect 
                          value={formData.makes_deliveries === true ? 'yes' : formData.makes_deliveries === false ? 'no' : ''} 
                          onChange={(v) => updateField('makes_deliveries', v === 'yes')} 
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mt-2">
                        <Label className="text-white text-sm">Can customers order and collect?</Label>
                        <YesNoSelect 
                          value={formData.customers_can_collect === true ? 'yes' : formData.customers_can_collect === false ? 'no' : ''} 
                          onChange={(v) => updateField('customers_can_collect', v === 'yes')} 
                        />
                      </div>
                      {formData.customers_can_collect && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {['phone_call', 'online'].map(method => (
                            <CheckboxItem 
                              key={method}
                              label={method === 'phone_call' ? 'Phone Call' : 'Online'}
                              checked={formData.collection_methods.includes(method)}
                              onChange={() => toggleArrayField('collection_methods', method)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section C: Community Service */}
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <h3 className="text-cyan-400 text-sm font-medium mb-3">Section C: Community Service Potential</h3>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Collection point for:</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'medication', label: 'Medication' },
                            { value: 'govt_parcels', label: 'Govt parcels' },
                            { value: 'ecommerce', label: 'E-commerce' },
                            { value: 'none', label: 'No' }
                          ].map(opt => (
                            <CheckboxItem 
                              key={opt.value}
                              label={opt.label}
                              checked={formData.collection_point_services.includes(opt.value)}
                              onChange={() => toggleArrayField('collection_point_services', opt.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mt-3">
                        <Label className="text-white text-sm">Space & security adequate?</Label>
                        <YesNoSelect 
                          value={formData.space_security_adequate === true ? 'yes' : formData.space_security_adequate === false ? 'no' : ''} 
                          onChange={(v) => updateField('space_security_adequate', v === 'yes')} 
                        />
                      </div>
                    </div>

                    {/* Section D: Business Activity */}
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <h3 className="text-cyan-400 text-sm font-medium mb-3">Section D: Business Activity & Support Needs</h3>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Monthly turnover</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'less_than_5k', label: '<R5k' },
                            { value: '5k_to_10k', label: 'R5k–R10k' },
                            { value: 'more_than_10k', label: '>R10k' }
                          ].map(opt => (
                            <CheckboxItem 
                              key={opt.value}
                              label={opt.label}
                              checked={formData.monthly_turnover === opt.value}
                              onChange={() => updateField('monthly_turnover', opt.value)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        <Label className="text-white text-sm">No. of Employees</Label>
                        <Input
                          type="number"
                          value={formData.num_employees}
                          onChange={(e) => updateField('num_employees', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2 mt-3">
                        <Label className="text-white text-sm">Support needed</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'registration', label: 'Registration' },
                            { value: 'banking', label: 'Banking' },
                            { value: 'food_safety', label: 'Food Safety' },
                            { value: 'equipment', label: 'Equipment' },
                            { value: 'pos', label: 'POS' }
                          ].map(opt => (
                            <CheckboxItem 
                              key={opt.value}
                              label={opt.label}
                              checked={formData.support_needed.includes(opt.value)}
                              onChange={() => toggleArrayField('support_needed', opt.value)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: NEF Grant Eligibility */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Award className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Section E: Spaza Shop NEF Grant Eligibility</h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { field: 'nef_sa_citizen_valid_id', label: 'South African citizen with valid ID' },
                      { field: 'nef_cipc_registered', label: 'Registered business with CIPC' },
                      { field: 'nef_bank_account_willing', label: 'Business bank account (or willing to open one)' },
                      { field: 'nef_sars_registered_willing', label: 'SARS Tax Number (or willing to register)' },
                      { field: 'nef_valid_coa', label: 'Valid Municipal COA for food handling' },
                      { field: 'nef_fixed_structure', label: 'Operates from a fixed structure' },
                      { field: 'nef_min_6_months', label: 'In operation for at least 6 months' },
                      { field: 'nef_basic_hygiene', label: 'Comply with basic hygiene standards' },
                      { field: 'nef_willing_training', label: 'Willing to participate in training/support' },
                      { field: 'nef_growth_potential', label: 'Demonstrates potential to sustain and grow' }
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <Label className="text-white text-sm flex-1 mr-2">{item.label}</Label>
                        <YesNoSelect 
                          value={formData[item.field] === true ? 'yes' : formData[item.field] === false ? 'no' : ''} 
                          onChange={(v) => updateField(item.field, v === 'yes')} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 9: Photos & Declaration */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <Camera className="w-10 h-10 text-red-500 mx-auto mb-2" />
                    <h2 className="text-lg font-semibold text-white">Photos & Declaration</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PhotoUpload
                      label="Shop Front"
                      value={formData.shop_photo_url}
                      onChange={(url) => updateField('shop_photo_url', url)}
                    />
                    <PhotoUpload
                      label="Interior"
                      value={formData.interior_photo_url}
                      onChange={(url) => updateField('interior_photo_url', url)}
                    />
                  </div>

                  <PhotoUpload
                    label="Owner Photo"
                    value={formData.owner_photo_url}
                    onChange={(url) => updateField('owner_photo_url', url)}
                  />

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <h3 className="text-white font-medium mb-3">Section F: Declaration</h3>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent"
                        checked={formData.consent_given}
                        onCheckedChange={(checked) => updateField('consent_given', checked)}
                        className="mt-1"
                      />
                      <label htmlFor="consent" className="text-sm text-slate-300 cursor-pointer">
                        The shop owner has consented to the collection and processing of their personal data for compliance monitoring and NEF funding eligibility assessment purposes.
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              className="border-slate-600 text-white hover:bg-slate-700 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || createShop.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white gap-2 min-w-32"
              >
                {createShop.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isOnline ? 'Submit' : 'Save Offline'}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-slate-600 text-xs">
          YMS-SEF: Final_Spaza_Shop_Assessment_Form
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Created by <span className="text-cyan-400 font-semibold">Kwahlelwa Group</span>
        </p>
      </div>
    </div>
  );
}