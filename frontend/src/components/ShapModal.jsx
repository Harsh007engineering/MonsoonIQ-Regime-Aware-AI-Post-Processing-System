import React from 'react';
import { X, TrendingUp, HelpCircle, Activity } from 'lucide-react';

export default function ShapModal({ isOpen, onClose, shapData, districtName }) {
  if (!isOpen || !shapData) return null;

  const { predicted_regime_name, soft_probabilities, top_feature_attributions } = shapData;

  const featureLabels = {
    u850: 'Somali Low-Level Jet (U850 wind, m/s)',
    vorticity_850: '850 hPa Cyclonic Vorticity (s⁻¹)',
    olr_anomaly: 'Convective Outgoing Longwave Anomaly (W/m²)',
    mslp_anomaly: 'Mean Sea Level Pressure Anomaly (hPa)',
    slope: 'Terrain Elevation Gradient (Orographic lift)',
    elevation: 'Elevation above sea level (m)',
    dist_coast: 'Distance to Coastline (km)',
    moisture_flux: 'Boundary Layer Moisture Flux (kg/m/s)',
    trough_latitude: 'Monsoon Trough Latitude (°N)',
    cape: 'Convective Available Potential Energy (J/kg)',
    q500: '500 hPa Specific Humidity (kg/kg)',
    latitude: 'Geographic Latitude (°N)',
    longitude: 'Geographic Longitude (°E)'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                SHAP Explainability Attribution
              </h3>
              <p className="text-[11px] text-slate-500">
                {districtName} • Dominant Regime: <b>{predicted_regime_name}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regime Soft Probabilities */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Regime Classifier Soft Probabilities
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {soft_probabilities && Object.entries(soft_probabilities).map(([name, p]) => (
              <div key={name} className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 truncate">{name}:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{(p * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Feature Attributions */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>Key Meteorological Features Driving Bias Correction</span>
            <span className="text-[10px] text-slate-400 font-normal">TreeSHAP Values</span>
          </div>

          <div className="space-y-2.5">
            {top_feature_attributions && top_feature_attributions.map((item, idx) => {
              const isPositive = item.shap_contribution >= 0;
              const barWidth = Math.min(100, Math.abs(item.shap_contribution) * 80);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {featureLabels[item.feature] || item.feature}
                    </span>
                    <span className="font-mono text-slate-500">
                      val: <b>{item.value}</b> | SHAP: <b className={isPositive ? 'text-sky-600' : 'text-rose-500'}>{item.shap_contribution > 0 ? `+${item.shap_contribution}` : item.shap_contribution}</b>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${isPositive ? 'bg-sky-500' : 'bg-rose-500'}`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Positive SHAP contributions increase the probability of heavy rainfall under the identified regime, while negative values reduce false alarms.
          </span>
        </div>
      </div>
    </div>
  );
}
