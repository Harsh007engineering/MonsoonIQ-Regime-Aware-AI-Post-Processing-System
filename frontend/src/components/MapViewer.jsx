import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Layers, MapPin, Eye, Info, RotateCcw, Search, Compass, ChevronDown } from 'lucide-react';

const REGIME_COLORS = {
  'Active Monsoon': '#0284c7',
  'Break Monsoon': '#f59e0b',
  'Monsoon Low/Depression': '#dc2626',
  'Orographic': '#059669',
  'Coastal': '#06b6d4',
  'Western Disturbance': '#7c3aed',
  'Weak/Normal': '#64748b'
};

const BASEMAP_TILES = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  esri_dark: {
    id: 'esri_dark',
    name: 'Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  esri_light: {
    id: 'esri_light',
    name: 'Light Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  esri_topo: {
    id: 'esri_topo',
    name: 'Terrain Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
};

function getRainColor(mm) {
  if (mm < 2.5) return '#94a3b8'; // Visible slate/light steel rather than invisible white
  if (mm < 15.6) return '#38bdf8'; // Light rain - clear cyan
  if (mm < 35.5) return '#0284c7'; // Moderate rain - royal blue
  if (mm < 64.5) return '#1d4ed8'; // Heavy - deep blue
  if (mm < 115.6) return '#f59e0b'; // IMD Orange threshold - amber
  if (mm < 204.5) return '#dc2626'; // IMD Red threshold - crimson
  return '#9333ea'; // Extremely Heavy - purple
}

function getDeltaColor(delta) {
  if (delta < -15) return '#ef4444';
  if (delta < -5) return '#f87171';
  if (delta < 5) return '#94a3b8';
  if (delta < 15) return '#60a5fa';
  return '#2563eb';
}

function getProbColor(p) {
  if (p < 0.15) return '#10b981';
  if (p < 0.40) return '#facc15';
  if (p < 0.70) return '#f97316';
  return '#ef4444';
}

// Controller component to handle smooth fly-to animations and view resets
function MapController({ selectedDistrict, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDistrict && selectedDistrict.centroid_lat && selectedDistrict.centroid_lon) {
      map.flyTo([selectedDistrict.centroid_lat, selectedDistrict.centroid_lon], 7, {
        duration: 0.9,
        easeLinearity: 0.25
      });
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo([22.5, 82.0], 5, { duration: 0.8 });
    }
  }, [resetTrigger]);

  return null;
}

