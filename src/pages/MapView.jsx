import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, LayersControl } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Store, MapPin, Layers, ExternalLink, Users,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock,
  Activity, BarChart3, ChevronRight, ChevronLeft, Target,
  Wifi, WifiOff, Navigation, Filter, Eye
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Icons ────────────────────────────────────────────────────────────────────
const makeIcon = (color, size = 28) => L.divIcon({
  className: '',
  html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.4)"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"></div></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  popupAnchor: [0, -size]
});

const icons = {
  compliant:          makeIcon('#10b981'),
  partially_compliant: makeIcon('#f59e0b'),
  non_compliant:      makeIcon('#ef4444'),
  pending:            makeIcon('#64748b'),
  agent:              makeIcon('#3b82f6', 24),
};

const getIcon = (status) => icons[status] || icons.pending;

const statusColor = {
  compliant: '#10b981',
  partially_compliant: '#f59e0b',
  non_compliant: '#ef4444',
  pending: '#64748b',
};

// ── Map tile layers ──────────────────────────────────────────────────────────
const TILES = {
  dark:     { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',     label: 'Dark' },
  satellite:{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', label: 'Satellite' },
  terrain:  { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',                  label: 'Terrain' },
  street:   { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                label: 'Street' },
};

// ── Fly-to helper ────────────────────────────────────────────────────────────
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.2 }); }, [center]);
  return null;
}

// ── Heatmap circles (manual lightweight heatmap) ─────────────────────────────
function HeatLayer({ shops }) {
  return shops.map(s => (
    <CircleMarker
      key={s.id}
      center={[s.gps_latitude, s.gps_longitude]}
      radius={24}
      pathOptions={{ color: 'transparent', fillColor: statusColor[s.compliance_status] || '#64748b', fillOpacity: 0.18 }}
    />
  ));
}

// ── Ward density bubble ──────────────────────────────────────────────────────
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
      ward,
      count: d.shops.length,
      lat: d.lat / d.shops.length,
      lng: d.lng / d.shops.length,
      compliant: d.shops.filter(x => x.compliance_status === 'compliant').length,
    }));
  }, [shops]);

  return wardGroups.map(w => (
    <CircleMarker
      key={w.ward}
      center={[w.lat, w.lng]}
      radius={Math.min(8 + w.count * 3, 40)}
      pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.25, weight: 2 }}
    >
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

