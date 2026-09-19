import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';
import { Layers, MapPin, Eye, Info } from 'lucide-react';

const REGIME_COLORS = {
  'Active Monsoon': '#0284c7',
  'Break Monsoon': '#f59e0b',
  'Monsoon Low/Depression': '#dc2626',
  'Orographic': '#059669',
  'Coastal': '#06b6d4',
  'Western Disturbance': '#7c3aed',
  'Weak/Normal': '#64748b'
};

function getRainColor(mm) {
  if (mm < 2.5) return '#f8fafc';
  if (mm < 15.6) return '#bae6fd';
  if (mm < 35.5) return '#38bdf8';
  if (mm < 64.5) return '#0284c7';
  if (mm < 115.6) return '#d97706'; // IMD Orange threshold
  if (mm < 204.5) return '#dc2626'; // IMD Red threshold
  return '#9333ea'; // Extremely Heavy
}

function getDeltaColor(delta) {
  if (delta < -15) return '#ef4444';
  if (delta < -5) return '#f87171';
  if (delta < 5) return '#e2e8f0';
  if (delta < 15) return '#60a5fa';
  return '#2563eb';
}

function getProbColor(p) {
  if (p < 0.15) return '#10b981';
  if (p < 0.40) return '#facc15';
  if (p < 0.70) return '#f97316';
  return '#ef4444';
}

export default function MapViewer({
  geojsonData,
  forecastData,
  selectedDistrictId,
  onSelectDistrict
}) {
  const [activeLayer, setActiveLayer] = useState('monsooniq'); // 'monsooniq', 'raw_nwp', 'bias_delta', 'p_heavy', 'p_very_heavy', 'regime'
  const [viewMode, setViewMode] = useState('district'); // 'district' or 'grid'

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

  // Style function for GeoJSON district polygons
  const styleFeature = (feature) => {
    const did = feature.properties.district_id;
    const item = forecastMap[did];
    const isSelected = did === selectedDistrictId;

    let fillColor = '#cbd5e1';
    let fillOpacity = 0.75;

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
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#ffffff' : '#334155',
      dashArray: isSelected ? '4' : '',
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
        l.setStyle({ weight: 2.5, color: '#f8fafc' });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({
          weight: did === selectedDistrictId ? 3 : 1,
          color: did === selectedDistrictId ? '#ffffff' : '#334155'
        });
      }
    });

    if (item) {
      const tooltipContent = `
        <div class="text-xs p-1">
          <div class="font-bold text-slate-900">${name} (${item.state_name})</div>
          <div class="text-slate-600">Regime: <span class="font-medium">${item.dominant_regime}</span></div>
          <div class="mt-1">
            <span class="text-blue-700 font-bold">MonsoonIQ: ${item.monsooniq_corrected} mm</span>
            <span class="text-slate-500"> | Raw: ${item.raw_nwp} mm</span>
          </div>
          <div class="text-slate-600">P(>=64.5mm): ${(item.p_heavy * 100).toFixed(0)}%</div>
        </div>
      `;
      layer.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-tooltip-custom' });
    }
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-900">
      {/* Layer Switcher Controls Bar */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1 text-xs">
        {[
          { id: 'monsooniq', label: 'MonsoonIQ Corrected' },
          { id: 'raw_nwp', label: 'Raw NWP' },
          { id: 'bias_delta', label: 'Correction Δ (Delta)' },
          { id: 'p_heavy', label: 'Heavy Rain Prob (>=64.5mm)' },
          { id: 'p_very_heavy', label: 'Very Heavy (>=115.6mm)' },
          { id: 'regime', label: 'Regime Map' },
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

        {/* View Mode Toggle */}
        <div className="ml-2 pl-2 border-l border-slate-300 dark:border-slate-700 flex items-center space-x-1">
          <button
            onClick={() => setViewMode('district')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
              viewMode === 'district' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Districts
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
              viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            0.25° Grid
          </button>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <MapContainer
        center={[22.0, 80.0]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* District Polygon Layer */}
        {viewMode === 'district' && geojsonData && (
          <GeoJSON
            key={`${activeLayer}-${selectedDistrictId}`}
            data={geojsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Grid Point Circle Layer */}
        {viewMode === 'grid' && forecastData?.districts && (
          <>
            {forecastData.districts.map((d) => {
              let c = '#38bdf8';
              if (activeLayer === 'monsooniq') c = getRainColor(d.monsooniq_corrected);
              else if (activeLayer === 'raw_nwp') c = getRainColor(d.raw_nwp);
              else if (activeLayer === 'bias_delta') c = getDeltaColor(d.bias_delta);
              else if (activeLayer === 'p_heavy') c = getProbColor(d.p_heavy);
              else if (activeLayer === 'regime') c = REGIME_COLORS[d.dominant_regime] || '#64748b';

              return (
                <CircleMarker
                  key={d.district_id}
                  center={[d.centroid_lat, d.centroid_lon]}
                  radius={didIsSelected(d.district_id, selectedDistrictId) ? 10 : 7}
                  pathOptions={{
                    fillColor: c,
                    fillOpacity: 0.85,
                    color: '#ffffff',
                    weight: didIsSelected(d.district_id, selectedDistrictId) ? 2.5 : 1
                  }}
                  eventHandlers={{
                    click: () => onSelectDistrict(d.district_id)
                  }}
                >
                  <Tooltip>
                    <b>{d.district_name}</b> ({d.state_name})<br/>
                    MonsoonIQ: {d.monsooniq_corrected} mm | Raw: {d.raw_nwp} mm<br/>
                    Regime: {d.dominant_regime}
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </>
        )}
      </MapContainer>

      {/* Floating Dynamic Map Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 text-xs">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center justify-between">
          <span>Legend</span>
          <span className="text-[10px] text-slate-400 font-normal">IMD Standards</span>
        </div>

        {activeLayer.includes('p_') ? (
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 mb-1">Calibrated Probability</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#10b981'}}></span><span>&lt; 15% (Low Risk)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#facc15'}}></span><span>15% - 40% (Elevated)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#f97316'}}></span><span>40% - 70% (Likely)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#ef4444'}}></span><span>&gt; 70% (High Confidence)</span></div>
          </div>
        ) : activeLayer === 'bias_delta' ? (
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 mb-1">Correction Adjustment (mm)</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#2563eb'}}></span><span>&gt; +15 (Dry bias fixed)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#60a5fa'}}></span><span>+5 to +15 mm</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#e2e8f0'}}></span><span>-5 to +5 mm (Neutral)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#f87171'}}></span><span>-15 to -5 mm</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#ef4444'}}></span><span>&lt; -15 (Over-prediction trimmed)</span></div>
          </div>
        ) : activeLayer === 'regime' ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {Object.entries(REGIME_COLORS).map(([r, col]) => (
              <div key={r} className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full" style={{background: col}}></span>
                <span className="text-[10.5px] truncate">{r}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-[11px] text-slate-500 mb-1">Precipitation (mm/day)</div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded border border-slate-300" style={{background: '#f8fafc'}}></span><span>&lt; 2.5 mm (Trace)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#bae6fd'}}></span><span>2.5 - 15.6 mm (Light)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#38bdf8'}}></span><span>15.6 - 64.5 mm (Moderate)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#0284c7'}}></span><span>64.5 - 115.6 mm (Heavy)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#d97706'}}></span><span>115.6 - 204.5 mm (Very Heavy)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-3.5 h-3 rounded" style={{background: '#dc2626'}}></span><span>&gt;= 204.5 mm (Extremely Heavy)</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function didIsSelected(did, targetId) {
  return did === targetId;
}
