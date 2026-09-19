import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowUpDown, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function DistrictTable({
  districts,
  selectedDistrictId,
  onSelectDistrict
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('monsooniq_corrected');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredDistricts = useMemo(() => {
    if (!districts) return [];
    let list = districts.filter((d) => {
      const q = searchTerm.toLowerCase();
      return (
        d.district_name.toLowerCase().includes(q) ||
        d.state_name.toLowerCase().includes(q) ||
        d.zone.toLowerCase().includes(q) ||
        d.dominant_regime.toLowerCase().includes(q)
      );
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
  }, [districts, searchTerm, sortField, sortAsc]);

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
    link.setAttribute('download', `MonsoonIQ_District_Forecasts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAlertBadge = (code) => {
    const badges = {
      RED: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      ORANGE: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      YELLOW: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      GREEN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${badges[code] || badges.GREEN}`}>
        {code}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            All India District Forecast Matrix ({filteredDistricts.length} Districts)
          </h3>
          <p className="text-xs text-slate-500">Sorted by corrected precipitation and risk severity</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search district, state, zone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 w-56"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[420px] rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('district_name')}>
                <div className="flex items-center space-x-1">
                  <span>District & State</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('dominant_regime')}>
                <div className="flex items-center space-x-1">
                  <span>Regime</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('raw_nwp')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Raw NWP</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('monsooniq_corrected')}>
                <div className="flex items-center justify-end space-x-1 text-sky-600 dark:text-sky-400">
                  <span>MonsoonIQ AI</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('bias_delta')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>Δ Delta</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('p90')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>P90 Max</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer" onClick={() => handleSort('p_heavy')}>
                <div className="flex items-center justify-end space-x-1">
                  <span>P(≥64.5mm)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">IMD Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDistricts.map((d) => {
              const isSelected = d.district_id === selectedDistrictId;
              return (
                <tr
                  key={d.district_id}
                  onClick={() => onSelectDistrict(d.district_id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="py-2 px-3">
                    <div className="text-slate-900 dark:text-slate-100">{d.district_name}</div>
                    <div className="text-[10px] text-slate-400">{d.state_name} • {d.zone}</div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10.5px] text-slate-700 dark:text-slate-300">
                      {d.dominant_regime}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400 font-mono">
                    {d.raw_nwp.toFixed(1)} mm
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                    {d.monsooniq_corrected.toFixed(1)} mm
                  </td>
                  <td className={`py-2 px-3 text-right font-mono text-[11px] ${d.bias_delta > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}`}>
                    {d.bias_delta > 0 ? `+${d.bias_delta.toFixed(1)}` : d.bias_delta.toFixed(1)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    {d.p90.toFixed(1)} mm
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">
                    <span style={{ color: d.p_heavy > 0.4 ? '#f59e0b' : (d.p_heavy > 0.7 ? '#ef4444' : '#10b981') }}>
                      {(d.p_heavy * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {getAlertBadge(d.alert_code)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
