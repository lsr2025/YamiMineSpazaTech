import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  GraduationCap
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Location', icon: MapPin },
  { id: 2, title: 'Owner Info', icon: User },
  { id: 3, title: 'Land & Tenure', icon: Home },
  { id: 4, title: 'Employees', icon: Users },
  { id: 5, title: 'Shop Details', icon: Store },
  { id: 6, title: 'Documents', icon: FileText },
  { id: 7, title: 'Photos', icon: Camera }
];

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-between mb-8 px-2">
    {steps.map((step, index) => {
      const Icon = step.icon;
      const isActive = currentStep === step.id;
      const isCompleted = currentStep > step.id;

      return (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${isCompleted ? 'bg-emerald-500 text-white' : 
                isActive ? 'bg-red-600 text-white' : 
                'bg-slate-700 text-slate-400'}
            `}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs mt-2 hidden md:block ${isActive ? 'text-white' : 'text-slate-400'}`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-8 md:w-16 mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-700'}`} />
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
          <div className="relative h-40 rounded-lg overflow-hidden border border-slate-700">
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
          <label className="flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-500 transition-colors cursor-pointer bg-slate-800/50">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-slate-400 text-sm">Tap to capture</span>
              </>
            )}
          </label>
        )}
      </div>
      {description && <p className="text-slate-500 text-xs">{description}</p>}
    </div>
  );
};

