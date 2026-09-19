import React, { useState, useEffect } from 'react';
import { fetchHeavyEventsSummary } from '../api';
import { ShieldAlert, AlertTriangle, Filter, CheckCircle2, Layers, Compass } from 'lucide-react';

export default function HeavyRainSkillPage() {
  const [heavyData, setHeavyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeThreshold, setActiveThreshold] = useState('heavy_64_5'); // 'heavy_64_5' or 'very_heavy_115_6'

  useEffect(() => {
    fetchHeavyEventsSummary()
      .then((data) => {
        setHeavyData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load heavy events summary:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto"></div>
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  if (!heavyData) {
    return (
      <div className="p-8 text-center text-slate-500">
        Heavy events skill data is not available. Please verify backend execution.
      </div>
    );
  }

  const selectedData = heavyData[activeThreshold];
  const overall = selectedData.overall_by_system;
  const regimes = selectedData.by_regime;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Dedicated Severe Rainfall Verification (IMD Thresholds)
              </h1>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-semibold">
                Rare Events Focus
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluated strictly on held-out test years with explicit sample sizes and event counts to prevent small-sample distortion.
            </p>
          </div>

          {/* Threshold Switcher Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveThreshold('heavy_64_5')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeThreshold === 'heavy_64_5'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Heavy (≥ 64.5 mm/day)
            </button>
            <button
              onClick={() => setActiveThreshold('very_heavy_115_6')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeThreshold === 'very_heavy_115_6'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Very Heavy (≥ 115.6 mm/day)
            </button>
          </div>
        </div>
      </div>

      {/* Event Count & Overall Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">Verified Extreme Events</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            {selectedData.total_events} <span className="text-xs font-normal text-slate-500">events</span>
          </div>
          <div className="text-[11px] text-slate-400">Sample size on held-out test set</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">POD (Hit Rate)</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {(overall.monsooniq.pod * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Raw NWP: {(overall.raw_nwp.pod * 100).toFixed(1)}%</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">FAR (False Alarm Ratio)</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {(overall.monsooniq.far * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400">Controlled false alarm rate</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="text-xs text-slate-500 font-medium">CSI (Threat Score)</div>
          <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
            {overall.monsooniq.csi.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400">Raw NWP: {overall.raw_nwp.csi.toFixed(3)}</div>
        </div>
      </div>

      {/* Breakdown by Weather Regime with Sample Counts */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Regime-Stratified Severe Rain Verification (with Sample Counts)</span>
          </h3>
          <span className="text-xs text-slate-500 font-normal">Raw NWP vs MonsoonIQ AI</span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Weather Regime</th>
                <th className="py-3 px-3 text-center">Event Count</th>
                <th className="py-3 px-3 text-right">Raw NWP POD</th>
                <th className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">MonsoonIQ POD</th>
                <th className="py-3 px-3 text-right">Raw NWP FAR</th>
                <th className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">MonsoonIQ FAR</th>
                <th className="py-3 px-3 text-right">Raw NWP CSI</th>
                <th className="py-3 px-3 text-right text-sky-600 dark:text-sky-400 font-bold">MonsoonIQ CSI</th>
                <th className="py-3 px-3 text-right">MonsoonIQ ETS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {regimes && Object.entries(regimes).map(([rName, rData]) => {
                const raw = rData.raw_nwp;
                const miq = rData.monsooniq;
                const isSignificant = miq.csi > raw.csi;

                return (
                  <tr key={rName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {rName}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {rData.event_count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {(raw.pod * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {(miq.pod * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400">
                      {(raw.far * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {(miq.far * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {raw.csi.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                      {miq.csi.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {miq.ets.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
