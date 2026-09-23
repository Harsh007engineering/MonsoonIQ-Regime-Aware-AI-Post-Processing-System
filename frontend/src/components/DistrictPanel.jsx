import React, { useState } from 'react';
import {
  AlertTriangle, TrendingUp, HelpCircle, FileText, Share2, Compass,
  CheckCircle2, Copy, Check, ShieldAlert, Sparkles, Droplets, Info
} from 'lucide-react';

export default function DistrictPanel({
  districtDetail,
  loading,
  onOpenShap,
  onOpenCap
}) {
  const [advisoryLanguage, setAdvisoryLanguage] = useState('english'); // 'english' or 'hindi'
  const [targetAudience, setTargetAudience] = useState('farmers'); // 'farmers' or 'disaster_managers'
  const [copiedAdvisory, setCopiedAdvisory] = useState(false);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  if (!districtDetail) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center text-slate-500 shadow-lg space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Select a District on the Map</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Click any district polygon or marker on the map, or use the search dropdown to view real-time regime diagnostics, quantile uncertainty, and tailored bilingual advisories.
          </p>
        </div>
      </div>
    );
  }

  const { district_name, state_name, zone, elevation_m, dominant_regime, forecast, uncertainty_bands, heavy_probabilities, advisory } = districtDetail;
  const alertCode = advisory?.alert_code || 'GREEN';

  const alertConfigs = {
    RED: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-300 dark:border-rose-800',
      text: 'text-rose-900 dark:text-rose-200',
      badge: 'bg-rose-600 text-white',
      label: 'RED WARNING: TAKE ACTION',
      desc: 'Extreme rainfall threat (≥204.5 mm). High risk of flash flooding and disruptions.'
    },
    ORANGE: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      border: 'border-amber-300 dark:border-amber-800',
      text: 'text-amber-900 dark:text-amber-200',
      badge: 'bg-amber-500 text-white',
      label: 'ORANGE ALERT: BE PREPARED',
      desc: 'Very heavy rainfall expected (≥115.6 mm). Waterlogging and transport impacts likely.'
    },
    YELLOW: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/40',
      border: 'border-yellow-300 dark:border-yellow-800',
      text: 'text-yellow-900 dark:text-yellow-200',
      badge: 'bg-yellow-500 text-slate-950',
      label: 'YELLOW WATCH: BE UPDATED',
      desc: 'Heavy rainfall isolated events (≥64.5 mm). Monitor weather updates.'
    },
    GREEN: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-300 dark:border-emerald-800',
      text: 'text-emerald-900 dark:text-emerald-200',
      badge: 'bg-emerald-600 text-white',
      label: 'GREEN: NO SEVERE WARNING',
      desc: 'Normal monsoon precipitation. Routine field operations may continue.'
    }
  };

  const currentAlert = alertConfigs[alertCode] || alertConfigs.GREEN;

  const handleCopyAdvisory = () => {
    const text = advisory?.[advisoryLanguage]?.[targetAudience] || '';
    if (text) {
      navigator.clipboard.writeText(`[MonsoonIQ Advisory - ${district_name}, ${state_name}]\nAlert: ${alertCode}\n${text}`);
      setCopiedAdvisory(true);
      setTimeout(() => setCopiedAdvisory(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
      {/* Official Bulletin Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official Meteorological Bulletin
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
                ID: {districtDetail.district_id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight flex items-center gap-2">
              <span>{district_name}</span>
              <span className="text-sm font-normal text-slate-500 font-sans">({state_name})</span>
            </h2>
          </div>

          {/* Official IMD Color Badge */}
          <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wide shadow-sm ${currentAlert.badge}`}>
            {alertCode}
          </span>
        </div>

        {/* Geographic & Synoptic Metadata Pill */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Zone: <b className="text-slate-700 dark:text-slate-200">{zone}</b></span>
          <span>•</span>
          <span>Elev: <b className="text-slate-700 dark:text-slate-200">{Math.round(Number(elevation_m) || 0)} m</b></span>
          <span>•</span>
          <span>Prevailing Regime: <b className="text-sky-600 dark:text-sky-400">{dominant_regime}</b></span>
        </div>
      </div>

      {/* Official IMD Hazard Banner */}
      <div className={`p-3.5 rounded-xl border ${currentAlert.bg} ${currentAlert.border} space-y-1`}>
        <div className="flex items-center space-x-2">
          <ShieldAlert className={`w-4 h-4 shrink-0 ${currentAlert.text}`} />
          <span className={`font-bold text-xs ${currentAlert.text}`}>{currentAlert.label}</span>
        </div>
        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-snug pl-6">
          {currentAlert.desc}
        </p>
      </div>

      {/* 3-Way Comparative Rain Metrics: Raw NWP vs MonsoonIQ AI vs Observed */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>24-Hour Rainfall Comparison</span>
          <span className="text-slate-400 font-normal">NWP vs AI Post-Processed</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* Raw NWP */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-0.5">
            <div className="text-[10.5px] text-slate-500 font-medium">Raw NWP Model</div>
            <div className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
              {forecast.raw_nwp} <span className="text-[10px] font-normal text-slate-400">mm</span>
            </div>
            <div className="text-[10px] text-slate-400">Uncorrected GFS</div>
          </div>

          {/* MonsoonIQ Corrected */}
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-800 space-y-0.5 shadow-sm relative overflow-hidden">
            <div className="text-[10.5px] font-bold text-sky-700 dark:text-sky-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>MonsoonIQ AI</span>
            </div>
            <div className="text-lg font-black text-sky-800 dark:text-sky-200 font-mono">
              {forecast.monsooniq_corrected} <span className="text-[10px] font-normal text-sky-600/80">mm</span>
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-bold">
              Δ {forecast.bias_delta > 0 ? `+${forecast.bias_delta}` : forecast.bias_delta} mm
            </div>
          </div>

          {/* Observed Truth */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-0.5">
            <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300 font-medium">Observed Truth</div>
            <div className="text-lg font-black text-emerald-800 dark:text-emerald-200 font-mono">
              {forecast.observed_rain} <span className="text-[10px] font-normal text-emerald-600/80">mm</span>
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400">IMD Verification</div>
          </div>
        </div>
      </div>

      {/* Quantile Uncertainty Range (P10 - P50 - P90) */}
      {(() => {
        const p10 = Number(uncertainty_bands?.p10) || 0;
        const p50 = Number(uncertainty_bands?.p50) || 0;
        const p90 = Number(uncertainty_bands?.p90) || 0;
        const maxScale = Math.max(20, Math.ceil(p90 * 1.3));
        const leftPct = Math.min(95, Math.max(0, (p10 / maxScale) * 100));
        const rightPct = Math.min(100, Math.max(leftPct + 4, (p90 / maxScale) * 100));
        const widthPct = Math.max(5, rightPct - leftPct);
        const p50Pct = Math.min(98, Math.max(2, (p50 / maxScale) * 100));

        return (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>Forecast Uncertainty Range (P10 - P90)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">LightGBM Quantiles</span>
            </div>

            <div className="relative pt-3 pb-1">
              {/* Full scale track */}
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                {/* 10th to 90th percentile shaded band */}
                <div
                  className="bg-gradient-to-r from-sky-400 via-indigo-500 to-blue-600 h-full rounded-full opacity-90 shadow-sm"
                  style={{
                    marginLeft: `${leftPct}%`,
                    width: `${widthPct}%`
                  }}
                ></div>
              </div>

              {/* P50 Median marker pip */}
              <div
                className="absolute top-1.5 w-1 h-6 bg-slate-900 dark:bg-white rounded-full shadow-md -ml-0.5 pointer-events-none"
                style={{ left: `${p50Pct}%` }}
                title={`Median (P50): ${p50} mm`}
              ></div>

              {/* Range labels */}
              <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-mono">
                <span>P10: <b className="text-slate-800 dark:text-slate-200">{p10} mm</b></span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">Median (P50): <b>{p50} mm</b></span>
                <span>P90: <b className="text-slate-800 dark:text-slate-200">{p90} mm</b></span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Severe Rainfall Exceedance Probabilities */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          IMD Heavy Rainfall Exceedance Risk
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Heavy (≥64.5 mm)', val: heavy_probabilities.p_heavy_64_5, color: '#0284c7' },
            { label: 'V. Heavy (≥115.6 mm)', val: heavy_probabilities.p_very_heavy_115_6, color: '#f59e0b' },
            { label: 'Extreme (≥204.5 mm)', val: heavy_probabilities.p_extremely_heavy_204_5, color: '#dc2626' },
          ].map((item, idx) => {
            const pct = Math.round(item.val * 100);
            return (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 font-medium truncate">{item.label}</div>
                <div className="text-lg font-black mt-0.5 font-mono" style={{ color: item.color }}>
                  {pct}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: item.color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bilingual Plain-Language Agro & Disaster Advisory */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Operational Weather Advisory</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setAdvisoryLanguage('english')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                advisoryLanguage === 'english' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setAdvisoryLanguage('hindi')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                advisoryLanguage === 'hindi' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Audience Tabs: Krishi vs Disaster Management */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-2 text-xs">
          <button
            onClick={() => setTargetAudience('farmers')}
            className={`font-semibold pb-1 transition-all ${
              targetAudience === 'farmers'
                ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🌾 Krishi / Farmer Advisory
          </button>
          <button
            onClick={() => setTargetAudience('disaster_managers')}
            className={`font-semibold pb-1 transition-all ${
              targetAudience === 'disaster_managers'
                ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🛡️ DDMA / Disaster Officials
          </button>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {advisory?.[advisoryLanguage]?.[targetAudience] || "No active advisory for this category."}
        </p>

        <div className="pt-1 flex justify-end">
          <button
            onClick={handleCopyAdvisory}
            className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            {copiedAdvisory ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAdvisory ? 'Copied to Clipboard!' : 'Copy Advisory'}</span>
          </button>
        </div>
      </div>

      {/* Action Buttons: SHAP Diagnostics & CAP v1.2 JSON */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onOpenShap}
          className="flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold transition-all shadow-sm"
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>TreeSHAP Attribution</span>
        </button>

        <button
          onClick={onOpenCap}
          className="flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-xs font-bold transition-all shadow-sm"
        >
          <Share2 className="w-4 h-4 text-amber-600" />
          <span>CAP v1.2 Alert JSON</span>
        </button>
      </div>
    </div>
  );
}
