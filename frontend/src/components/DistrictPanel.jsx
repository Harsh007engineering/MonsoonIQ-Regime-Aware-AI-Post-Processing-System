import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, HelpCircle, FileText, Share2, Compass, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function DistrictPanel({
  districtDetail,
  loading,
  onOpenShap,
  onOpenCap
}) {
  const [advisoryLanguage, setAdvisoryLanguage] = useState('english'); // 'english' or 'hindi'
  const [targetAudience, setTargetAudience] = useState('farmers'); // 'farmers' or 'disaster_managers'

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-md animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (!districtDetail) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center text-slate-500 shadow-md">
        <Compass className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">No District Selected</h3>
        <p className="text-xs mt-1">Click any district on the map or search from the table below to view regime diagnostics and tailored advisories.</p>
      </div>
    );
  }

  const { district_name, state_name, zone, elevation_m, dominant_regime, forecast, uncertainty_bands, heavy_probabilities, advisory } = districtDetail;
  const alertCode = advisory?.alert_code || 'GREEN';

  const alertColors = {
    GREEN: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    YELLOW: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    ORANGE: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
    RED: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
      {/* Header Info & Alert Badge */}
      <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>{district_name}</span>
            <span className="text-xs font-normal text-slate-500">({state_name})</span>
          </h2>
          <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
            <span>Zone: <b>{zone}</b></span>
            <span>•</span>
            <span>Elev: <b>{elevation_m}m</b></span>
            <span>•</span>
            <span>Regime: <b className="text-sky-600 dark:text-sky-400">{dominant_regime}</b></span>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${alertColors[alertCode] || alertColors.GREEN}`}>
          {advisory?.alert_label_en || alertCode}
        </div>
      </div>

      {/* Comparison Metric Cards: Raw vs MonsoonIQ vs Observed */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div className="text-[11px] text-slate-500">Raw NWP</div>
          <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
            {forecast.raw_nwp} <span className="text-[10px] font-normal">mm</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
          <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">MonsoonIQ AI</div>
          <div className="text-base font-bold text-sky-800 dark:text-sky-200 mt-0.5">
            {forecast.monsooniq_corrected} <span className="text-[10px] font-normal">mm</span>
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400">
            Δ {forecast.bias_delta > 0 ? `+${forecast.bias_delta}` : forecast.bias_delta} mm
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Observed Truth</div>
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">
            {forecast.observed_rain} <span className="text-[10px] font-normal">mm</span>
          </div>
        </div>
      </div>

      {/* Probabilistic Uncertainty Band (P10 - P50 - P90) */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Forecast Uncertainty Range (P10 - P90)</span>
          <span className="text-[11px] text-slate-500 font-normal">Quantile Regression</span>
        </div>
        <div className="relative pt-2 pb-1">
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div
              className="bg-sky-400 h-full rounded-full"
              style={{
                marginLeft: `${Math.min(100, (uncertainty_bands.p10 / 120) * 100)}%`,
                width: `${Math.min(100, ((uncertainty_bands.p90 - uncertainty_bands.p10) / 120) * 100)}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-[10.5px] text-slate-500 mt-1 font-mono">
            <span>P10: <b>{uncertainty_bands.p10} mm</b></span>
            <span>Median (P50): <b>{uncertainty_bands.p50} mm</b></span>
            <span>P90: <b>{uncertainty_bands.p90} mm</b></span>
          </div>
        </div>
      </div>

      {/* Extreme Heavy-Rainfall Risk Probability Gauges */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Calibrated Severe Rainfall Exceedance
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Heavy (≥64.5 mm)', val: heavy_probabilities.p_heavy_64_5, color: '#0284c7' },
            { label: 'V. Heavy (≥115.6 mm)', val: heavy_probabilities.p_very_heavy_115_6, color: '#f59e0b' },
            { label: 'Extremely (≥204.5 mm)', val: heavy_probabilities.p_extremely_heavy_204_5, color: '#ef4444' },
          ].map((item, idx) => {
            const pct = Math.round(item.val * 100);
            return (
              <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-center">
                <div className="text-[10px] text-slate-500 truncate">{item.label}</div>
                <div className="text-base font-extrabold mt-0.5" style={{ color: item.color }}>
                  {pct}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bilingual Plain-Language Advisory Panel */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Plain-Language Operational Advisory</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setAdvisoryLanguage('english')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                advisoryLanguage === 'english' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setAdvisoryLanguage('hindi')}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                advisoryLanguage === 'hindi' ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        </div>

        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700 pb-1.5 text-xs">
          <button
            onClick={() => setTargetAudience('farmers')}
            className={`font-medium transition-colors ${
              targetAudience === 'farmers' ? 'text-sky-600 border-b-2 border-sky-600 pb-0.5 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🌾 Farmers / Krishi
          </button>
          <button
            onClick={() => setTargetAudience('disaster_managers')}
            className={`font-medium transition-colors ${
              targetAudience === 'disaster_managers' ? 'text-sky-600 border-b-2 border-sky-600 pb-0.5 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            🛡️ Disaster Officials (DDMA)
          </button>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          {advisory?.[advisoryLanguage]?.[targetAudience] || "No active advisory for this category."}
        </p>
      </div>

      {/* Action Buttons: SHAP and CAP */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onOpenShap}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>SHAP Feature Attribution</span>
        </button>

        <button
          onClick={onOpenCap}
          className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>CAP v1.2 Alert JSON</span>
        </button>
      </div>
    </div>
  );
}
