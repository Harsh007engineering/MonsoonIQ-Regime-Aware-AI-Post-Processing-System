"""
MonsoonIQ API Endpoint Integration Tests.
Validates all FastAPI routes, HTTP status codes, JSON response schemas, and PDF binary responses.
"""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app, load_artifacts


@pytest.fixture(scope="module")
def client():
    load_artifacts()
    return TestClient(app)


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True
    assert data["total_districts"] > 0


def test_districts_endpoint(client):
    res = client.get("/districts")
    assert res.status_code == 200
    data = res.json()
    assert "districts" in data
    assert data["total"] > 0


def test_regime_endpoint(client):
    res = client.get("/regime?date=2023-07-15")
    assert res.status_code == 200
    data = res.json()
    assert "dominant_regime" in data
    assert "soft_probabilities" in data


def test_corrected_forecast_endpoint(client):
    res = client.get("/forecast/corrected?date=2023-07-15&lead_time_days=1&mode=district")
    assert res.status_code == 200
    data = res.json()
    assert "districts" in data
    assert len(data["districts"]) > 0
    first = data["districts"][0]
    assert "raw_nwp" in first
    assert "monsooniq_corrected" in first
    assert "p10" in first and "p50" in first and "p90" in first


def test_heavy_probability_endpoint(client):
    res = client.get("/forecast/heavy-probability?date=2023-07-15&lead_time_days=1")
    assert res.status_code == 200
    data = res.json()
    assert "district_probabilities" in data
    assert len(data["district_probabilities"]) > 0


def test_single_district_detail_endpoint(client):
    res = client.get("/district/MH_MUM?date=2023-07-15&lead_time_days=1")
    assert res.status_code == 200
    data = res.json()
    assert data["district_id"] == "MH_MUM"
    assert "advisory" in data
    assert "english" in data["advisory"]
    assert "hindi" in data["advisory"]
    assert "cap_alert" in data


def test_verification_endpoints(client):
    res_sum = client.get("/verification/summary")
    assert res_sum.status_code == 200
    assert "continuous_metrics" in res_sum.json()

    res_h = client.get("/verification/heavy-events")
    assert res_h.status_code == 200
    assert "heavy_64_5" in res_h.json()


def test_verification_pdf_endpoint(client):
    res = client.get("/verification/report.pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 10000


def test_case_replays_endpoint(client):
    res = client.get("/case-replays")
    assert res.status_code == 200
    assert len(res.json()["cases"]) >= 3


def test_explain_endpoint(client):
    res = client.get("/explain/MH_MUM/2023-07-15")
    assert res.status_code == 200
    data = res.json()
    assert "top_feature_attributions" in data
