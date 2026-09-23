import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowUpDown, Filter, RefreshCw, FileSpreadsheet, Check, Compass } from 'lucide-react';

export default function DistrictTable({
  districts,
  selectedDistrictId,
  onSelectDistrict
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState('ALL');
  const [sortField, setSortField] = useState('monsooniq_corrected');
  const [sortAsc, setSortAsc] = useState(false);

  // Unique states for filter
  const stateOptions = useMemo(() => {
    if (!districts) return [];
    const set = new Set(districts.map((d) => d.state_name));
    return Array.from(set).sort();
  }, [districts]);

  // Filtered and sorted districts
  const filteredDistricts = useMemo(() => {
    if (!districts) return [];
    let list = districts.filter((d) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = (
        d.district_name.toLowerCase().includes(q) ||
        d.state_name.toLowerCase().includes(q) ||
        d.zone.toLowerCase().includes(q) ||
        d.dominant_regime.toLowerCase().includes(q)
      );

      const matchesState = selectedState === 'ALL' || d.state_name === selectedState;
      const matchesAlert = selectedAlert === 'ALL' || d.alert_code === selectedAlert;

      return matchesSearch && matchesState && matchesAlert;
    });

    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (typeof vA === 'string') {
        return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortAsc ? vA - vB : vB - vA;
    });

    return list;
  }, [districts, searchTerm, selectedState, selectedAlert, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportCSV = () => {
    if (!districts || districts.length === 0) return;
    const headers = [
      'District ID', 'District Name', 'State', 'Zone', 'Elevation (m)', 'Weather Regime',
      'Raw NWP (mm)', 'MonsoonIQ Corrected (mm)', 'Bias Delta (mm)', 'P10 (mm)', 'P50 (mm)', 'P90 (mm)',
      'P(Heavy >=64.5mm)', 'P(V.Heavy >=115.6mm)', 'Alert Level'
    ];
    const rows = districts.map((d) => [
      d.district_id, d.district_name, d.state_name, d.zone, d.elevation_m, d.dominant_regime,
      d.raw_nwp, d.monsooniq_corrected, d.bias_delta, d.p10, d.p50, d.p90,
      d.p_heavy, d.p_very_heavy, d.alert_code
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MonsoonIQ_National_District_Forecasts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAlertBadge = (code) => {
    const badges = {
      RED: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      ORANGE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      YELLOW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
      GREEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${badges[code] || badges.GREEN}`}>
        {code}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <span>National District Meteorological Forecast Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              {filteredDistricts.length} / {districts?.length || 0} Districts
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational 24h bias-corrected precipitation, quantile confidence intervals, and IMD early warnings
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search district, state, zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-56"
            />
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="ALL">All States ({stateOptions.length})</option>
            {stateOptions.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Alert Level Filter */}
          <select
            value={selectedAlert}
            onChange={(e) => setSelectedAlert(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
          >
            <option value="ALL">All Alerts</option>
            <option value="RED">Red Warnings</option>
            <option value="ORANGE">Orange Alerts</option>
            <option value="YELLOW">Yellow Watches</option>
            <option value="GREEN">Green (Normal)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="overflow-x-auto max-h-[460px] rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/90 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th onClick={() => handleSort('district_name')} className="py-3 px-3.5 cursor-pointer hover:text-sky-600">
                <div className="flex items-center space-x-1">
                  <span>District / State</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('zone')} className="py-3 px-3 cursor-pointer hover:text-sky-600 hidden md:table-cell">
                <div className="flex items-center space-x-1">
                  <span>Zone</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('dominant_regime')} className="py-3 px-3 cursor-pointer hover:text-sky-600">
                <div className="flex items-center space-x-1">
                  <span>Weather Regime</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('raw_nwp')} className="py-3 px-3 text-right cursor-pointer hover:text-sky-600">
                <div className="flex items-center justify-end space-x-1">
                  <span>Raw NWP</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('monsooniq_corrected')} className="py-3 px-3 text-right cursor-pointer hover:text-sky-600 text-sky-700 dark:text-sky-300">
                <div className="flex items-center justify-end space-x-1">
                  <span>MonsoonIQ AI</span>
                  <ArrowUpDown className="w-3 h-3 text-sky-500" />
                </div>
              </th>
              <th onClick={() => handleSort('bias_delta')} className="py-3 px-3 text-right cursor-pointer hover:text-sky-600">
                <div className="flex items-center justify-end space-x-1">
                  <span>Bias Δ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center hidden lg:table-cell">Uncertainty (P10 - P90)</th>
              <th onClick={() => handleSort('p_heavy')} className="py-3 px-3 text-right cursor-pointer hover:text-sky-600 hidden sm:table-cell">
                <div className="flex items-center justify-end space-x-1">
                  <span>P(≥64.5mm)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th onClick={() => handleSort('alert_code')} className="py-3 px-3.5 text-center cursor-pointer hover:text-sky-600">
                <div className="flex items-center justify-center space-x-1">
                  <span>Warning Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDistricts.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-8 text-center text-slate-500 text-xs">
                  No districts match the selected filters.
                </td>
              </tr>
            ) : (
              filteredDistricts.map((d) => {
                const isSelected = d.district_id === selectedDistrictId;
                return (
                  <tr
                    key={d.district_id}
                    onClick={() => onSelectDistrict(d.district_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50/90 dark:bg-sky-950/50 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-2.5 px-3.5">
                      <div className="text-slate-900 dark:text-slate-100 font-bold">{d.district_name}</div>
                      <div className="text-[10.5px] text-slate-400 font-normal">{d.state_name} • {Math.round(d.elevation_m || 0)}m</div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {d.zone}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10.5px]">
                        {d.dominant_regime}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {d.raw_nwp.toFixed(2)} mm
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                      {d.monsooniq_corrected.toFixed(2)} mm
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      <span className={d.bias_delta > 0 ? 'text-sky-600 dark:text-sky-400' : d.bias_delta < 0 ? 'text-rose-500' : 'text-slate-400'}>
                        {d.bias_delta > 0 ? `+${d.bias_delta.toFixed(2)}` : d.bias_delta.toFixed(2)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-[10.5px] text-slate-500 hidden lg:table-cell">
                      {d.p10} - {d.p90} mm
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono hidden sm:table-cell">
                      <span className={d.p_heavy >= 0.5 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}>
                        {(d.p_heavy * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      {getAlertBadge(d.alert_code)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
