import React, { useState, useEffect } from 'react';
import { fetchCaseReplays, fetchCorrectedForecast } from '../api';
import { Play, Pause, SkipForward, AlertCircle, History, CloudRain, ShieldCheck, MapPin } from 'lucide-react';

export default function CaseReplayPage() {
  const [casesData, setCasesData] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState('kerala_2018');
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCaseReplays()
      .then((data) => {
        setCasesData(data.cases || []);
      })
      .catch((err) => console.error('Failed to load case replays:', err));
  }, []);

  const activeCase = casesData.find((c) => c.id === activeCaseId) || casesData[0];
  const currentDate = activeCase ? activeCase.dates[currentDateIndex] : '2018-08-15';

  useEffect(() => {
    if (!currentDate) return;
    setLoading(true);
    fetchCorrectedForecast(currentDate, 1, 'district')
      .then((data) => {
        setForecastData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load case forecast:', err);
        setLoading(false);
      });
  }, [currentDate]);

  const filteredDistricts = React.useMemo(() => {
    if (!forecastData?.districts || !activeCase) return [];
    return forecastData.districts.filter((d) => activeCase.key_districts.includes(d.district_id));
  }, [forecastData, activeCase]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Provenance Warning */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Historical Extreme Event Case Replays
              </h1>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-semibold">
                Simulated Replay
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Side-by-side comparison of Raw NWP vs MonsoonIQ AI vs Observational Ground Truth across notorious monsoon disasters.
            </p>
          </div>

          {/* Event Switcher */}
          <div className="flex items-center space-x-2">
            {casesData.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseId(c.id);
                  setCurrentDateIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCaseId === c.id
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {activeCase && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">{activeCase.name}</span>: {activeCase.description}
            </div>
            <div className="text-slate-400 font-mono text-[11px] shrink-0 ml-4">
              Regime: <b>{activeCase.regime}</b>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Time Slider */}
      {activeCase && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            Timeline Step:
          </span>

          <div className="flex items-center space-x-2 flex-1">
            {activeCase.dates.map((d, idx) => (
              <button
                key={d}
                onClick={() => setCurrentDateIndex(idx)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
                  currentDateIndex === idx
                    ? 'bg-sky-600 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Focus Districts Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredDistricts.map((d) => {
          const rawErr = Math.abs(d.raw_nwp - d.observed_rain);
          const miqErr = Math.abs(d.monsooniq_corrected - d.observed_rain);
          const improved = miqErr < rawErr;

          return (
            <div
              key={d.district_id}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{d.district_name}</div>
                  <div className="text-[10.5px] text-slate-400">{d.state_name} • {d.dominant_regime}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.alert_code === 'RED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                  d.alert_code === 'ORANGE' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {d.alert_code}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-500">Raw NWP:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{d.raw_nwp} mm</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                  <span className="text-sky-700 dark:text-sky-300 font-medium">MonsoonIQ:</span>
                  <span className="font-mono font-bold text-sky-700 dark:text-sky-300">{d.monsooniq_corrected} mm</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">Observed Rain:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{d.observed_rain} mm</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-500">
                <span>P(Heavy ≥64.5mm): <b>{(d.p_heavy * 100).toFixed(0)}%</b></span>
                {improved && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Error reduced</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