export default function MapViewer({
  geojsonData,
  forecastData,
  selectedDistrictId,
  onSelectDistrict
}) {
  const [activeLayer, setActiveLayer] = useState('monsooniq');
  const [activeBasemap, setActiveBasemap] = useState('osm');
  const [resetTrigger, setResetTrigger] = useState(0);

  // Map forecast data by district_id for instant O(1) lookup
  const forecastMap = React.useMemo(() => {
    const map = {};
    if (forecastData && forecastData.districts) {
      forecastData.districts.forEach((d) => {
        map[d.district_id] = d;
      });
    }
    return map;
  }, [forecastData]);

  const selectedDistrict = forecastMap[selectedDistrictId];

  // Style function for GeoJSON district polygons
  const styleFeature = (feature) => {
    const did = feature.properties.district_id;
    const item = forecastMap[did];
    const isSelected = did === selectedDistrictId;

    let fillColor = '#94a3b8';
    let fillOpacity = 0.82;

    if (item) {
      if (activeLayer === 'monsooniq') {
        fillColor = getRainColor(item.monsooniq_corrected);
      } else if (activeLayer === 'raw_nwp') {
        fillColor = getRainColor(item.raw_nwp);
      } else if (activeLayer === 'bias_delta') {
        fillColor = getDeltaColor(item.bias_delta);
      } else if (activeLayer === 'p_heavy') {
        fillColor = getProbColor(item.p_heavy);
      } else if (activeLayer === 'p_very_heavy') {
        fillColor = getProbColor(item.p_very_heavy);
      } else if (activeLayer === 'regime') {
        fillColor = REGIME_COLORS[item.dominant_regime] || '#64748b';
      }
    }

    return {
      fillColor: fillColor,
      weight: isSelected ? 3.5 : 1.8,
      opacity: 1,
      color: isSelected ? '#38bdf8' : '#1e293b',
      dashArray: isSelected ? '' : '',
      fillOpacity: fillOpacity
    };
  };

  const onEachFeature = (feature, layer) => {
    const did = feature.properties.district_id;
    const name = feature.properties.district_name;
    const item = forecastMap[did];

    layer.on({
      click: () => onSelectDistrict(did),
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ weight: 3.5, color: '#f8fafc', fillOpacity: 0.95 });
      },
      mouseout: (e) => {
        const l = e.target;
        const isSelected = did === selectedDistrictId;
        l.setStyle({
          weight: isSelected ? 3.5 : 1.8,
          color: isSelected ? '#38bdf8' : '#1e293b',
          fillOpacity: 0.82
        });
      }
    });

    if (item) {
      const tooltipContent = `
        <div class="text-xs p-1.5 font-sans leading-tight">
          <div class="font-bold text-slate-900 flex items-center justify-between gap-2">
            <span>${name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${
              item.alert_code === 'RED' ? 'bg-red-100 text-red-700' :
              item.alert_code === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
              item.alert_code === 'YELLOW' ? 'bg-amber-100 text-amber-700' :
              'bg-emerald-100 text-emerald-700'
            }">${item.alert_code}</span>
          </div>
          <div class="text-slate-500 text-[11px] mt-0.5">${item.state_name} • Regime: <b>${item.dominant_regime}</b></div>
          <div class="mt-1.5 pt-1 border-t border-slate-200">
            <span class="text-blue-700 font-bold">MonsoonIQ: ${item.monsooniq_corrected} mm</span>
            <span class="text-slate-500"> | Raw: ${item.raw_nwp} mm</span>
          </div>
          <div class="text-slate-600 text-[11px] mt-0.5">Heavy Rain Prob (≥64.5mm): <b>${(item.p_heavy * 100).toFixed(0)}%</b></div>
        </div>
      `;
      layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-custom shadow-xl rounded-xl' });
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 z-0">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Switcher */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1 text-xs pointer-events-auto">
          {[
            { id: 'monsooniq', label: 'MonsoonIQ AI' },
            { id: 'raw_nwp', label: 'Raw NWP' },
            { id: 'bias_delta', label: 'Correction Δ' },
            { id: 'p_heavy', label: 'P(≥64.5mm)' },
            { id: 'p_very_heavy', label: 'P(≥115.6mm)' },
            { id: 'regime', label: 'Weather Regime' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeLayer === layer.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* Action Controls: District Jump, Basemap & Reset */}
        <div className="flex items-center space-x-1.5 pointer-events-auto">
          {/* Quick District Selector */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center text-xs">
            <Compass className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={selectedDistrictId || ''}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="" disabled>Jump to district...</option>
              {forecastData?.districts?.map((d) => (
                <option key={d.district_id} value={d.district_id}>
                  {d.district_name} ({d.state_name})
                </option>
              ))}
            </select>
          </div>

          {/* Basemap Switcher */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex items-center text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={activeBasemap}
              onChange={(e) => setActiveBasemap(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="osm">OSM Streets</option>
              <option value="esri_dark">Dark Canvas</option>
              <option value="esri_light">Light Canvas</option>
              <option value="esri_topo">Terrain Relief</option>
            </select>
          </div>

          {/* Reset View Button */}
          <button
            onClick={() => setResetTrigger((prev) => prev + 1)}
            title="Reset India Map View"
            className="p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <MapContainer
        center={[22.5, 82.0]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController selectedDistrict={selectedDistrict} resetTrigger={resetTrigger} />

        <TileLayer
          key={activeBasemap}
          attribution={BASEMAP_TILES[activeBasemap].attribution}
          url={BASEMAP_TILES[activeBasemap].url}
        />

        {/* District GeoJSON Boundaries */}
        {geojsonData && (
          <GeoJSON
            key={`${activeLayer}-${selectedDistrictId}`}
            data={geojsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Interactive District Centroid Weather Badges */}
        {forecastData?.districts && forecastData.districts.map((d) => {
          const isSelected = d.district_id === selectedDistrictId;
          const isWarning = d.alert_code === 'RED' || d.alert_code === 'ORANGE';

          let fillCol = '#38bdf8';
          if (activeLayer === 'monsooniq') fillCol = getRainColor(d.monsooniq_corrected);
          else if (activeLayer === 'raw_nwp') fillCol = getRainColor(d.raw_nwp);
          else if (activeLayer === 'bias_delta') fillCol = getDeltaColor(d.bias_delta);
          else if (activeLayer === 'p_heavy') fillCol = getProbColor(d.p_heavy);
          else if (activeLayer === 'regime') fillCol = REGIME_COLORS[d.dominant_regime] || '#64748b';

          return (
            <React.Fragment key={d.district_id}>
              {/* Outer pulsing ring for severe weather districts */}
              {isWarning && (
                <CircleMarker
                  center={[d.centroid_lat, d.centroid_lon]}
                  radius={isSelected ? 18 : 14}
                  pathOptions={{
                    fillColor: d.alert_code === 'RED' ? '#ef4444' : '#f97316',
                    fillOpacity: 0.25,
                    color: d.alert_code === 'RED' ? '#dc2626' : '#ea580c',
                    weight: 1.5,
                    dashArray: '3, 3'
                  }}
                />
              )}

              {/* Centroid Interactive Badge Marker */}
              <CircleMarker
                center={[d.centroid_lat, d.centroid_lon]}
                radius={isSelected ? 11 : isWarning ? 9 : 7}
                pathOptions={{
                  fillColor: fillCol,
                  fillOpacity: 0.95,
                  color: isSelected ? '#ffffff' : '#0f172a',
                  weight: isSelected ? 3 : 1.5
                }}
                eventHandlers={{
                  click: () => onSelectDistrict(d.district_id)
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="text-xs p-1">
                    <b>{d.district_name}</b> ({d.state_name})<br/>
                    MonsoonIQ: <b>{d.monsooniq_corrected} mm</b> | Raw: {d.raw_nwp} mm<br/>
                    Regime: <b>{d.dominant_regime}</b>
                  </div>
                </Tooltip>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Floating Dynamic Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs max-w-[210px]">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <span>Map Legend</span>
          <span className="text-[10px] text-slate-400 font-normal">IMD Standards</span>
        </div>

        {activeLayer.includes('p_') ? (
          <div className="space-y-1">
            <div className="text-[10.5px] text-slate-500 mb-1">Calibrated Probability</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#10b981'}}></span><span>&lt; 15% (Low Risk)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#facc15'}}></span><span>15% - 40% (Elevated)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#f97316'}}></span><span>40% - 70% (Likely)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#ef4444'}}></span><span>&gt; 70% (High Threat)</span></div>
          </div>
        ) : activeLayer === 'bias_delta' ? (
          <div className="space-y-1">
            <div className="text-[10.5px] text-slate-500 mb-1">Correction Adjustment (mm)</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#2563eb'}}></span><span>&gt; +15 (Dry bias fixed)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#60a5fa'}}></span><span>+5 to +15 mm</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#94a3b8'}}></span><span>-5 to +5 mm (Neutral)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#f87171'}}></span><span>-15 to -5 mm</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#ef4444'}}></span><span>&lt; -15 (Over-forecast cut)</span></div>
          </div>
        ) : activeLayer === 'regime' ? (
          <div className="space-y-1">
            {Object.entries(REGIME_COLORS).map(([r, col]) => (
              <div key={r} className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{background: col}}></span>
                <span className="text-[10px] truncate">{r}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[10.5px] text-slate-500 mb-1">Precipitation (mm/day)</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#94a3b8'}}></span><span>&lt; 2.5 mm (Trace)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#38bdf8'}}></span><span>2.5 - 15.6 mm (Light)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#0284c7'}}></span><span>15.6 - 64.5 mm (Moderate)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#1d4ed8'}}></span><span>64.5 - 115.6 mm (Heavy)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#f59e0b'}}></span><span>115.6 - 204.5 mm (Very Heavy)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#dc2626'}}></span><span>&ge; 204.5 mm (Extreme)</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
