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

  const filteredData = () => {
    let data = shops.filter(shop => {
      const matchesStatus = statusFilter === 'all' || shop.compliance_status === statusFilter;
      const matchesMunicipality = municipalityFilter === 'all' || shop.municipality === municipalityFilter;
      return matchesStatus && matchesMunicipality;
    });

    return data;
  };

  const generateCSV = (data) => {
    const headers = [
      'Shop Name',
      'Owner Name',
      'Municipality',
      'Ward',
      'Compliance Status',
      'Compliance Score',
      'Funding Status',
      'Risk Level',
      'Trading Months',
      'Has CoA',
      'Has Bank Account',
      'SARS Registered',
      'Structure Type',
      'Created Date'
    ];

    if (includePII) {
      headers.push('Phone Number', 'ID Number');
    }

    const rows = data.map(shop => {
      const row = [
        shop.shop_name || '',
        shop.owner_name || '',
        shop.municipality || '',
        shop.ward || '',
        shop.compliance_status || 'pending',
        shop.compliance_score || '',
        shop.funding_status || '',
        shop.risk_level || '',
        shop.trading_months || '',
        shop.has_coa ? 'Yes' : 'No',
        shop.has_business_bank_account ? 'Yes' : 'No',
        shop.is_sars_registered ? 'Yes' : 'No',
        shop.structure_type || '',
        shop.created_date ? format(new Date(shop.created_date), 'yyyy-MM-dd') : ''
      ];

      if (includePII) {
        row.push(shop.phone_number || '', shop.owner_id_number || '');
      }

      return row;
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const generateXML = (data) => {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const rootStart = '<SpazaComplianceReport>\n';
    const rootEnd = '</SpazaComplianceReport>';
    
    const metadata = `  <Metadata>
    <GeneratedDate>${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</GeneratedDate>
    <TotalRecords>${data.length}</TotalRecords>
    <ReportType>Compliance Export</ReportType>
    <GeneratedBy>YamiMine Spaza Compliance System</GeneratedBy>
  </Metadata>\n`;

    const shopsXml = data.map(shop => `  <Shop>
    <ShopName>${escapeXml(shop.shop_name || '')}</ShopName>
    <OwnerName>${escapeXml(shop.owner_name || '')}</OwnerName>
    <Municipality>${escapeXml(shop.municipality || '')}</Municipality>
    <Ward>${escapeXml(shop.ward || '')}</Ward>
    <ComplianceStatus>${shop.compliance_status || 'pending'}</ComplianceStatus>
    <ComplianceScore>${shop.compliance_score || 0}</ComplianceScore>
    <FundingStatus>${shop.funding_status || ''}</FundingStatus>
    <RiskLevel>${shop.risk_level || ''}</RiskLevel>
    <TradingMonths>${shop.trading_months || 0}</TradingMonths>
    <HasCertificateOfAcceptability>${shop.has_coa ? 'true' : 'false'}</HasCertificateOfAcceptability>
    <HasBusinessBankAccount>${shop.has_business_bank_account ? 'true' : 'false'}</HasBusinessBankAccount>
    <IsSARSRegistered>${shop.is_sars_registered ? 'true' : 'false'}</IsSARSRegistered>
    <StructureType>${escapeXml(shop.structure_type || '')}</StructureType>
    <GPSCoordinates>
      <Latitude>${shop.gps_latitude || ''}</Latitude>
      <Longitude>${shop.gps_longitude || ''}</Longitude>
    </GPSCoordinates>
    <CreatedDate>${shop.created_date ? format(new Date(shop.created_date), 'yyyy-MM-dd') : ''}</CreatedDate>
  </Shop>`).join('\n');

    return xmlHeader + rootStart + metadata + '  <Shops>\n' + shopsXml + '\n  </Shops>\n' + rootEnd;
  };

  const escapeXml = (str) => {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  };

  const generateNEFReport = (data) => {
    // NEF-specific format focusing on funding eligibility
    const eligibleShops = data.filter(s => s.funding_status === 'eligible');
    
    const headers = [
      'Business Name',
      'Owner Name',
      'Municipality',
      'Ward',
      'Compliance Score',
      'Trading Duration (Months)',
      'Has CoA',
      'Bank Account',
      'SARS Registered',
      'CIPC Number',
      'Funding Recommendation'
    ];

    const rows = eligibleShops.map(shop => [
      shop.shop_name || '',
      shop.owner_name || '',
      shop.municipality || '',
      shop.ward || '',
      shop.compliance_score || '',
      shop.trading_months || '',
      shop.has_coa ? 'Yes' : 'No',
      shop.has_business_bank_account ? 'Yes' : 'No',
      shop.is_sars_registered ? 'Yes' : 'No',
      shop.cipc_number || 'N/A',
      'Eligible for NEF Support'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const handleExport = () => {
    setExporting(true);
    const data = filteredData();
    
    setTimeout(() => {
      let content, filename, mimeType;

      switch(exportFormat) {
        case 'csv':
          content = generateCSV(data);
          filename = `spaza_compliance_${format(new Date(), 'yyyyMMdd')}.csv`;
          mimeType = 'text/csv';
          break;
        case 'xml':
          content = generateXML(data);
          filename = `spaza_compliance_${format(new Date(), 'yyyyMMdd')}.xml`;
          mimeType = 'application/xml';
          break;
        case 'nef':
          content = generateNEFReport(data);
          filename = `nef_funding_report_${format(new Date(), 'yyyyMMdd')}.csv`;
          mimeType = 'text/csv';
          break;
        case 'dsbd':
          content = generateCSV(data);
          filename = `dsbd_compliance_report_${format(new Date(), 'yyyyMMdd')}.csv`;
          mimeType = 'text/csv';
          break;
        default:
          content = generateCSV(data);
          filename = `export_${format(new Date(), 'yyyyMMdd')}.csv`;
          mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExporting(false);
    }, 1000);
  };

  const filteredCount = filteredData().length;

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
      <CardHeader className="border-b border-slate-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          Data Export for Funding Bodies
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Export Format Selection */}
        <div>
          <Label className="text-slate-400 text-sm mb-3 block">Select Export Format</Label>
          <div className="grid md:grid-cols-2 gap-3">
            <ExportFormatCard
              format="CSV"
              icon={FileSpreadsheet}
              description="Standard spreadsheet format"
              selected={exportFormat === 'csv'}
              onClick={() => setExportFormat('csv')}
            />
            <ExportFormatCard
              format="XML"
              icon={FileCode}
              description="Structured data format"
              selected={exportFormat === 'xml'}
              onClick={() => setExportFormat('xml')}
            />
            <ExportFormatCard
              format="NEF Report"
              icon={Building}
              description="National Empowerment Fund format"
              selected={exportFormat === 'nef'}
              onClick={() => setExportFormat('nef')}
              badge="NEF"
            />
            <ExportFormatCard
              format="DSBD Report"
              icon={FileText}
              description="Dept. of Small Business format"
              selected={exportFormat === 'dsbd'}
              onClick={() => setExportFormat('dsbd')}
              badge="DSBD"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-slate-800/50 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <Label className="text-white font-medium">Filter Data</Label>
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
                  <SelectItem value="compliant">Compliant Only</SelectItem>
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

          {/* Options */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="includePII"
                checked={includePII}
                onCheckedChange={setIncludePII}
              />
              <Label htmlFor="includePII" className="text-slate-300 cursor-pointer">
                Include personal information (phone, ID)
              </Label>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Ready to Export</p>
              <p className="text-slate-400 text-sm">
                {filteredCount} records match your filters
              </p>
            </div>
            <Button
              onClick={handleExport}
              disabled={exporting || filteredCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Funding Body Info */}
        <div className="text-xs text-slate-500">
          <p className="mb-2 font-medium text-slate-400">Supported Funding Bodies:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>National Empowerment Fund (NEF) - Township Entrepreneurship Fund</li>
            <li>Department of Small Business Development (DSBD)</li>
            <li>iLembe District Enterprise Development Agency</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}