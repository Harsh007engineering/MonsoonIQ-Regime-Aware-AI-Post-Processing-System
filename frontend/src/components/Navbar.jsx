import React from 'react';
import {
  CloudRain, ShieldAlert, BarChart3, History, Activity, Info,
  Sun, Moon, Calendar, Clock, Sparkles, Radio, CheckCircle, Shield
} from 'lucide-react';

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
    { id: 'dashboard', label: 'Operational Forecast', shortLabel: 'Forecast', icon: CloudRain },
    { id: 'verification', label: 'WMO / IMD Verification', shortLabel: 'Verification', icon: BarChart3 },
    { id: 'heavy-rain', label: 'Severe Rain Skill', shortLabel: 'Severe Skill', icon: ShieldAlert },
    { id: 'case-replay', label: 'Forensic Replays', shortLabel: 'Replays', icon: History },
    { id: 'monitor', label: 'MLOps Health & Drift', shortLabel: 'MLOps', icon: Activity },
    { id: 'about', label: 'Scientific Whitepaper', shortLabel: 'Whitepaper', icon: Info },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors">
      {/* Tricolor National Accent Header Bar */}
      <div className="india-tricolor-bar"></div>

      {/* Official Government & Mission Context Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-medium text-slate-200">
            <span className="font-semibold text-amber-400">भारत सरकार</span>
            <span className="text-slate-500">|</span>
            <span>Government of India</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 hidden sm:inline">Ministry of Earth Sciences (MoES)</span>
          </div>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-400">India Meteorological Department (IMD)</span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SIH 2026 OPERATIONAL BENCHMARK</span>
          </div>
          <span className="hidden sm:inline text-slate-400 font-medium">Smart India Hackathon 2026</span>
        </div>
      </div>

      {/* Main Command & Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Identity & Logo */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <CloudRain className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                  Monsoon<span className="text-sky-600 dark:text-sky-400">IQ</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  SIH 2026
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  Regime-MoE v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                National Regime-Aware Atmospheric AI Post-Processing & Severe Weather Decision Support System
              </p>
            </div>
          </div>

          {/* Operational Controls: Regime, Date, Lead Time, Theme */}
          <div className="flex items-center space-x-2.5">
            {/* Synoptic Regime Chip */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
              <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-500 text-[10px] uppercase font-semibold block leading-none">Synoptic State</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {dominantRegime || 'Active Monsoon'}
                </span>
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
                title="Select Monsoon Date"
              >
                <option value="2023-07-15">15 Jul 2023 (Peak Active Monsoon)</option>
                <option value="2023-08-05">05 Aug 2023 (Break Monsoon Spell)</option>
                <option value="2023-08-18">18 Aug 2023 (Monsoon Depression)</option>
                <option value="2022-07-22">22 Jul 2022 (Orographic Ghats Surge)</option>
                <option value="2023-06-25">25 Jun 2023 (Coastal Convergence)</option>
                <option value="2022-03-24">24 Mar 2022 (Western Disturbance)</option>
              </select>
            </div>

            {/* Lead Time Selector (Day 1 - Day 5) */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Lead</span>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => setLeadTime(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      leadTime === d
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    D{d}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700/80"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Primary Mission Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/80 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
