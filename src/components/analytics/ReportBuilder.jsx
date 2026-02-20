/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 *
 * This source code is confidential and proprietary.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 *
 * Patent Pending - ZA Provisional Application
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Download, 
  Calendar,
  Filter,
  Columns,
  Clock,
  Trash2,
  Play,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_FIELDS = {
  shop: [
    { id: 'shop_name', label: 'Shop Name', category: 'Basic' },
    { id: 'owner_name', label: 'Owner Name', category: 'Basic' },
    { id: 'municipality', label: 'Municipality', category: 'Location' },
    { id: 'ward', label: 'Ward', category: 'Location' },
    { id: 'compliance_status', label: 'Compliance Status', category: 'Compliance' },
    { id: 'compliance_score', label: 'Compliance Score', category: 'Compliance' },
    { id: 'funding_status', label: 'Funding Status', category: 'Funding' },
    { id: 'risk_level', label: 'Risk Level', category: 'Compliance' },
    { id: 'owner_pdg_status', label: 'PDG Status', category: 'Demographics' },
    { id: 'owner_gender', label: 'Owner Gender', category: 'Demographics' },
    { id: 'owner_education_level', label: 'Owner Education', category: 'Demographics' },
    { id: 'num_employees', label: 'Employee Count', category: 'Employment' },
    { id: 'land_ownership_type', label: 'Land Ownership', category: 'Tenure' },
    { id: 'tenure_security_status', label: 'Tenure Security', category: 'Tenure' },
    { id: 'has_coa', label: 'Has CoA', category: 'Documents' },
    { id: 'has_business_bank_account', label: 'Bank Account', category: 'Documents' },
    { id: 'trading_months', label: 'Months Trading', category: 'Basic' }
  ],
  inspection: [
    { id: 'inspection_type', label: 'Inspection Type', category: 'Basic' },
    { id: 'total_score', label: 'Score', category: 'Results' },
    { id: 'status', label: 'Status', category: 'Results' },
    { id: 'inspector_name', label: 'Inspector', category: 'Basic' },
    { id: 'created_date', label: 'Date', category: 'Basic' }
  ]
};

const SAVED_REPORTS = [
  { id: 1, name: 'NEF Funding Eligibility', fields: ['shop_name', 'owner_name', 'compliance_score', 'funding_status', 'has_business_bank_account'], filters: { compliance_status: 'compliant' }, schedule: 'weekly' },
  { id: 2, name: 'High Risk Shops', fields: ['shop_name', 'municipality', 'risk_level', 'compliance_score'], filters: { risk_level: 'high' }, schedule: 'daily' },
  { id: 3, name: 'Youth & Women Owned', fields: ['shop_name', 'owner_name', 'owner_gender', 'owner_pdg_status', 'num_employees'], filters: {}, schedule: null }
];

export default function ReportBuilder({ shops = [], inspections = [], onExport }) {
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);
  const [dataSource, setDataSource] = useState('shop');
  const [filters, setFilters] = useState({});
  const [schedule, setSchedule] = useState('none');
  const [savedReports, setSavedReports] = useState(SAVED_REPORTS);
  const [showBuilder, setShowBuilder] = useState(false);

  const toggleField = (fieldId) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const generateReport = () => {
    const data = dataSource === 'shop' ? shops : inspections;
    const fields = AVAILABLE_FIELDS[dataSource].filter(f => selectedFields.includes(f.id));
    
    // Apply filters
    let filtered = data;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => item[key] === value);
      }
    });

    // Generate CSV
    const headers = fields.map(f => f.label).join(',');
    const rows = filtered.map(item => 
      fields.map(f => {
        const val = item[f.id];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const saveReport = () => {
    if (!reportName) return;
    const newReport = {
      id: Date.now(),
      name: reportName,
      fields: selectedFields,
      filters,
      schedule: schedule !== 'none' ? schedule : null
    };
    setSavedReports(prev => [...prev, newReport]);
    setReportName('');
    setSelectedFields([]);
    setFilters({});
    setSchedule('none');
    setShowBuilder(false);
  };

  const runSavedReport = (report) => {
    setSelectedFields(report.fields);
    setFilters(report.filters);
    setReportName(report.name);
    generateReport();
  };

  const groupedFields = AVAILABLE_FIELDS[dataSource].reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Saved Reports */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50 flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Saved Reports
          </CardTitle>
          <Button 
            onClick={() => setShowBuilder(!showBuilder)}
            className="bg-cyan-600 hover:bg-cyan-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-3">
            {savedReports.map(report => (
              <div 
                key={report.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{report.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-slate-700 text-slate-300 text-xs">
                        {report.fields.length} fields
                      </Badge>
                      {report.schedule && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs gap-1">
                          <Clock className="w-3 h-3" />
                          {report.schedule}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => runSavedReport(report)}
                    className="border-slate-600 text-white gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSavedReports(prev => prev.filter(r => r.id !== report.id))}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Builder */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
              <CardHeader className="border-b border-slate-700/50">
                <CardTitle className="text-white">Build Custom Report</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                {/* Report Name & Source */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Report Name</Label>
                    <Input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="e.g. Monthly Compliance Summary"
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Data Source</Label>
                    <Select value={dataSource} onValueChange={setDataSource}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="shop">Shop Data</SelectItem>
                        <SelectItem value="inspection">Inspection Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Field Selection */}
                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Columns className="w-4 h-4 text-cyan-400" />
                    Select Fields
                  </Label>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedFields).map(([category, fields]) => (
                      <div key={category} className="space-y-2">
                        <p className="text-slate-400 text-sm font-medium">{category}</p>
                        <div className="space-y-1">
                          {fields.map(field => (
                            <div
                              key={field.id}
                              onClick={() => toggleField(field.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedFields.includes(field.id)
                                  ? 'bg-cyan-500/20 border border-cyan-500/50'
                                  : 'bg-slate-800/50 border border-transparent hover:bg-slate-700/50'
                              }`}
                            >
                              <Checkbox 
                                checked={selectedFields.includes(field.id)}
                                className="pointer-events-none"
                              />
                              <span className="text-slate-300 text-sm">{field.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Filter className="w-4 h-4 text-amber-400" />
                    Filters
                  </Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Compliance Status</Label>
                      <Select value={filters.compliance_status || ''} onValueChange={(v) => setFilters(prev => ({ ...prev, compliance_status: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null}>All</SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Municipality</Label>
                      <Select value={filters.municipality || ''} onValueChange={(v) => setFilters(prev => ({ ...prev, municipality: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null}>All</SelectItem>
                          <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
                          <SelectItem value="Mandeni">Mandeni</SelectItem>
                          <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
                          <SelectItem value="Maphumulo">Maphumulo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Risk Level</Label>
                      <Select value={filters.risk_level || ''} onValueChange={(v) => setFilters(prev => ({ ...prev, risk_level: v }))}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null}>All</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-3">
                  <Label className="text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Schedule
                  </Label>
                  <Select value={schedule} onValueChange={setSchedule}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">No Schedule</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <Button
                    onClick={generateReport}
                    disabled={selectedFields.length === 0}
                    className="bg-cyan-600 hover:bg-cyan-700 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Generate & Download
                  </Button>
                  <Button
                    onClick={saveReport}
                    disabled={!reportName || selectedFields.length === 0}
                    variant="outline"
                    className="border-slate-600 text-white gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}