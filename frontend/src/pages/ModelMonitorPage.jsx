import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Gauge, Zap } from 'lucide-react';

export default function ModelMonitorPage() {
  const driftMetrics = [
    { feature: 'Somali Jet (U850)', baselineMean: '12.4 m/s', recentMean: '12.8 m/s', driftScore: '0.04 (Normal)', status: 'HEALTHY' },
    { feature: '850 hPa Vorticity', baselineMean: '2.1e-5 s⁻¹', recentMean: '2.3e-5 s⁻¹', driftScore: '0.05 (Normal)', status: 'HEALTHY' },
    { feature: 'Convective OLR Anomaly', baselineMean: '-4.2 W/m²', recentMean: '-5.1 W/m²', driftScore: '0.08 (Normal)', status: 'HEALTHY' },
    { feature: 'CAPE Convective Energy', baselineMean: '1450 J/kg', recentMean: '1520 J/kg', driftScore: '0.06 (Normal)', status: 'HEALTHY' },
    { feature: 'MSLP Pressure Anomaly', baselineMean: '-1.1 hPa', recentMean: '-1.4 hPa', driftScore: '0.03 (Normal)', status: 'HEALTHY' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-sky-600" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Model Performance & Data Drift Monitor
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Continuous tracking of rolling post-processing skill, feature distribution shifts, and operational model inference latency.
        </p>
      </div>

      {/* Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Inference Latency</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">18 ms</div>
          <div className="text-[11px] text-slate-400">Sub-50ms national district rollout</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Rolling 30-Day RMSE</div>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">2.84 mm</div>
          <div className="text-[11px] text-slate-400">Stable post-processing error</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Model Calibration Drift</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">0.021</div>
          <div className="text-[11px] text-slate-400">Well within 0.05 safety bound</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Regime Stability</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5 font-mono">
            <CheckCircle2 className="w-5 h-5" />
            <span>Optimal</span>
          </div>
          <div className="text-[11px] text-slate-400">7 experts operational</div>
        </div>
      </div>

      {/* Feature Drift Monitor Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Atmospheric Predictor Distribution & Drift Tracking (KS Test)</span>
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Predictor Feature</th>
                <th className="py-3 px-3">Training Climatology</th>
                <th className="py-3 px-3">Recent Test Mean</th>
                <th className="py-3 px-3">Drift Score</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {driftMetrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{m.feature}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{m.baselineMean}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{m.recentMean}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{m.driftScore}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10.5px]">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
