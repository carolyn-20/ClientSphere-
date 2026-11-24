from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List

app = FastAPI(title="ClientSphere Sales Intelligence", version="1.0.0")

class Deal(BaseModel):
    amount: float = Field(ge=0)
    probability: int = Field(ge=0, le=100)
    stage: str

class ForecastRequest(BaseModel):
    deals: List[Deal]

@app.get("/health")
def health():
    return {"status": "ok", "service": "sales-intelligence"}

@app.post("/analytics/forecast")
def forecast(payload: ForecastRequest):
    pipeline = sum(d.amount for d in payload.deals if d.stage not in ("WON", "LOST"))
    weighted = sum(d.amount * d.probability / 100 for d in payload.deals if d.stage not in ("WON", "LOST"))
    won = sum(d.amount for d in payload.deals if d.stage == "WON")
    return {"pipeline_value": round(pipeline, 2), "weighted_forecast": round(weighted, 2), "won_value": round(won, 2), "deal_count": len(payload.deals)}

class FunnelRequest(BaseModel):
    created: int = Field(ge=0)
    qualified: int = Field(ge=0)
    won: int = Field(ge=0)

@app.post("/analytics/conversion")
def conversion(payload: FunnelRequest):
    if payload.qualified > payload.created or payload.won > payload.qualified:
        return {"error": "Funnel counts must satisfy created >= qualified >= won"}
    return {"qualification_rate": round(payload.qualified / payload.created * 100, 2) if payload.created else 0,
            "win_rate_from_qualified": round(payload.won / payload.qualified * 100, 2) if payload.qualified else 0,
            "overall_win_rate": round(payload.won / payload.created * 100, 2) if payload.created else 0}
