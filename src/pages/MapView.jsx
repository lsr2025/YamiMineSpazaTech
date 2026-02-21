/**
 * Copyright © 2026 Kwahlelwa Group (Pty) Ltd.
 * All Rights Reserved.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Store, MapPin, Layers, ExternalLink, Users,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock,
  Activity, BarChart3, ChevronRight, ChevronLeft, Target,
  Filter, X, DollarSign, ShieldCheck
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// ── Status / color maps ──────────────────────────────────────────────────────
const statusColor = {
  compliant: '#10b981',
  partially_compliant: '#f59e0b',
  non_compliant: '#ef4444',
  pending: '#64748b',
};

const riskColor = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

// ── Map tile layers ──────────────────────────────────────────────────────────
const TILES = {
  dark:      { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', label: 'Dark' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' },
  street:    { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', label: 'Street' },
};

// ── Pin icon factory ─────────────────────────────────────────────────────────
const makeIcon = (color, size = 30) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;
    background:${color};
    border:3px solid white;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 3px 10px rgba(0,0,0,0.45);
    position:relative;
  "><div style="
    width:9px;height:9px;
    background:white;
    border-radius:50%;
    position:absolute;
    top:50%;left:50%;
    transform:translate(-50%,-50%)
  "></div></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size],
});

// ── Cluster group component ──────────────────────────────────────────────────
function ClusterLayer({ shops, colorFn }) {
  const map = useMap();

  useEffect(() => {
    const mcg = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const markers = cluster.getAllChildMarkers();
        // Dominant color
        const colorCounts = {};
        markers.forEach(m => {
          const c = m.options._statusColor || '#64748b';
          colorCounts[c] = (colorCounts[c] || 0) + 1;
        });
        const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '#64748b';
        const size = count < 10 ? 38 : count < 50 ? 46 : 54;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${dominantColor};
            border:3px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
            font-weight:bold;font-size:${count < 100 ? 13 : 11}px;
            color:white;
          ">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    shops.forEach(shop => {
      const color = colorFn(shop);
      const marker = L.marker([shop.gps_latitude, shop.gps_longitude], {
        icon: makeIcon(color),
        _statusColor: color,
      });

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '210px';
      popupContent.innerHTML = `
        <div style="font-family:system-ui,sans-serif;">
          <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
            ${shop.shop_photo_url
              ? `<img src="${shop.shop_photo_url}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;" />`
              : `<div style="width:52px;height:52px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;">🏪</div>`
            }
            <div style="min-width:0;">
              <p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 2px;">${shop.shop_name}</p>
              <p style="font-size:11px;color:#64748b;margin:0 0 2px;">${shop.owner_name || ''}</p>
              <p style="font-size:11px;color:#94a3b8;margin:0;">${shop.municipality || ''}${shop.ward ? ' · Ward ' + shop.ward : ''}</p>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">
            <span style="font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600;background:${
              shop.compliance_status === 'compliant' ? '#d1fae5' :
              shop.compliance_status === 'partially_compliant' ? '#fef3c7' :
              shop.compliance_status === 'non_compliant' ? '#fee2e2' : '#f1f5f9'
            };color:${
              shop.compliance_status === 'compliant' ? '#065f46' :
              shop.compliance_status === 'partially_compliant' ? '#92400e' :
              shop.compliance_status === 'non_compliant' ? '#991b1b' : '#475569'
            };">${(shop.compliance_status || 'pending').replace(/_/g, ' ')}</span>
            ${shop.compliance_score !== undefined ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:#dbeafe;color:#1e40af;font-weight:600;">${shop.compliance_score}%</span>` : ''}
            ${shop.risk_level ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600;background:${
              shop.risk_level === 'critical' ? '#fee2e2' :
              shop.risk_level === 'high' ? '#ffedd5' :
              shop.risk_level === 'medium' ? '#fef9c3' : '#dcfce7'
            };color:${
              shop.risk_level === 'critical' ? '#991b1b' :
              shop.risk_level === 'high' ? '#9a3412' :
              shop.risk_level === 'medium' ? '#854d0e' : '#166534'
            };">${shop.risk_level} risk</span>` : ''}
            ${shop.funding_status === 'eligible' ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:#ede9fe;color:#4c1d95;font-weight:600;">NEF Eligible</span>` : ''}
          </div>
          <a href="${window.location.origin}${createPageUrl(`ShopDetail?id=${shop.id}`)}"
            style="display:block;width:100%;text-align:center;background:#1e293b;color:white;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none;"
            onclick="event.stopPropagation()">
            View Full Profile →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 260, closeButton: true });
      mcg.addLayer(marker);
    });

    map.addLayer(mcg);
    return () => { map.removeLayer(mcg); };
  }, [shops, map, colorFn]);

  return null;
}

// ── Fly-to helper ────────────────────────────────────────────────────────────
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.2 }); }, [center]);
  return null;
}

// ── Ward density bubbles ─────────────────────────────────────────────────────
function WardBubbles({ shops }) {
  const wardGroups = useMemo(() => {
    const g = {};
    shops.forEach(s => {
      if (!s.ward || !s.gps_latitude) return;
      if (!g[s.ward]) g[s.ward] = { shops: [], lat: 0, lng: 0 };
      g[s.ward].shops.push(s);
      g[s.ward].lat += s.gps_latitude;
      g[s.ward].lng += s.gps_longitude;
    });
    return Object.entries(g).map(([ward, d]) => ({
      ward, count: d.shops.length,
      lat: d.lat / d.shops.length,
      lng: d.lng / d.shops.length,
      compliant: d.shops.filter(x => x.compliance_status === 'compliant').length,
    }));
  }, [shops]);

  return wardGroups.map(w => (
    <CircleMarker key={w.ward} center={[w.lat, w.lng]}
      radius={Math.min(8 + w.count * 3, 40)}
      pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.25, weight: 2 }}>
      <Popup>
        <div className="p-1">
          <p className="font-bold">Ward {w.ward}</p>
          <p className="text-sm">Total shops: <strong>{w.count}</strong></p>
          <p className="text-sm">Compliant: <strong>{w.compliant}</strong></p>
        </div>
      </Popup>
    </CircleMarker>
  ));
}

// ── Heat layer ───────────────────────────────────────────────────────────────
function HeatLayer({ shops }) {
  return shops.map(s => (
    <CircleMarker key={s.id} center={[s.gps_latitude, s.gps_longitude]} radius={24}
      pathOptions={{ color: 'transparent', fillColor: statusColor[s.compliance_status] || '#64748b', fillOpacity: 0.2 }} />
  ));
}

// ── Stats panel ──────────────────────────────────────────────────────────────
function StatsPanel({ shops }) {
  const [open, setOpen] = useState(true);
  const stats = useMemo(() => {
    const total = shops.length;
    const compliant = shops.filter(s => s.compliance_status === 'compliant').length;
    const critical = shops.filter(s => s.risk_level === 'critical' || s.risk_level === 'high').length;
    const funding = shops.filter(s => s.funding_status === 'eligible').length;
    const avgScore = total ? Math.round(shops.reduce((a, s) => a + (s.compliance_score || 0), 0) / total) : 0;
    const muniMap = {};
    shops.forEach(s => { if (s.municipality) muniMap[s.municipality] = (muniMap[s.municipality] || 0) + 1; });
    return { total, compliant, critical, funding, avgScore, muniMap };
  }, [shops]);

  return (
    <div className={`absolute top-4 right-4 z-[1000] transition-all duration-300 ${open ? 'w-64' : 'w-10'}`}>
      <button onClick={() => setOpen(!open)}
        className="absolute -left-4 top-2 z-10 bg-slate-900 border border-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg">
        {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
      {open && (
        <div className="bg-slate-900/97 backdrop-blur border border-slate-700 rounded-xl overflow-hidden text-white shadow-2xl">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-bold text-sm">Spatial Overview</span>
            </div>
            <p className="text-cyan-100 text-xs mt-0.5">iLembe District GIS</p>
          </div>
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Mapped', value: stats.total, color: 'text-cyan-400', icon: Store },
                { label: 'Avg Score', value: `${stats.avgScore}%`, color: 'text-blue-400', icon: BarChart3 },
                { label: 'Compliant', value: stats.compliant, color: 'text-emerald-400', icon: CheckCircle2 },
                { label: 'High Risk', value: stats.critical, color: 'text-red-400', icon: AlertTriangle },
                { label: 'NEF Eligible', value: stats.funding, color: 'text-purple-400', icon: DollarSign },
              ].map(k => (
                <div key={k.label} className="bg-slate-800 rounded-lg p-3">
                  <k.icon className={`w-4 h-4 ${k.color} mb-1`} />
                  <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-slate-400 text-xs">{k.label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Compliance</p>
              <div className="flex rounded-full overflow-hidden h-3 mb-2">
                {['compliant', 'partially_compliant', 'non_compliant', 'pending'].map(s => {
                  const cnt = shops.filter(x => (x.compliance_status || 'pending') === s).length;
                  const pct = stats.total ? (cnt / stats.total) * 100 : 0;
                  return pct > 0 ? <div key={s} style={{ width: `${pct}%`, background: statusColor[s] }} title={`${s}: ${cnt}`} /> : null;
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(statusColor).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-slate-400 text-xs capitalize">{s.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">By Municipality</p>
              <div className="space-y-1.5">
                {Object.entries(stats.muniMap).sort((a, b) => b[1] - a[1]).map(([muni, cnt]) => (
                  <div key={muni} className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs w-24 truncate">{muni}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(cnt / stats.total) * 100}%` }} />
                    </div>
                    <span className="text-slate-400 text-xs">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── On-map filter panel ──────────────────────────────────────────────────────
function MapFilters({ statusFilter, setStatusFilter, riskFilter, setRiskFilter, fundingFilter, setFundingFilter, muniFilter, setMuniFilter, colorMode, setColorMode, onClear, activeCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-20 left-4 z-[1000]">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
          activeCount > 0 ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'
        }`}>
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && <span className="bg-white text-cyan-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{activeCount}</span>}
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-72 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-semibold text-sm">Map Filters</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Color mode */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Color pins by</p>
            <div className="flex gap-1">
              {[
                { id: 'compliance', label: 'Compliance' },
                { id: 'risk', label: 'Risk' },
                { id: 'funding', label: 'Funding' },
              ].map(m => (
                <button key={m.id} onClick={() => setColorMode(m.id)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${colorMode === m.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance status */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Compliance Status</p>
            <div className="flex flex-wrap gap-1">
              {[
                { v: 'all', label: 'All', color: 'bg-slate-700' },
                { v: 'compliant', label: 'Compliant', color: 'bg-emerald-700' },
                { v: 'partially_compliant', label: 'Partial', color: 'bg-amber-700' },
                { v: 'non_compliant', label: 'Non-Compliant', color: 'bg-red-700' },
                { v: 'pending', label: 'Pending', color: 'bg-slate-600' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setStatusFilter(opt.v)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${statusFilter === opt.v ? opt.color + ' text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Risk Level</p>
            <div className="flex flex-wrap gap-1">
              {[
                { v: 'all', label: 'All' },
                { v: 'low', label: 'Low' },
                { v: 'medium', label: 'Medium' },
                { v: 'high', label: 'High' },
                { v: 'critical', label: 'Critical' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setRiskFilter(opt.v)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${riskFilter === opt.v ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Funding eligibility */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Funding Eligibility</p>
            <div className="flex gap-1">
              {[
                { v: 'all', label: 'All' },
                { v: 'eligible', label: 'NEF Eligible' },
                { v: 'not_eligible', label: 'Not Eligible' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setFundingFilter(opt.v)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${fundingFilter === opt.v ? 'bg-purple-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Municipality */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Municipality</p>
            <div className="flex flex-wrap gap-1">
              {['all', 'KwaDukuza', 'Mandeni', 'Ndwedwe', 'Maphumulo'].map(m => (
                <button key={m} onClick={() => setMuniFilter(m)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${muniFilter === m ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {m === 'all' ? 'All' : m}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button onClick={onClear}
              className="w-full py-2 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60 transition-all">
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MapView() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter]     = useState('all');
  const [fundingFilter, setFundingFilter] = useState('all');
  const [muniFilter, setMuniFilter]     = useState('all');
  const [mapStyle, setMapStyle]         = useState('dark');
  const [viewMode, setViewMode]         = useState('pins');
  const [colorMode, setColorMode]       = useState('compliance');

  const { data: shops = [] } = useQuery({ queryKey: ['shops'], queryFn: () => base44.entities.Shop.list('-created_date', 500) });

  const mappableShops = useMemo(() => shops.filter(s => {
    if (!s.gps_latitude || !s.gps_longitude) return false;
    if (statusFilter !== 'all' && s.compliance_status !== statusFilter) return false;
    if (muniFilter   !== 'all' && s.municipality !== muniFilter)         return false;
    if (riskFilter   !== 'all' && s.risk_level   !== riskFilter)         return false;
    if (fundingFilter !== 'all' && s.funding_status !== fundingFilter)   return false;
    return true;
  }), [shops, statusFilter, muniFilter, riskFilter, fundingFilter]);

  const activeFilterCount = [statusFilter, riskFilter, fundingFilter, muniFilter].filter(v => v !== 'all').length;

  const getShopColor = useMemo(() => (shop) => {
    if (colorMode === 'risk')    return riskColor[shop.risk_level] || '#64748b';
    if (colorMode === 'funding') return shop.funding_status === 'eligible' ? '#8b5cf6' : shop.funding_status === 'not_eligible' ? '#ef4444' : '#64748b';
    return statusColor[shop.compliance_status] || '#64748b';
  }, [colorMode]);

  const clearFilters = () => {
    setStatusFilter('all'); setRiskFilter('all');
    setFundingFilter('all'); setMuniFilter('all');
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* ── Topbar ── */}
      <div className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-4 py-3 z-[1100]">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to={createPageUrl('SuperDashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>

          <div className="mr-auto">
            <h1 className="text-white font-bold text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              GIS Command Centre
            </h1>
            <p className="text-slate-400 text-xs">{mappableShops.length} of {shops.length} shops shown · iLembe District</p>
          </div>

          {/* View mode */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {[
              { id: 'pins',  label: 'Clustered', icon: MapPin },
              { id: 'heat',  label: 'Heat',       icon: Activity },
              { id: 'wards', label: 'Wards',      icon: Target },
            ].map(m => (
              <button key={m.id} onClick={() => setViewMode(m.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === m.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Tile selector */}
          <Select value={mapStyle} onValueChange={setMapStyle}>
            <SelectTrigger className="w-28 bg-slate-800 border-slate-700 text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {Object.entries(TILES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {!shops.length ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading spatial data…</p>
            </div>
          </div>
        ) : (
          <MapContainer center={[-29.2, 31.2]} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={true}>
            <TileLayer url={TILES[mapStyle].url} attribution='&copy; OpenStreetMap contributors' key={mapStyle} />

            {viewMode === 'pins'  && <ClusterLayer shops={mappableShops} colorFn={getShopColor} key={`${colorMode}-${mappableShops.length}`} />}
            {viewMode === 'heat'  && <HeatLayer  shops={mappableShops} />}
            {viewMode === 'wards' && <WardBubbles shops={mappableShops} />}
          </MapContainer>
        )}

        {/* Stats panel */}
        <StatsPanel shops={mappableShops} />

        {/* On-map filters */}
        <MapFilters
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          riskFilter={riskFilter}     setRiskFilter={setRiskFilter}
          fundingFilter={fundingFilter} setFundingFilter={setFundingFilter}
          muniFilter={muniFilter}     setMuniFilter={setMuniFilter}
          colorMode={colorMode}       setColorMode={setColorMode}
          onClear={clearFilters}      activeCount={activeFilterCount}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 rounded-xl p-3 border border-slate-700 shadow-xl">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
            {colorMode === 'compliance' ? 'Compliance' : colorMode === 'risk' ? 'Risk Level' : 'Funding'}
          </p>
          <div className="space-y-1.5">
            {colorMode === 'compliance' && Object.entries(statusColor).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="text-slate-300 text-xs capitalize">{s.replace(/_/g, ' ')}</span>
              </div>
            ))}
            {colorMode === 'risk' && Object.entries(riskColor).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="text-slate-300 text-xs capitalize">{s}</span>
              </div>
            ))}
            {colorMode === 'funding' && (
              <>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-slate-300 text-xs">NEF Eligible</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-slate-300 text-xs">Not Eligible</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500" /><span className="text-slate-300 text-xs">Pending Review</span></div>
              </>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-slate-500 text-xs">Mode: <span className="text-cyan-400 capitalize">{viewMode}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}