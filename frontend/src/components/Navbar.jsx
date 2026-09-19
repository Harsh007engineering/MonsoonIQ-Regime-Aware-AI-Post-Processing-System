import React from 'react';
import { CloudRain, ShieldAlert, BarChart3, History, Activity, Info, Sun, Moon, Calendar, Clock } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  leadTime,
  setLeadTime,
  darkMode,
  setDarkMode,
  dominantRegime
}) {
  const tabs = [
    { id: 'dashboard', label: 'Forecast Dashboard', icon: CloudRain },
    { id: 'verification', label: 'Model Verification', icon: BarChart3 },
    { id: 'heavy-rain', label: 'Heavy Rain Skill', icon: ShieldAlert },
    { id: 'case-replay', label: 'Case Replays', icon: History },
    { id: 'monitor', label: 'Model Monitor', icon: Activity },
    { id: 'about', label: 'Methodology', icon: Info },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm transition-colors">
      {/* Top Banner with Provenance Warning */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between font-medium">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span><b>DATA PROVENANCE:</b> SYNTHETIC BENCHMARK DATASET (Seeded 8-year physics-grounded NWP error simulation over India). Not real-time operational forecasts.</span>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-slate-600 dark:text-slate-400">SIH 2024 / Advanced Atmospheric ML</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  MonsoonIQ
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Regime-Aware Monsoon AI Post-Processing</p>
            </div>
          </div>

          {/* Quick Date & Lead Time Controls */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {/* Regime status badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-700/50">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span className="text-xs font-medium text-sky-900 dark:text-sky-200">
                Regime: <b>{dominantRegime || 'Active Monsoon'}</b>
              </span>
            </div>

            {/* Date selector */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="2023-07-15">2023-07-15 (Peak Active Monsoon)</option>
                <option value="2023-08-05">2023-08-05 (Break Monsoon Spell)</option>
                <option value="2023-08-18">2023-08-18 (Bay Depression)</option>
                <option value="2022-03-24">2022-03-24 (Western Disturbance)</option>
                <option value="2022-07-22">2022-07-22 (Orographic Ghats Surge)</option>
                <option value="2023-06-25">2023-06-25 (Coastal Convergence)</option>
              </select>
            </div>

            {/* Lead time buttons */}
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700 text-xs">
              <Clock className="w-4 h-4 text-slate-400 mx-1" />
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setLeadTime(d)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    leadTime === d
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
