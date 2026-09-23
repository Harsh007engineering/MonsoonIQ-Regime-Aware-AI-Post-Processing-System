import React, { useState, useEffect } from 'react';
import MapViewer from '../components/MapViewer';
import DistrictPanel from '../components/DistrictPanel';
import DistrictTable from '../components/DistrictTable';
import ShapModal from '../components/ShapModal';
import CapAlertModal from '../components/CapAlertModal';
import { fetchDistrictsGeoJSON, fetchCorrectedForecast, fetchDistrictDetail, fetchExplainability } from '../api';
import {
  CloudRain, ShieldAlert, AlertTriangle, AlertOctagon, TrendingDown,
  Layers, CheckCircle2, Wind, Droplets, Compass, BarChart2, ShieldCheck
} from 'lucide-react';

export default function Dashboard({ selectedDate, leadTime }) {
  const [geojsonData, setGeojsonData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState('MH_MUM');
  const [districtDetail, setDistrictDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Modals
  const [shapData, setShapData] = useState(null);
  const [isShapOpen, setIsShapOpen] = useState(false);
  const [isCapOpen, setIsCapOpen] = useState(false);

  // Load GeoJSON once
  useEffect(() => {
    fetchDistrictsGeoJSON()
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error('Failed to load GeoJSON:', err));
  }, []);

  // Load Forecast when date or lead time changes
  useEffect(() => {
    setLoadingForecast(true);
    fetchCorrectedForecast(selectedDate, leadTime, 'district')
      .then((data) => {
        setForecastData(data);
        setLoadingForecast(false);
      })
      .catch((err) => {
        console.error('Failed to load forecast:', err);
        setLoadingForecast(false);
      });
  }, [selectedDate, leadTime]);

  // Load District Detail when districtId, date, or leadTime changes
  useEffect(() => {
    if (!selectedDistrictId) return;
    setLoadingDetail(true);
    fetchDistrictDetail(selectedDistrictId, selectedDate, leadTime)
      .then((data) => {
        setDistrictDetail(data);
        setLoadingDetail(false);
      })
      .catch((err) => {
        console.error('Failed to load district detail:', err);
        setLoadingDetail(false);
      });
  }, [selectedDistrictId, selectedDate, leadTime]);

  // Handle SHAP open
  const handleOpenShap = () => {
    if (!selectedDistrictId) return;
    fetchExplainability(selectedDistrictId, selectedDate)
      .then((data) => {
        setShapData(data);
        setIsShapOpen(true);
      })
      .catch((err) => console.error('Failed to load SHAP data:', err));
  };

  // Compute operational summary metrics
  const stats = React.useMemo(() => {
    if (!forecastData?.districts || forecastData.districts.length === 0) {
      return { red: 0, orange: 0, yellow: 0, green: 0, avgRain: 0, maxRain: 0, maxDistrict: 'N/A' };
    }
    let r = 0, o = 0, y = 0, g = 0, total = 0;
    let maxR = -1;
    let maxDist = '';

    forecastData.districts.forEach((d) => {
      total += d.monsooniq_corrected;
      if (d.monsooniq_corrected > maxR) {
        maxR = d.monsooniq_corrected;
        maxDist = `${d.district_name} (${d.state_name})`;
      }
      if (d.alert_code === 'RED') r++;
      else if (d.alert_code === 'ORANGE') o++;
      else if (d.alert_code === 'YELLOW') y++;
      else g++;
    });

    return {
      red: r,
      orange: o,
      yellow: y,
      green: g,
      avgRain: (total / forecastData.districts.length).toFixed(1),
      maxRain: maxR > 0 ? maxR.toFixed(1) : '0.0',
      maxDistrict: maxDist || 'None'
    };
  }, [forecastData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Official Synoptic Meteorological Situation Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                Operational Forecast Window
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Lead Day {leadTime} • Valid: <b>{selectedDate}</b>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
              All-India Operational Severe Weather Decision Support
            </h1>
          </div>

          {/* National Summary Key Stats */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10.5px] text-slate-500 block">National Area-Mean Rain</span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.avgRain} mm
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10.5px] text-slate-500 block">24h Peak Deluge</span>
              <span className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
                {stats.maxRain} mm
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">{stats.maxDistrict}</span>
            </div>
          </div>
        </div>

        {/* IMD 4-Stage Warning Ticker Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Red Warning */}
          <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {stats.red}
            </div>
            <div>
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200">Red Warnings</div>
              <div className="text-[11px] text-rose-700/80 dark:text-rose-400 font-medium">Take Action (≥204.5mm)</div>
            </div>
          </div>

          {/* Orange Alert */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {stats.orange}
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">Orange Alerts</div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400 font-medium">Be Prepared (≥115.6mm)</div>
            </div>
          </div>

          {/* Yellow Watch */}
          <div className="p-3.5 rounded-xl bg-yellow-50/80 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/50 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {stats.yellow}
            </div>
            <div>
              <div className="text-xs font-bold text-yellow-900 dark:text-yellow-200">Yellow Watches</div>
              <div className="text-[11px] text-yellow-700/80 dark:text-yellow-400 font-medium">Be Updated (≥64.5mm)</div>
            </div>
          </div>

          {/* Green Normal */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {stats.green}
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Green / Normal</div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-medium">No Warning (&lt;64.5mm)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Meteorological Studio: GIS Map (7 cols) + Official Bulletin (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Column (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <MapViewer
            geojsonData={geojsonData}
            forecastData={forecastData}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={(id) => setSelectedDistrictId(id)}
          />
        </div>

        {/* Official Bulletin Column (5 cols) */}
        <div className="lg:col-span-5">
          <DistrictPanel
            districtDetail={districtDetail}
            loading={loadingDetail}
            onOpenShap={handleOpenShap}
            onOpenCap={() => setIsCapOpen(true)}
          />
        </div>
      </div>

      {/* National District Forecast Matrix Table */}
      <DistrictTable
        districts={forecastData?.districts}
        selectedDistrictId={selectedDistrictId}
        onSelectDistrict={(id) => setSelectedDistrictId(id)}
      />

      {/* Dialog Modals with Elevated Z-Index */}
      <ShapModal
        isOpen={isShapOpen}
        onClose={() => setIsShapOpen(false)}
        shapData={shapData}
        districtName={districtDetail?.district_name || 'Selected District'}
      />

      <CapAlertModal
        isOpen={isCapOpen}
        onClose={() => setIsCapOpen(false)}
        capData={districtDetail?.cap_alert}
        districtName={districtDetail?.district_name || 'Selected District'}
      />
    </div>
  );
}
