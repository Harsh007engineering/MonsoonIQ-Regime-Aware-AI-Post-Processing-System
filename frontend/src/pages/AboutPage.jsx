import React from 'react';
import { Info, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Database, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-slate-800 dark:text-slate-200">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                MonsoonIQ: Scientific Architecture & Methodology
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                भारत सरकार • Ministry of Earth Sciences (MoES) & India Meteorological Department (IMD)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 self-start sm:self-auto">
            SIH 2026 Finalist Prototype
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Smart India Hackathon 2026 Technical Briefing for Jury Members, Domain Experts & Operational Numerical Weather Prediction Teams.
        </p>
      </div>

      {/* 1. The Core Meteorological Problem */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-xs">1</span>
          <span>Why Standard Single-Model Bias Correction Fails over India</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Numerical Weather Prediction (NWP) model errors over the Indian subcontinent are heavily <b>regime-dependent</b>:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
          <li><b>Orographic Regime (Western Ghats & Himalayas):</b> Coarse NWP grids (0.25° ~27 km) smooth out steep mountain ridges, causing systematic 40–50% underestimation of heavy windward rainfall.</li>
          <li><b>Break Monsoon Spells:</b> The monsoon trough moves north to the Himalayan foothills, but NWP models frequently lag, continuing to predict fictitious convective precipitation across drought-prone central India.</li>
          <li><b>Monsoon Lows & Depressions:</b> Track errors of 100–200 km cause severe dipole error structures (massive false alarms on one flank, complete misses on the real torrential core).</li>
          <li><b>Coastal Convergence:</b> Narrow boundary layer land-sea breeze fronts are unresolved, producing chronic dry biases.</li>
          <li><b>Western Disturbances:</b> Subtropical westerly troughs interact with topography, creating localized cloudbursts that single global scalers wash out.</li>
        </ul>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Applying a single uniform bias correction (such as standard Quantile Mapping or global regression) over-corrects in break spells and severely under-corrects in orographic deluges.
        </p>
      </div>

      {/* 2. MonsoonIQ Regime-Aware MoE Solution */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold text-xs">2</span>
          <span>Regime-Aware Mixture-of-Experts Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100">Step 1: Regime Classification</div>
            <p className="text-slate-500 leading-relaxed">
              Physics rules identify 7 meteorologically distinct regimes (configs/regime_rules.yaml). A calibrated LightGBM model outputs soft probabilities <i>P(R<sub>k</sub>)</i> for each grid cell and district.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100">Step 2: 7 Specialized Experts</div>
            <p className="text-slate-500 leading-relaxed">
              Each regime possesses its own Empirical Quantile Mapping baseline + LightGBM residual learning expert trained strictly on days dominated by that synoptic regime.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-slate-100">Step 3: Soft Blending</div>
            <p className="text-slate-500 leading-relaxed">
              Final forecast = Σ P(R<sub>k</sub>) · Expert<sub>k</sub>. Soft probability weighting prevents sharp artificial discontinuities at regime transition boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Data Provenance & Real Adapter Support */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>Data Provenance & Operational Adapters</span>
        </h2>
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          <b>Synthetic Mode Declaration:</b> The demonstration numbers in this instance are evaluated on a seeded 8-year synthetic dataset (2016–2023) modeling IMD climatological distributions, Western Ghats topography, and known NWP structural biases. Synthetic results are never presented as real skill.
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          <b>Real Operational Mode:</b> The repository includes full, tested downloaders and adapters (<code>src/data/downloader.py</code> and <code>src/data/validator.py</code>) supporting:
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-5">
          <li>IMD 0.25° gridded daily rainfall archive</li>
          <li>NOAA GFS operational 0.25° GRIB2 forecasts (Day 1 to Day 5)</li>
          <li>ECMWF CDS ERA5 reanalysis dynamic predictors (Somali jet, vorticity, CAPE, OLR)</li>
          <li>Grid alignment, unit standardization, NaN tolerance, and continuity verification</li>
        </ul>
      </div>

      {/* 4. Limitations & Honest Caveats */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span>Scientific Limitations and Honest Caveats</span>
        </h2>
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            1. <b>Rapid Cyclogenesis:</b> In cases of rapid monsoon depression intensification over warm Bay of Bengal waters, NWP trajectory errors can shift the rain core faster than 24-hour post-processing can adjust without real-time radar ingestion.
          </p>
          <p>
            2. <b>Microscale Valley Cloudbursts:</b> While MonsoonIQ corrects broader orographic biases, localized cloudbursts (&gt;100 mm in 1 hour in a single narrow Himalayan valley) require convective-scale radar assimilations (&lt;3 km) beyond synoptic NWP bounds.
          </p>
          <p>
            3. <b>Rare Extremes Sample Size:</b> Rainfall events &gt;204.5 mm/day represent &lt;0.05% of all daily records. While isotonic calibration and scale_pos_weight stabilize predictions, operational uncertainty bounds (P90) must always accompany single deterministic values.
          </p>
        </div>
      </div>
    </div>
  );
}
