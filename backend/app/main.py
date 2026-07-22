from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.contracts.routes import router as contracts_router
from app.worker.routes import router as worker_router

app = FastAPI(
    title="Rule Zero API",
    version="0.1.0",
    description="Pre-action safety layer for autonomous AI agents.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts_router)
app.include_router(worker_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="rule-zero-api", version="0.1.0")
