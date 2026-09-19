import React, { useState, useEffect } from 'react';
import MapViewer from '../components/MapViewer';
import DistrictPanel from '../components/DistrictPanel';
import DistrictTable from '../components/DistrictTable';
import ShapModal from '../components/ShapModal';
import CapAlertModal from '../components/CapAlertModal';
import { fetchDistrictsGeoJSON, fetchCorrectedForecast, fetchDistrictDetail, fetchExplainability } from '../api';
import { CloudRain, ShieldCheck, AlertOctagon, TrendingDown, Layers, CheckCircle2 } from 'lucide-react';

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

  // Compute summary stats
  const stats = React.useMemo(() => {
    if (!forecastData?.districts) return { red: 0, orange: 0, yellow: 0, green: 0, avgRain: 0 };
    let r = 0, o = 0, y = 0, g = 0, total = 0;
    forecastData.districts.forEach((d) => {
      total += d.monsooniq_corrected;
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
      avgRain: (total / forecastData.districts.length).toFixed(1)
    };
  }, [forecastData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Alert & Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">National Avg Rain</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">{stats.avgRain} mm</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-rose-200 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 flex items-center justify-center shrink-0 font-bold text-sm">
            {stats.red}
          </div>
          <div>
            <div className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">Red Warnings</div>
            <div className="text-[11px] text-rose-600/80 dark:text-rose-400">Extreme Threat (≥204.5mm)</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/60 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-orange-200 dark:bg-orange-900/80 text-orange-700 dark:text-orange-200 flex items-center justify-center shrink-0 font-bold text-sm">
            {stats.orange}
          </div>
          <div>
            <div className="text-[11px] text-orange-700 dark:text-orange-300 font-medium">Orange Alerts</div>
            <div className="text-[11px] text-orange-600/80 dark:text-orange-400">Very Heavy (≥115.6mm)</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 shadow-sm flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-200 dark:bg-amber-900/80 text-amber-700 dark:text-amber-200 flex items-center justify-center shrink-0 font-bold text-sm">
            {stats.yellow}
          </div>
          <div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Yellow Watches</div>
            <div className="text-[11px] text-amber-600/80 dark:text-amber-400">Heavy Rain (≥64.5mm)</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-lg bg-emerald-200 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-200 flex items-center justify-center shrink-0 font-bold text-sm">
            {stats.green}
          </div>
          <div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">Green / Normal</div>
            <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400">No Warning</div>
          </div>
        </div>
      </div>

      {/* Main Map + District Panel Grid */}
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

        {/* District Detail Column (5 cols) */}
        <div className="lg:col-span-5">
          <DistrictPanel
            districtDetail={districtDetail}
            loading={loadingDetail}
            onOpenShap={handleOpenShap}
            onOpenCap={() => setIsCapOpen(true)}
          />
        </div>
      </div>

      {/* Sortable & Searchable District Table */}
      <DistrictTable
        districts={forecastData?.districts}
        selectedDistrictId={selectedDistrictId}
        onSelectDistrict={(id) => setSelectedDistrictId(id)}
      />

      {/* Modals */}
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
