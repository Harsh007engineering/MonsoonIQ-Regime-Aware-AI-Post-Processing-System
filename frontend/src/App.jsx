import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import VerificationPage from './pages/VerificationPage';
import HeavyRainSkillPage from './pages/HeavyRainSkillPage';
import CaseReplayPage from './pages/CaseReplayPage';
import ModelMonitorPage from './pages/ModelMonitorPage';
import AboutPage from './pages/AboutPage';
import { fetchRegime } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState('2023-07-15');
  const [leadTime, setLeadTime] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [dominantRegime, setDominantRegime] = useState('Active Monsoon');

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch dominant regime when selectedDate changes
  useEffect(() => {
    fetchRegime(selectedDate)
      .then((data) => {
        if (data && data.dominant_regime) {
          setDominantRegime(data.dominant_regime);
        }
      })
      .catch((err) => console.error('Failed to fetch regime:', err));
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        leadTime={leadTime}
        setLeadTime={setLeadTime}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        dominantRegime={dominantRegime}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard selectedDate={selectedDate} leadTime={leadTime} />
        )}
        {activeTab === 'verification' && (
          <VerificationPage />
        )}
        {activeTab === 'heavy-rain' && (
          <HeavyRainSkillPage />
        )}
        {activeTab === 'case-replay' && (
          <CaseReplayPage />
        )}
        {activeTab === 'monitor' && (
          <ModelMonitorPage />
        )}
        {activeTab === 'about' && (
          <AboutPage />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600 dark:text-slate-400">
            MonsoonIQ © 2026 | Smart India Hackathon 2026 (SIH-2026) • Ministry of Earth Sciences (MoES) & India Meteorological Department
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Regime Mixture of Experts (MoE) • LightGBM • Isotonic Calibrated Exceedance
          </span>
        </div>
      </footer>
    </div>
  );
}
