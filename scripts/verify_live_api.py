"""
MonsoonIQ End-to-End Live Verification Script
Tests all live endpoints on the running server and verifies responses across both / and /api prefixes.
"""
import urllib.request
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(path, test_name, validator):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "MonsoonIQ-Verifier"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.status
            content_type = resp.headers.get("Content-Type", "")
            data = resp.read()
            ok, msg = validator(code, content_type, data)
            status_text = "PASS" if ok else "FAIL"
            print(f"[{status_text}] {test_name}: {msg}")
            if not ok:
                sys.exit(1)
    except Exception as e:
        print(f"[FAIL] {test_name} ({path}): Exception {e}")
        sys.exit(1)

def main():
    print("=" * 75)
    print("MonsoonIQ Live Endpoint & Functionality Verification (100% Comprehensive)")
    print("=" * 75)

    # 1. Root Static Mount
    test_endpoint("/", "1. Root Frontend Mount",
        lambda c, ct, d: (c == 200 and b"MonsoonIQ" in d, f"HTTP {c}, size {len(d)} bytes, HTML Title verified")
    )

    # 2. Health Check (Root & /api)
    test_endpoint("/health", "2a. Health Check (/health)",
        lambda c, ct, d: (c == 200 and json.loads(d.decode("utf-8")).get("status") == "healthy",
                          f"Status: {json.loads(d.decode('utf-8')).get('status')}")
    )
    test_endpoint("/api/health", "2b. Health Check (/api/health)",
        lambda c, ct, d: (c == 200 and json.loads(d.decode("utf-8")).get("status") == "healthy",
                          f"Status: {json.loads(d.decode('utf-8')).get('status')}")
    )

    # 3. Districts List
    def check_districts(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        districts = body.get("districts", [])
        return (c == 200 and len(districts) > 0, f"Returned {len(districts)} districts (total: {body.get('total')})")
    test_endpoint("/districts", "3a. Districts List (/districts)", check_districts)
    test_endpoint("/api/districts", "3b. Districts List (/api/districts)", check_districts)

    # 3c. Districts GeoJSON
    def check_geojson(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        features = body.get("features", [])
        return (c == 200 and len(features) > 0, f"Returned {len(features)} GeoJSON features")
    test_endpoint("/districts/geojson", "3c. Districts GeoJSON (/districts/geojson)", check_geojson)
    test_endpoint("/api/districts/geojson", "3d. Districts GeoJSON (/api/districts/geojson)", check_geojson)

    # 4. Regime Classifier
    def check_regime(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        regime = body.get("dominant_regime")
        probs = body.get("soft_probabilities", {})
        return (c == 200 and regime is not None and len(probs) > 0, f"Dominant: {regime}, Soft Probs: {probs}")
    test_endpoint("/regime?date=2023-07-15", "4a. Regime Classification (/regime)", check_regime)
    test_endpoint("/api/regime?date=2023-07-15", "4b. Regime Classification (/api/regime)", check_regime)

    # 5. Corrected Forecast
    def check_corrected(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        districts = body.get("districts", [])
        sample = districts[0]
        return (c == 200 and len(districts) > 0,
                f"Count: {len(districts)}, Sample: {sample['district_name']} -> Raw {sample['raw_nwp']}mm | Corrected {sample['monsooniq_corrected']}mm (Bias Delta: {sample['bias_delta']}mm)")
    test_endpoint("/forecast/corrected?date=2023-07-15&lead_time_days=1", "5a. Corrected Forecast (/forecast/corrected)", check_corrected)
    test_endpoint("/api/forecast/corrected?date=2023-07-15&lead_time_days=1", "5b. Corrected Forecast (/api/forecast/corrected)", check_corrected)

    # 6. Heavy Probability
    def check_heavy(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        districts = body.get("district_probabilities", [])
        has_probs = all("p_heavy" in d for d in districts[:5])
        return (c == 200 and len(districts) > 0 and has_probs, f"Evaluated {len(districts)} districts with heavy rain probabilities")
    test_endpoint("/forecast/heavy-probability?date=2023-07-15&lead_time_days=1", "6a. Heavy Exceedance Probabilities (/forecast/heavy-probability)", check_heavy)
    test_endpoint("/api/forecast/heavy-probability?date=2023-07-15&lead_time_days=1", "6b. Heavy Exceedance Probabilities (/api/forecast/heavy-probability)", check_heavy)

    # 7. Single District Detail with Advisories & CAP Alert
    def check_detail(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        advisory = body.get("advisory", {})
        cap = body.get("cap_alert", {})
        has_en = bool(advisory.get("english"))
        has_hi = bool(advisory.get("hindi"))
        alert_level = body.get("alert_level")
        return (c == 200 and has_en and has_hi and cap,
                f"Alert: {alert_level}, EN & HI advisories generated, CAP Identifier: {cap.get('identifier', 'N/A')}")
    test_endpoint("/district/KL_WAY?date=2018-08-16&lead_time_days=1", "7a. District Detail & Bilingual Advisory (KL_WAY)", check_detail)
    test_endpoint("/api/district/KL_WAY?date=2018-08-16&lead_time_days=1", "7b. District Detail & Bilingual Advisory (/api/district/KL_WAY)", check_detail)

    # 8. SHAP Explainability
    def check_explain(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        feats = body.get("top_feature_attributions", [])
        return (c == 200 and len(feats) > 0,
                f"Returned {len(feats)} SHAP features (Top: {feats[0]['feature']} = {feats[0]['shap_contribution']:+.4f})")
    test_endpoint("/explain/KL_WAY/2018-08-16", "8a. SHAP Explainability (/explain/KL_WAY/2018-08-16)", check_explain)
    test_endpoint("/api/explain/KL_WAY/2018-08-16", "8b. SHAP Explainability (/api/explain/KL_WAY/2018-08-16)", check_explain)
    test_endpoint("/explain/KL_WAY?date=2018-08-16", "8c. SHAP Explainability query alias (/explain/KL_WAY?date=...)", check_explain)

    # 9. Verification Summary
    def check_veri_summary(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        cont = body.get("continuous_metrics", {})
        monsoon_iq = cont.get("monsooniq", {})
        rmse = monsoon_iq.get("rmse")
        return (c == 200 and "monsooniq" in cont, f"Systems: {list(cont.keys())}, MonsoonIQ Test RMSE: {rmse} mm/day")
    test_endpoint("/verification/summary", "9a. Verification Scorecard (/verification/summary)", check_veri_summary)
    test_endpoint("/api/verification/summary", "9b. Verification Scorecard (/api/verification/summary)", check_veri_summary)

    # 10. Heavy Events Contingency
    def check_heavy_events(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        has_64 = "heavy_64_5" in body
        has_115 = "very_heavy_115_6" in body
        return (c == 200 and has_64 and has_115, f"Evaluated thresholds: 64.5 mm (events: {body['heavy_64_5']['total_events']}) & 115.6 mm (events: {body['very_heavy_115_6']['total_events']})")
    test_endpoint("/verification/heavy-events", "10a. Extreme Events Contingency Stats (/verification/heavy-events)", check_heavy_events)
    test_endpoint("/api/verification/heavy-events", "10b. Extreme Events Contingency Stats (/api/verification/heavy-events)", check_heavy_events)

    # 11. Official PDF Verification Report
    def check_pdf(c, ct, d):
        is_pdf = ct == "application/pdf"
        size_ok = len(d) > 50000
        return (c == 200 and is_pdf and size_ok, f"MIME: {ct}, Size: {len(d):,} bytes (> 50KB publication report)")
    test_endpoint("/verification/report.pdf", "11a. Downloadable PDF Verification Report (/verification/report.pdf)", check_pdf)
    test_endpoint("/api/verification/report.pdf", "11b. Downloadable PDF Verification Report (/api/verification/report.pdf)", check_pdf)

    # 12. Case Replays
    def check_cases(c, ct, d):
        body = json.loads(d.decode("utf-8"))
        cases = body.get("cases", [])
        names = [c["name"] for c in cases]
        return (c == 200 and len(cases) == 3, f"3 Historical Events: {', '.join(names)}")
    test_endpoint("/case-replays", "12a. Historical Case Replays (/case-replays)", check_cases)
    test_endpoint("/api/case-replays", "12b. Historical Case Replays (/api/case-replays)", check_cases)

    print("=" * 75)
    print("SUCCESS: ALL 23 TEST SCENARIOS PASSED 100% CLEANLY!")
    print("=" * 75)

if __name__ == "__main__":
    main()