export default function NewShop() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  
  const [formData, setFormData] = useState({
    // Location
    gps_latitude: null,
    gps_longitude: null,
    gps_accuracy: null,
    ward: '',
    municipality: '',
    
    // Owner Info
    shop_name: '',
    owner_name: '',
    owner_id_number: '',
    owner_nationality: 'south_african',
    owner_gender: '',
    owner_age_group: '',
    owner_education_level: '',
    owner_pdg_status: '',
    owner_disability_status: false,
    owner_youth_status: false,
    owner_woman_owned: false,
    phone_number: '',
    
    // Land & Tenure
    land_ownership_type: '',
    tenure_security_status: '',
    tenure_documentation: [],
    monthly_rent: '',
    
    // Employees
    num_employees: 0,
    num_employees_fulltime: 0,
    num_employees_parttime: 0,
    num_employees_male: 0,
    num_employees_female: 0,
    num_employees_youth: 0,
    num_employees_disabled: 0,
    employees_pdg_breakdown: {
      black_african: 0,
      coloured: 0,
      indian_asian: 0,
      white: 0,
      other: 0
    },
    employees_education_breakdown: {
      no_formal: 0,
      primary: 0,
      secondary: 0,
      matric: 0,
      tertiary: 0
    },
    
    // Shop Details
    structure_type: '',
    services: [],
    stock_categories: [],
    trading_months: '',
    
    // Documents
    trading_permit_number: '',
    trading_permit_expiry: '',
    has_coa: false,
    coa_number: '',
    coa_expiry: '',
    has_business_bank_account: false,
    is_sars_registered: false,
    cipc_number: '',
    
    // Photos
    shop_photo_url: '',
    owner_photo_url: '',
    interior_photo_url: '',
    
    // Consent
    consent_given: false,
    
    // Notes
    notes: ''
  });

  const createShop = useMutation({
    mutationFn: (data) => base44.entities.Shop.create(data),
    onSuccess: (result) => {
      navigate(createPageUrl(`ShopDetail?id=${result.id}`));
    }
  });

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
          setGpsAccuracy(Math.round(position.coords.accuracy));
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
      consent_date: formData.consent_given ? new Date().toISOString() : null,
      trading_months: formData.trading_months ? parseInt(formData.trading_months) : null
    };
    createShop.mutate(shopData);
  };

  const updatePdgBreakdown = (field, value) => {
    setFormData(prev => ({
      ...prev,
      employees_pdg_breakdown: {
        ...prev.employees_pdg_breakdown,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const updateEducationBreakdown = (field, value) => {
    setFormData(prev => ({
      ...prev,
      employees_education_breakdown: {
        ...prev.employees_education_breakdown,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1: return formData.gps_latitude && formData.municipality;
      case 2: return formData.shop_name && formData.owner_name;
      case 3: return true; // Land & Tenure
      case 4: return true; // Employees
      case 5: return formData.structure_type; // Shop Details
      case 6: return true; // Documents
      case 7: return formData.consent_given; // Photos
      default: return true;
    }
  };

  const progress = (currentStep / steps.length) * 100;

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
          <div>
            <h1 className="text-2xl font-bold text-white">Profile New Shop</h1>
            <p className="text-slate-400 text-sm">Step {currentStep} of {steps.length}</p>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-slate-700" />
      </div>

      <StepIndicator currentStep={currentStep} />

      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 max-w-2xl mx-auto">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Location */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <MapPin className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Capture Location</h2>
                    <p className="text-slate-400 text-sm">Get precise GPS coordinates</p>
                  </div>

                  <Button
                    onClick={captureGPS}
                    disabled={gpsLoading}
                    className="w-full h-16 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white gap-3"
                  >
                    {gpsLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Navigation className="w-6 h-6" />
                    )}
                    {gpsLoading ? 'Acquiring GPS...' : 'Capture GPS Location'}
                  </Button>

                  {formData.gps_latitude && (
                    <div className="p-4 bg-slate-800 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Latitude</span>
                        <span className="text-white font-mono">{formData.gps_latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Longitude</span>
                        <span className="text-white font-mono">{formData.gps_longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Accuracy</span>
                        <span className={`font-mono ${gpsAccuracy <= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ±{gpsAccuracy}m
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-white">Municipality *</Label>
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
                    <div className="space-y-2">
                      <Label className="text-white">Ward Number</Label>
                      <Input
                        value={formData.ward}
                        onChange={(e) => updateField('ward', e.target.value)}
                        placeholder="e.g. 5"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Owner Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <User className="w-12 h-12 text-cyan-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Owner Information</h2>
                    <p className="text-slate-400 text-sm">Capture owner details & demographics</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Shop Name *</Label>
                      <Input
                        value={formData.shop_name}
                        onChange={(e) => updateField('shop_name', e.target.value)}
                        placeholder="e.g. Mama's Spaza"
                        className="bg-slate-800 border-slate-700 text-white h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Owner Full Name *</Label>
                      <Input
                        value={formData.owner_name}
                        onChange={(e) => updateField('owner_name', e.target.value)}
                        placeholder="Full name as per ID"
                        className="bg-slate-800 border-slate-700 text-white h-12"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Nationality</Label>
                        <Select value={formData.owner_nationality} onValueChange={(v) => updateField('owner_nationality', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="south_african">🇿🇦 South African</SelectItem>
                            <SelectItem value="zimbabwean">🇿🇼 Zimbabwean</SelectItem>
                            <SelectItem value="mozambican">🇲🇿 Mozambican</SelectItem>
                            <SelectItem value="malawian">🇲🇼 Malawian</SelectItem>
                            <SelectItem value="ethiopian">🇪🇹 Ethiopian</SelectItem>
                            <SelectItem value="somali">🇸🇴 Somali</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">ID Number</Label>
                        <Input
                          value={formData.owner_id_number}
                          onChange={(e) => updateField('owner_id_number', e.target.value)}
                          placeholder="13-digit ID"
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Gender</Label>
                        <Select value={formData.owner_gender} onValueChange={(v) => updateField('owner_gender', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Age Group</Label>
                        <Select value={formData.owner_age_group} onValueChange={(v) => updateField('owner_age_group', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="18-25">18-25</SelectItem>
                            <SelectItem value="26-35">26-35</SelectItem>
                            <SelectItem value="36-45">36-45</SelectItem>
                            <SelectItem value="46-55">46-55</SelectItem>
                            <SelectItem value="56-65">56-65</SelectItem>
                            <SelectItem value="65+">65+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">PDG Classification</Label>
                        <Select value={formData.owner_pdg_status} onValueChange={(v) => updateField('owner_pdg_status', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="black_african">Black African</SelectItem>
                            <SelectItem value="coloured">Coloured</SelectItem>
                            <SelectItem value="indian_asian">Indian/Asian</SelectItem>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Education Level</Label>
                        <Select value={formData.owner_education_level} onValueChange={(v) => updateField('owner_education_level', v)}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="no_formal">No Formal Education</SelectItem>
                            <SelectItem value="primary">Primary School</SelectItem>
                            <SelectItem value="secondary">Secondary School</SelectItem>
                            <SelectItem value="matric">Matric</SelectItem>
                            <SelectItem value="diploma">Diploma/Certificate</SelectItem>
                            <SelectItem value="degree">Degree</SelectItem>
                            <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Phone Number</Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) => updateField('phone_number', e.target.value)}
                        placeholder="e.g. 0821234567"
                        className="bg-slate-800 border-slate-700 text-white h-12"
                      />
                    </div>

                    <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                      <Label className="text-white font-medium">Special Categories</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Youth-Owned (18-35 years)</Label>
                          <Checkbox
                            checked={formData.owner_youth_status}
                            onCheckedChange={(checked) => updateField('owner_youth_status', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Woman-Owned Business</Label>
                          <Checkbox
                            checked={formData.owner_woman_owned}
                            onCheckedChange={(checked) => updateField('owner_woman_owned', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-300">Owner has Disability</Label>
                          <Checkbox
                            checked={formData.owner_disability_status}
                            onCheckedChange={(checked) => updateField('owner_disability_status', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Land & Tenure */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Home className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Land Ownership & Tenure</h2>
                    <p className="text-slate-400 text-sm">Tenure security assessment</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Land Ownership Type</Label>
                      <Select value={formData.land_ownership_type} onValueChange={(v) => updateField('land_ownership_type', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                          <SelectValue placeholder="Select ownership type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="owned_freehold">Owned - Freehold Title</SelectItem>
                          <SelectItem value="owned_traditional">Owned - Traditional/Communal</SelectItem>
                          <SelectItem value="leased_formal">Leased - Formal Agreement</SelectItem>
                          <SelectItem value="leased_informal">Leased - Informal Agreement</SelectItem>
                          <SelectItem value="family_land">Family Land</SelectItem>
                          <SelectItem value="municipal_land">Municipal Land</SelectItem>
                          <SelectItem value="informal_occupation">Informal Occupation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Tenure Security Status</Label>
                      <Select value={formData.tenure_security_status} onValueChange={(v) => updateField('tenure_security_status', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                          <SelectValue placeholder="Select security level" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="secure_title_deed">Secure - Title Deed</SelectItem>
                          <SelectItem value="secure_lease">Secure - Long-term Lease</SelectItem>
                          <SelectItem value="moderately_secure">Moderately Secure</SelectItem>
                          <SelectItem value="insecure">Insecure</SelectItem>
                          <SelectItem value="highly_insecure">Highly Insecure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Tenure Documentation</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'title_deed', label: 'Title Deed' },
                          { value: 'lease_agreement', label: 'Lease Agreement' },
                          { value: 'permission_to_occupy', label: 'Permission to Occupy' },
                          { value: 'tribal_authority_letter', label: 'Tribal Authority Letter' },
                          { value: 'municipal_permit', label: 'Municipal Permit' },
                          { value: 'none', label: 'No Documentation' }
                        ].map(doc => (
                          <div
                            key={doc.value}
                            onClick={() => toggleArrayField('tenure_documentation', doc.value)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.tenure_documentation.includes(doc.value)
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <span className="text-sm">{doc.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(formData.land_ownership_type === 'leased_formal' || formData.land_ownership_type === 'leased_informal') && (
                      <div className="space-y-2">
                        <Label className="text-white">Monthly Rent (ZAR)</Label>
                        <Input
                          type="number"
                          value={formData.monthly_rent}
                          onChange={(e) => updateField('monthly_rent', e.target.value)}
                          placeholder="e.g. 2500"
                          className="bg-slate-800 border-slate-700 text-white h-12"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Employees */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Employee Information</h2>
                    <p className="text-slate-400 text-sm">Staff demographics & education</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Total Employees</Label>
                        <Input
                          type="number"
                          value={formData.num_employees}
                          onChange={(e) => updateField('num_employees', parseInt(e.target.value) || 0)}
                          className="bg-slate-800 border-slate-700 text-white h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Full-time</Label>
                        <Input
                          type="number"
                          value={formData.num_employees_fulltime}
                          onChange={(e) => updateField('num_employees_fulltime', parseInt(e.target.value) || 0)}
                          className="bg-slate-800 border-slate-700 text-white h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Part-time</Label>
                        <Input
                          type="number"
                          value={formData.num_employees_parttime}
                          onChange={(e) => updateField('num_employees_parttime', parseInt(e.target.value) || 0)}
                          className="bg-slate-800 border-slate-700 text-white h-12"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                      <Label className="text-white font-medium">Gender & Demographics</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-sm">Male</Label>
                          <Input
                            type="number"
                            value={formData.num_employees_male}
                            onChange={(e) => updateField('num_employees_male', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-sm">Female</Label>
                          <Input
                            type="number"
                            value={formData.num_employees_female}
                            onChange={(e) => updateField('num_employees_female', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-sm">Youth (18-35)</Label>
                          <Input
                            type="number"
                            value={formData.num_employees_youth}
                            onChange={(e) => updateField('num_employees_youth', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-sm">With Disabilities</Label>
                          <Input
                            type="number"
                            value={formData.num_employees_disabled}
                            onChange={(e) => updateField('num_employees_disabled', parseInt(e.target.value) || 0)}
                            className="bg-slate-700 border-slate-600 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                      <Label className="text-white font-medium">PDG Classification</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'black_african', label: 'Black African' },
                          { key: 'coloured', label: 'Coloured' },
                          { key: 'indian_asian', label: 'Indian/Asian' },
                          { key: 'white', label: 'White' },
                          { key: 'other', label: 'Other' }
                        ].map(pdg => (
                          <div key={pdg.key} className="space-y-2">
                            <Label className="text-slate-400 text-sm">{pdg.label}</Label>
                            <Input
                              type="number"
                              value={formData.employees_pdg_breakdown[pdg.key]}
                              onChange={(e) => updatePdgBreakdown(pdg.key, e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg space-y-4">
                      <Label className="text-white font-medium">Education Levels</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'no_formal', label: 'No Formal' },
                          { key: 'primary', label: 'Primary' },
                          { key: 'secondary', label: 'Secondary' },
                          { key: 'matric', label: 'Matric' },
                          { key: 'tertiary', label: 'Tertiary' }
                        ].map(edu => (
                          <div key={edu.key} className="space-y-2">
                            <Label className="text-slate-400 text-sm">{edu.label}</Label>
                            <Input
                              type="number"
                              value={formData.employees_education_breakdown[edu.key]}
                              onChange={(e) => updateEducationBreakdown(edu.key, e.target.value)}
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Shop Details */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Store className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Shop Details</h2>
                    <p className="text-slate-400 text-sm">Business characteristics</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Structure Type *</Label>
                      <Select value={formData.structure_type} onValueChange={(v) => updateField('structure_type', v)}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-12">
                          <SelectValue placeholder="Select structure type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="brick">Brick Building</SelectItem>
                          <SelectItem value="container">Container</SelectItem>
                          <SelectItem value="zinc">Zinc/Corrugated Iron</SelectItem>
                          <SelectItem value="prefab">Prefabricated</SelectItem>
                          <SelectItem value="mixed">Mixed Materials</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Months in Operation</Label>
                      <Input
                        type="number"
                        value={formData.trading_months}
                        onChange={(e) => updateField('trading_months', e.target.value)}
                        placeholder="e.g. 24"
                        className="bg-slate-800 border-slate-700 text-white h-12"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Services Offered</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['airtime', 'electricity', 'money_transfer', 'lottery', 'parcel_collection'].map(service => (
                          <div
                            key={service}
                            onClick={() => toggleArrayField('services', service)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.services.includes(service)
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <span className="capitalize text-sm">{service.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-white">Stock Categories</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {['perishables', 'dry_goods', 'beverages', 'tobacco', 'toiletries', 'baby_products'].map(cat => (
                          <div
                            key={cat}
                            onClick={() => toggleArrayField('stock_categories', cat)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.stock_categories.includes(cat)
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <span className="capitalize text-sm">{cat.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Documents */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <FileText className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Documentation</h2>
                    <p className="text-slate-400 text-sm">Funding eligibility info</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Trading Permit #</Label>
                        <Input
                          value={formData.trading_permit_number}
                          onChange={(e) => updateField('trading_permit_number', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Permit Expiry</Label>
                        <Input
                          type="date"
                          value={formData.trading_permit_expiry}
                          onChange={(e) => updateField('trading_permit_expiry', e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Has Certificate of Acceptability (CoA)?</Label>
                        <Checkbox
                          checked={formData.has_coa}
                          onCheckedChange={(checked) => updateField('has_coa', checked)}
                        />
                      </div>
                      {formData.has_coa && (
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="CoA Number"
                            value={formData.coa_number}
                            onChange={(e) => updateField('coa_number', e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                          <Input
                            type="date"
                            placeholder="Expiry"
                            value={formData.coa_expiry}
                            onChange={(e) => updateField('coa_expiry', e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Has Business Bank Account?</Label>
                        <Checkbox
                          checked={formData.has_business_bank_account}
                          onCheckedChange={(checked) => updateField('has_business_bank_account', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white">Registered with SARS?</Label>
                        <Checkbox
                          checked={formData.is_sars_registered}
                          onCheckedChange={(checked) => updateField('is_sars_registered', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">CIPC Registration Number</Label>
                      <Input
                        value={formData.cipc_number}
                        onChange={(e) => updateField('cipc_number', e.target.value)}
                        placeholder="If registered"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Photos & Consent */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Camera className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h2 className="text-xl font-semibold text-white">Photos & Consent</h2>
                    <p className="text-slate-400 text-sm">Visual evidence capture</p>
                  </div>

                  <div className="space-y-4">
                    <PhotoUpload
                      label="Shop Front Photo"
                      value={formData.shop_photo_url}
                      onChange={(url) => updateField('shop_photo_url', url)}
                      description="Capture shop signage and entrance"
                    />
                    <PhotoUpload
                      label="Owner Photo"
                      value={formData.owner_photo_url}
                      onChange={(url) => updateField('owner_photo_url', url)}
                      description="Photo of the owner"
                    />
                    <PhotoUpload
                      label="Interior Photo"
                      value={formData.interior_photo_url}
                      onChange={(url) => updateField('interior_photo_url', url)}
                      description="Show stock and interior condition"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      placeholder="Any additional observations..."
                      className="bg-slate-800 border-slate-700 text-white min-h-20"
                    />
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent"
                        checked={formData.consent_given}
                        onCheckedChange={(checked) => updateField('consent_given', checked)}
                        className="mt-1"
                      />
                      <label htmlFor="consent" className="text-sm text-slate-300 cursor-pointer">
                        <strong className="text-white">POPIA Consent:</strong> The shop owner has consented to the collection and processing of their personal data for compliance monitoring and funding eligibility assessment purposes.
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
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
                    Save Shop
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}