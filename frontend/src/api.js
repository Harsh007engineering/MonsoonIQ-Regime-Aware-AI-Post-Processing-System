/**
 * MonsoonIQ API Client.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchDistrictsGeoJSON() {
  const res = await fetch(`${API_BASE}/districts/geojson`);
  return res.json();
}

export async function fetchRegime(date) {
  const q = date ? `?date=${date}` : '';
  const res = await fetch(`${API_BASE}/regime${q}`);
  return res.json();
}

export async function fetchCorrectedForecast(date, leadTime = 1, mode = 'district') {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('lead_time_days', leadTime);
  params.append('mode', mode);
  const res = await fetch(`${API_BASE}/forecast/corrected?${params.toString()}`);
  return res.json();
}

export async function fetchDistrictDetail(districtId, date, leadTime = 1) {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  params.append('lead_time_days', leadTime);
  const res = await fetch(`${API_BASE}/district/${districtId}?${params.toString()}`);
  return res.json();
}

export async function fetchVerificationSummary() {
  const res = await fetch(`${API_BASE}/verification/summary`);
  return res.json();
}

export async function fetchHeavyEventsSummary() {
  const res = await fetch(`${API_BASE}/verification/heavy-events`);
  return res.json();
}

export async function fetchCaseReplays() {
  const res = await fetch(`${API_BASE}/case-replays`);
  return res.json();
}

export async function fetchExplainability(districtId, date) {
  const res = await fetch(`${API_BASE}/explain/${districtId}/${date}`);
  return res.json();
}

export function getVerificationReportPdfUrl() {
  return `${API_BASE}/verification/report.pdf`;
}