// ── Shop popup ───────────────────────────────────────────────────────────────
function ShopPopup({ shop }) {
  return (
    <div style={{ minWidth: 200 }}>
      <div className="flex items-start gap-2 mb-2">
        {shop.shop_photo_url
          ? <img src={shop.shop_photo_url} className="w-14 h-14 rounded object-cover" />
          : <div className="w-14 h-14 rounded bg-slate-200 flex items-center justify-center"><Store className="w-5 h-5 text-slate-400" /></div>
        }
        <div>
          <p className="font-bold text-slate-900 text-sm">{shop.shop_name}</p>
          <p className="text-slate-500 text-xs">{shop.owner_name}</p>
          <p className="text-xs mt-0.5">{shop.municipality} · Ward {shop.ward}</p>
        </div>
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          shop.compliance_status === 'compliant' ? 'bg-emerald-100 text-emerald-700' :
          shop.compliance_status === 'partially_compliant' ? 'bg-amber-100 text-amber-700' :
          shop.compliance_status === 'non_compliant' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          {shop.compliance_status?.replace('_', ' ') || 'Pending'}
        </span>
        {shop.compliance_score !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {shop.compliance_score}%
          </span>
        )}
        {shop.risk_level && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            shop.risk_level === 'critical' ? 'bg-red-200 text-red-800' :
            shop.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
            shop.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
          }`}>{shop.risk_level} risk</span>
        )}
      </div>
      <Link to={createPageUrl(`ShopDetail?id=${shop.id}`)}>
        <button className="w-full text-xs bg-slate-800 text-white rounded px-3 py-1.5 flex items-center justify-center gap-1 hover:bg-slate-700">
          View Full Profile <ExternalLink className="w-3 h-3" />
        </button>
      </Link>
    </div>
  );
}

// ── Spatial KPI panel ────────────────────────────────────────────────────────
function SpatialPanel({ shops, agents, onShopClick }) {
  const [open, setOpen] = useState(true);

  const stats = useMemo(() => {
    const total = shops.length;
    const compliant = shops.filter(s => s.compliance_status === 'compliant').length;
    const nonCompliant = shops.filter(s => s.compliance_status === 'non_compliant').length;
    const critical = shops.filter(s => s.risk_level === 'critical' || s.risk_level === 'high').length;
    const avgScore = total ? Math.round(shops.reduce((a, s) => a + (s.compliance_score || 0), 0) / total) : 0;

    // Top 5 wards by shop count
    const wardMap = {};
    shops.forEach(s => { wardMap[s.ward] = (wardMap[s.ward] || 0) + 1; });
    const topWards = Object.entries(wardMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Municipality breakdown
    const muniMap = {};
    shops.forEach(s => { muniMap[s.municipality] = (muniMap[s.municipality] || 0) + 1; });

    return { total, compliant, nonCompliant, critical, avgScore, topWards, muniMap };
  }, [shops]);

  return (
    <div className={`absolute top-4 right-4 z-[1000] transition-all duration-300 ${open ? 'w-72' : 'w-10'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="absolute -left-4 top-2 z-10 bg-slate-900 border border-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg"
      >
        {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {open && (
        <div className="bg-slate-900/97 backdrop-blur border border-slate-700 rounded-xl overflow-hidden text-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-bold text-sm">Spatial Intelligence</span>
            </div>
            <p className="text-cyan-100 text-xs mt-0.5">iLembe District GIS Dashboard</p>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Mapped Shops', value: stats.total, color: 'text-cyan-400', icon: Store },
                { label: 'Avg. Score', value: `${stats.avgScore}%`, color: 'text-blue-400', icon: BarChart3 },
                { label: 'Compliant', value: stats.compliant, color: 'text-emerald-400', icon: CheckCircle2 },
                { label: 'High Risk', value: stats.critical, color: 'text-red-400', icon: AlertTriangle },
              ].map(k => (
                <div key={k.label} className="bg-slate-800 rounded-lg p-3">
                  <k.icon className={`w-4 h-4 ${k.color} mb-1`} />
                  <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-slate-400 text-xs">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Compliance bar */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Compliance Distribution</p>
              <div className="flex rounded-full overflow-hidden h-3">
                {['compliant', 'partially_compliant', 'non_compliant', 'pending'].map(s => {
                  const cnt = shops.filter(x => (x.compliance_status || 'pending') === s).length;
                  const pct = stats.total ? (cnt / stats.total) * 100 : 0;
                  return pct > 0 ? (
                    <div key={s} style={{ width: `${pct}%`, background: statusColor[s] }} title={`${s}: ${cnt}`} />
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {Object.entries(statusColor).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-slate-400 text-xs capitalize">{s.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Municipality breakdown */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">By Municipality</p>
              <div className="space-y-1.5">
                {Object.entries(stats.muniMap).sort((a, b) => b[1] - a[1]).map(([muni, cnt]) => (
                  <div key={muni} className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs w-24 truncate">{muni}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(cnt / stats.total) * 100}%` }} />
                    </div>
                    <span className="text-slate-400 text-xs w-4 text-right">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top wards */}
            {stats.topWards.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Top Wards by Density</p>
                <div className="space-y-1">
                  {stats.topWards.map(([ward, cnt], i) => (
                    <div key={ward} className="flex items-center justify-between bg-slate-800 rounded px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">#{i + 1}</span>
                        <span className="text-slate-200 text-xs">Ward {ward}</span>
                      </div>
                      <Badge className="text-xs bg-cyan-500/20 text-cyan-300 border-0">{cnt} shops</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active agents */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Field Agents ({agents.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {agents.length === 0 && <p className="text-slate-600 text-xs">No agents with location data</p>}
                {agents.map(a => (
                  <div key={a.id} className="flex items-center gap-2 bg-slate-800 rounded px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-200 text-xs truncate">{a.full_name}</span>
                    <span className="text-slate-500 text-xs ml-auto">{a.municipality}</span>
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MapView() {
  const [statusFilter, setStatusFilter]     = useState('all');
  const [muniFilter, setMuniFilter]         = useState('all');
  const [riskFilter, setRiskFilter]         = useState('all');
  const [mapStyle, setMapStyle]             = useState('dark');
  const [viewMode, setViewMode]             = useState('pins');   // pins | heat | wards
  const [showAgents, setShowAgents]         = useState(false);
  const [flyTarget, setFlyTarget]           = useState(null);
  const [showFilters, setShowFilters]       = useState(false);

  const { data: shops  = [] } = useQuery({ queryKey: ['shops'],  queryFn: () => base44.entities.Shop.list('-created_date', 500) });
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: () => base44.entities.FieldAgent.list() });

  const mappableShops = useMemo(() => shops.filter(s => {
    if (!s.gps_latitude || !s.gps_longitude) return false;
    if (statusFilter !== 'all' && s.compliance_status !== statusFilter) return false;
    if (muniFilter   !== 'all' && s.municipality !== muniFilter) return false;
    if (riskFilter   !== 'all' && s.risk_level   !== riskFilter) return false;
    return true;
  }), [shops, statusFilter, muniFilter, riskFilter]);

  const mapCenter = useMemo(() => {
    if (mappableShops.length > 0) {
      const lat = mappableShops.reduce((s, x) => s + x.gps_latitude, 0) / mappableShops.length;
      const lng = mappableShops.reduce((s, x) => s + x.gps_longitude, 0) / mappableShops.length;
      return [lat, lng];
    }
    return [-29.2, 31.2];
  }, [mappableShops]);

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
            <h1 className="text-white font-bold text-base leading-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              GIS Command Centre
            </h1>
            <p className="text-slate-400 text-xs">{mappableShops.length}/{shops.length} shops · iLembe District</p>
          </div>

          {/* View mode buttons */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {[
              { id: 'pins',  label: 'Pins',  icon: MapPin },
              { id: 'heat',  label: 'Heat',  icon: Activity },
              { id: 'wards', label: 'Wards', icon: Target },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === m.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
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

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
              showFilters ? 'bg-cyan-600 border-cyan-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
          >
            <Filter className="w-3 h-3" /> Filters
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="partially_compliant">Partially Compliant</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={muniFilter} onValueChange={setMuniFilter}>
              <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white text-xs h-8">
                <SelectValue placeholder="Municipality" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All Municipalities</SelectItem>
                <SelectItem value="KwaDukuza">KwaDukuza</SelectItem>
                <SelectItem value="Mandeni">Mandeni</SelectItem>
                <SelectItem value="Ndwedwe">Ndwedwe</SelectItem>
                <SelectItem value="Maphumulo">Maphumulo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white text-xs h-8">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setShowAgents(!showAgents)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                showAgents ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}
            >
              <Users className="w-3 h-3" /> {showAgents ? 'Hide' : 'Show'} Agents
            </button>

            {(statusFilter !== 'all' || muniFilter !== 'all' || riskFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setMuniFilter('all'); setRiskFilter('all'); }}
                className="px-3 py-1.5 rounded text-xs text-red-400 border border-red-800 hover:bg-red-900/30"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {mappableShops.length === 0 && !shops.length ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading spatial data…</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[-29.2, 31.2]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url={TILES[mapStyle].url}
              attribution='&copy; OpenStreetMap contributors'
              key={mapStyle}
            />

            {flyTarget && <FlyTo center={flyTarget.center} zoom={flyTarget.zoom} />}

            {/* Heat layer */}
            {viewMode === 'heat' && <HeatLayer shops={mappableShops} />}

            {/* Ward density bubbles */}
            {viewMode === 'wards' && <WardBubbles shops={mappableShops} />}

            {/* Shop pins */}
            {viewMode === 'pins' && mappableShops.map(shop => (
              <Marker
                key={shop.id}
                position={[shop.gps_latitude, shop.gps_longitude]}
                icon={getIcon(shop.compliance_status)}
              >
                <Popup maxWidth={260}>
                  <ShopPopup shop={shop} />
                </Popup>
              </Marker>
            ))}

            {/* Also show pins underneath heat/ward views */}
            {viewMode !== 'pins' && mappableShops.map(shop => (
              <CircleMarker
                key={shop.id}
                center={[shop.gps_latitude, shop.gps_longitude]}
                radius={5}
                pathOptions={{ color: statusColor[shop.compliance_status] || '#64748b', fillColor: statusColor[shop.compliance_status] || '#64748b', fillOpacity: 0.9, weight: 1 }}
              >
                <Popup maxWidth={260}><ShopPopup shop={shop} /></Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}

        {/* Spatial Intelligence side panel */}
        <SpatialPanel shops={mappableShops} agents={agents} />

        {/* Bottom-left legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 rounded-xl p-3 border border-slate-700 shadow-xl">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Legend</p>
          <div className="space-y-1.5">
            {Object.entries(statusColor).map(([s, c]) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="text-slate-300 text-xs capitalize">{s.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <p className="text-slate-500 text-xs">View: <span className="text-cyan-400 capitalize">{viewMode}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}