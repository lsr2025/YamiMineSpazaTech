import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  Store,
  MapPin,
  Filter,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ZoomIn
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const greenIcon = createCustomIcon('#10b981');
const amberIcon = createCustomIcon('#f59e0b');
const redIcon = createCustomIcon('#ef4444');
const grayIcon = createCustomIcon('#64748b');

const getMarkerIcon = (status) => {
  switch(status) {
    case 'compliant': return greenIcon;
    case 'partially_compliant': return amberIcon;
    case 'non_compliant': return redIcon;
    default: return grayIcon;
  }
};

const StatusBadge = ({ status }) => {
  const configs = {
    compliant: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Compliant' },
    partially_compliant: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Partial' },
    non_compliant: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Non-Compliant' },
    pending: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Pending' }
  };
  const config = configs[status] || configs.pending;

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  );
};

const MapLegend = () => (
  <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
    <p className="text-white font-semibold text-sm mb-3">Legend</p>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-emerald-500" />
        <span className="text-slate-300 text-xs">Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-amber-500" />
        <span className="text-slate-300 text-xs">Partially Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-red-500" />
        <span className="text-slate-300 text-xs">Non-Compliant</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-500" />
        <span className="text-slate-300 text-xs">Pending</span>
      </div>
    </div>
  </div>
);

const StatsPanel = ({ shops }) => {
  const compliant = shops.filter(s => s.compliance_status === 'compliant').length;
  const partial = shops.filter(s => s.compliance_status === 'partially_compliant').length;
  const nonCompliant = shops.filter(s => s.compliance_status === 'non_compliant').length;
  const pending = shops.filter(s => !s.compliance_status || s.compliance_status === 'pending').length;

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden w-64">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-semibold">Shop Statistics</h3>
        <p className="text-slate-400 text-xs">{shops.length} shops mapped</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300 text-sm">Compliant</span>
          </div>
          <span className="text-white font-semibold">{compliant}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-300 text-sm">Partial</span>
          </div>
          <span className="text-white font-semibold">{partial}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-300 text-sm">Non-Compliant</span>
          </div>
          <span className="text-white font-semibold">{nonCompliant}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-slate-300 text-sm">Pending</span>
          </div>
          <span className="text-white font-semibold">{pending}</span>
        </div>
      </div>
    </div>
  );
};

const ShopPopup = ({ shop }) => (
  <div className="min-w-[200px]">
    <div className="flex items-start gap-3 mb-3">
      {shop.shop_photo_url ? (
        <img 
          src={shop.shop_photo_url} 
          alt={shop.shop_name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
          <Store className="w-6 h-6 text-slate-500" />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-slate-900">{shop.shop_name}</h3>
        <p className="text-slate-600 text-sm">{shop.owner_name}</p>
        <StatusBadge status={shop.compliance_status} />
      </div>
    </div>
    
    <div className="space-y-1 mb-3">
      {shop.ward && (
        <p className="text-sm text-slate-600">Ward: {shop.ward}</p>
      )}
      {shop.compliance_score !== undefined && (
        <p className="text-sm text-slate-600">
          Score: <span className="font-semibold">{shop.compliance_score}%</span>
        </p>
      )}
    </div>

    <Link to={createPageUrl(`ShopDetail?id=${shop.id}`)}>
      <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-700 text-white gap-2">
        View Details
        <ExternalLink className="w-3 h-3" />
      </Button>
    </Link>
  </div>
);

export default function MapView() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => base44.entities.Shop.list('-created_date', 500)
  });

  // Filter shops with valid GPS coordinates
  const mappableShops = useMemo(() => {
    return shops.filter(shop => {
      const hasCoords = shop.gps_latitude && shop.gps_longitude;
      const matchesStatus = statusFilter === 'all' || shop.compliance_status === statusFilter;
      const matchesMunicipality = municipalityFilter === 'all' || shop.municipality === municipalityFilter;
      return hasCoords && matchesStatus && matchesMunicipality;
    });
  }, [shops, statusFilter, municipalityFilter]);

  // Calculate map center (iLembe District, KZN)
  const mapCenter = useMemo(() => {
    if (mappableShops.length > 0) {
      const avgLat = mappableShops.reduce((sum, s) => sum + s.gps_latitude, 0) / mappableShops.length;
      const avgLng = mappableShops.reduce((sum, s) => sum + s.gps_longitude, 0) / mappableShops.length;
      return [avgLat, avgLng];
    }
    // Default to iLembe District center
    return [-29.2, 31.2];
  }, [mappableShops]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Geo-Dashboard</h1>
              <p className="text-slate-400 text-sm">{mappableShops.length} shops on map</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
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
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading map data...</p>
            </div>
          </div>
        ) : mappableShops.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold mb-2">No Shops to Display</h2>
              <p className="text-slate-400 mb-4">
                {shops.length === 0 
                  ? 'Start by profiling shops with GPS coordinates'
                  : 'No shops match your current filters or have GPS data'}
              </p>
              <Link to={createPageUrl('NewShop')}>
                <Button className="bg-red-600 hover:bg-red-700">Profile New Shop</Button>
              </Link>
            </Card>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {mappableShops.map(shop => (
              <Marker
                key={shop.id}
                position={[shop.gps_latitude, shop.gps_longitude]}
                icon={getMarkerIcon(shop.compliance_status)}
              >
                <Popup>
                  <ShopPopup shop={shop} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Overlays */}
        {mappableShops.length > 0 && (
          <>
            <MapLegend />
            <StatsPanel shops={mappableShops} />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 text-center border-t border-slate-800">
        <p className="text-slate-500 text-xs">
          Powered by <span className="text-cyan-400 font-semibold">Kelestone Capital</span>
        </p>
      </div>
    </div>
  );
}