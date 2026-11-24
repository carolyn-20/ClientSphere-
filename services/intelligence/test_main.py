from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
def test_forecast():
    r = client.post("/analytics/forecast", json={"deals":[{"amount":1000,"probability":50,"stage":"PROPOSAL"}]})
    assert r.status_code == 200
    assert r.json()["weighted_forecast"] == 500
def test_conversion_zero_denominator():
    r = client.post("/analytics/conversion", json={"created":0,"qualified":0,"won":0})
    assert r.json()["overall_win_rate"] == 0
