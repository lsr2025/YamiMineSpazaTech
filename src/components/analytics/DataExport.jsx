import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  FileText,
  Filter,
  Building,
  CheckCircle2,
  Loader2,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// ── Minimal Excel (XLSX) generator – no external library needed ──
function buildXLSX(headers, rows, sheetName = 'Sheet1') {
  // Simple XML-based Excel (SpreadsheetML) that Excel & Google Sheets open natively
  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const cell = (v, idx) => {
    const col = String.fromCharCode(65 + (idx % 26));
    const isNum = typeof v === 'number' && !isNaN(v);
    return isNum
      ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>`
      : `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  };
  const rowXml = (cells) => `<Row>${cells.map((v, i) => cell(v, i)).join('')}</Row>`;
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
  <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#1e3a5f" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
</Styles>
<Worksheet ss:Name="${esc(sheetName)}"><Table>
${rowXml(headers.map(h => h))}
${rows.map(r => rowXml(r)).join('\n')}
</Table></Worksheet></Workbook>`;
  return xml;
}

const ExportFormatCard = ({ format, icon: Icon, description, selected, onClick, badge }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      p-4 rounded-xl border cursor-pointer transition-all
      ${selected 
        ? 'bg-cyan-500/20 border-cyan-500/50' 
        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
      }
    `}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${selected ? 'bg-cyan-500/20' : 'bg-slate-700'}`}>
        <Icon className={`w-6 h-6 ${selected ? 'text-cyan-400' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-semibold ${selected ? 'text-cyan-400' : 'text-white'}`}>{format}</p>
          {badge && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">{badge}</Badge>
          )}
        </div>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
      {selected && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
    </div>
  </motion.div>
);

export default function DataExport({ shops, inspections }) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportType, setExportType] = useState('shops');
  const [statusFilter, setStatusFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [includePII, setIncludePII] = useState(false);
  const [exporting, setExporting] = useState(false);

  const municipalities = [...new Set(shops.map(s => s.municipality).filter(Boolean))];

  // ── helpers ──
  const escapeXml = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const csvRow = (arr) => arr.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');

  const filteredShops = () => shops.filter(s => {
    const ok1 = statusFilter === 'all' || s.compliance_status === statusFilter;
    const ok2 = municipalityFilter === 'all' || s.municipality === municipalityFilter;
    return ok1 && ok2;
  });

  const filteredInspections = () => {
    const shopIds = new Set(filteredShops().map(s => s.id));
    return inspections.filter(i => municipalityFilter === 'all' || shopIds.has(i.shop_id));
  };

  // ── SHOPS headers / rows ──
  const shopHeaders = () => {
    const h = ['Shop Name','Owner Name','Municipality','Ward','Compliance Status','Compliance Score',
      'Funding Status','Risk Level','Years Operating','Has CoA','Has Bank Account','SARS Registered',
      'CIPC Registered','Structure Type','GPS Latitude','GPS Longitude','Created Date'];
    if (includePII) h.push('Phone Number','Owner ID Number','Owner Email');
    return h;
  };

  const shopRow = (s) => {
    const r = [
      s.shop_name||'', s.owner_name||'', s.municipality||'', s.ward||'',
      s.compliance_status||'pending', s.compliance_score||'', s.funding_status||'',
      s.risk_level||'', s.years_operating||'',
      s.has_coa?'Yes':'No', s.has_business_bank_account?'Yes':'No',
      s.is_sars_registered?'Yes':'No', s.is_cipc_registered?'Yes':'No',
      s.structure_type||'', s.gps_latitude||'', s.gps_longitude||'',
      s.created_date ? format(new Date(s.created_date),'yyyy-MM-dd') : ''
    ];
    if (includePII) r.push(s.phone_number||'', s.owner_id_number||'', s.owner_email||'');
    return r;
  };

  // ── INSPECTIONS headers / rows ──
  const inspectionHeaders = () => [
    'Inspection ID','Shop ID','Inspection Type','Inspector Name','Inspector Email',
    'Check-In Time','Check-Out Time','Total Score','Status',
    'Structural Walls/Floors','Ventilation','Pest Control',
    'Handwashing','Soap & Towels','Protective Clothing',
    'Fridge Temp (°C)','Food Separation','Expired Items Count',
    'Waste Disposal','Water Supply','Chemical Storage',
    'EHP Verified','Risk Flags','Created Date'
  ];

  const inspectionRow = (i) => [
    i.id||'', i.shop_id||'', i.inspection_type||'', i.inspector_name||'', i.inspector_email||'',
    i.check_in_time ? format(new Date(i.check_in_time),'yyyy-MM-dd HH:mm') : '',
    i.check_out_time ? format(new Date(i.check_out_time),'yyyy-MM-dd HH:mm') : '',
    i.total_score||'', i.status||'',
    i.structural_walls_floors||'', i.structural_ventilation||'', i.structural_pest_control||'',
    i.hygiene_handwashing||'', i.hygiene_soap_towels||'', i.hygiene_protective_clothing||'',
    i.coldchain_fridge_temp||'', i.coldchain_separation||'', i.inventory_expired_count||0,
    i.waste_disposal||'', i.water_supply||'', i.chemical_storage||'',
    i.ehp_verified?'Yes':'No',
    Array.isArray(i.risk_flags) ? i.risk_flags.join('; ') : (i.risk_flags||''),
    i.created_date ? format(new Date(i.created_date),'yyyy-MM-dd') : ''
  ];

  // ── NEF report ──
  const nefHeaders = ['Business Name','Owner Name','Municipality','Ward','Compliance Score',
    'Years Operating','Has CoA','Bank Account','SARS Registered','CIPC Number','Funding Recommendation'];
  const nefRow = (s) => [
    s.shop_name||'', s.owner_name||'', s.municipality||'', s.ward||'',
    s.compliance_score||'', s.years_operating||'',
    s.has_coa?'Yes':'No', s.has_business_bank_account?'Yes':'No',
    s.is_sars_registered?'Yes':'No', s.cipc_number||'N/A','Eligible for NEF Support'
  ];

  const handleExport = () => {
    setExporting(true);
    const shops_ = filteredShops();
    const insp_ = filteredInspections();
    const stamp = format(new Date(), 'yyyyMMdd');

    setTimeout(() => {
      if (exportType === 'inspections') {
        const headers = inspectionHeaders();
        const rows = insp_.map(inspectionRow);
        if (exportFormat === 'xlsx') {
          triggerDownload(buildXLSX(headers, rows, 'Inspections'), `inspections_${stamp}.xls`, 'application/vnd.ms-excel');
        } else {
          triggerDownload([csvRow(headers), ...rows.map(csvRow)].join('\n'), `inspections_${stamp}.csv`, 'text/csv');
        }
      } else if (exportType === 'nef') {
        const eligible = shops_.filter(s => s.funding_status === 'eligible');
        const rows = eligible.map(nefRow);
        if (exportFormat === 'xlsx') {
          triggerDownload(buildXLSX(nefHeaders, rows, 'NEF Report'), `nef_report_${stamp}.xls`, 'application/vnd.ms-excel');
        } else {
          triggerDownload([csvRow(nefHeaders), ...rows.map(csvRow)].join('\n'), `nef_report_${stamp}.csv`, 'text/csv');
        }
      } else {
        // shops
        const headers = shopHeaders();
        const rows = shops_.map(shopRow);
        if (exportFormat === 'xlsx') {
          triggerDownload(buildXLSX(headers, rows, 'Shops'), `shops_${stamp}.xls`, 'application/vnd.ms-excel');
        } else if (exportFormat === 'xml') {
          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SpazaComplianceReport>
  <Metadata>
    <GeneratedDate>${format(new Date(),'yyyy-MM-dd HH:mm:ss')}</GeneratedDate>
    <TotalRecords>${shops_.length}</TotalRecords>
    <GeneratedBy>YamiMine Solutions</GeneratedBy>
  </Metadata>
  <Shops>
${shops_.map(s=>`    <Shop>
      <ShopName>${escapeXml(s.shop_name)}</ShopName>
      <OwnerName>${escapeXml(s.owner_name)}</OwnerName>
      <Municipality>${escapeXml(s.municipality)}</Municipality>
      <Ward>${escapeXml(s.ward)}</Ward>
      <ComplianceStatus>${s.compliance_status||''}</ComplianceStatus>
      <ComplianceScore>${s.compliance_score||0}</ComplianceScore>
      <FundingStatus>${s.funding_status||''}</FundingStatus>
      <RiskLevel>${s.risk_level||''}</RiskLevel>
    </Shop>`).join('\n')}
  </Shops>
</SpazaComplianceReport>`;
          triggerDownload(xml, `shops_${stamp}.xml`, 'application/xml');
        } else {
          triggerDownload([csvRow(headers), ...rows.map(csvRow)].join('\n'), `shops_${stamp}.csv`, 'text/csv');
        }
      }
      setExporting(false);
    }, 800);
  };

  const triggerDownload = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const currentCount = exportType === 'inspections' ? filteredInspections().length
    : exportType === 'nef' ? filteredShops().filter(s => s.funding_status === 'eligible').length
    : filteredShops().length;

  const municipalities = [...new Set(shops.map(s => s.municipality).filter(Boolean))];

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">

        {/* What to export */}
        <div>
          <Label className="text-slate-400 text-sm mb-3 block">What to Export</Label>
          <div className="grid md:grid-cols-3 gap-3">
            <ExportFormatCard format="Shops" icon={FileSpreadsheet} description="All shop profiles & compliance data"
              selected={exportType === 'shops'} onClick={() => setExportType('shops')} />
            <ExportFormatCard format="Inspections" icon={ClipboardList} description="All inspection records & scores"
              selected={exportType === 'inspections'} onClick={() => setExportType('inspections')} />
            <ExportFormatCard format="NEF Eligible" icon={Building} description="Funding-ready shops only"
              selected={exportType === 'nef'} onClick={() => setExportType('nef')} badge="NEF" />
          </div>
        </div>

        {/* File format */}
        <div>
          <Label className="text-slate-400 text-sm mb-3 block">File Format</Label>
          <div className="grid md:grid-cols-3 gap-3">
            <ExportFormatCard format="CSV" icon={FileSpreadsheet} description="Excel, Google Sheets compatible"
              selected={exportFormat === 'csv'} onClick={() => setExportFormat('csv')} />
            <ExportFormatCard format="Excel (.xls)" icon={FileCode} description="Native Excel workbook"
              selected={exportFormat === 'xlsx'} onClick={() => setExportFormat('xlsx')} badge="New" />
            <ExportFormatCard format="XML" icon={FileText} description="Structured data / API exchange"
              selected={exportFormat === 'xml'} onClick={() => setExportFormat('xml')}
              disabled={exportType === 'inspections' || exportType === 'nef'} />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-800/50 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <Label className="text-white font-medium">Filters</Label>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Compliance Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400 text-sm">Municipality</Label>
              <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {exportType !== 'inspections' && (
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-3">
              <Checkbox id="includePII" checked={includePII} onCheckedChange={setIncludePII} />
              <Label htmlFor="includePII" className="text-slate-300 cursor-pointer text-sm">
                Include personal information (phone, ID, email)
              </Label>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-medium">Ready to Export</p>
            <p className="text-slate-400 text-sm">{currentCount} records · {exportFormat === 'xlsx' ? 'Excel (.xls)' : exportFormat.toUpperCase()}</p>
          </div>
          <Button onClick={handleExport} disabled={exporting || currentCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0">
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Exporting...</>
              : <><Download className="w-4 h-4" />Download</>}
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}