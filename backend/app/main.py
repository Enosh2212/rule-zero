from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import cors_origins
from app.contracts.routes import router as contracts_router
from app.action_gate.routes import router as action_gate_router
from app.interceptor.routes import router as interceptor_router
from app.recovery.routes import router as recovery_router
from app.audit.routes import router as audit_router
from app.worker.routes import router as worker_router

app = FastAPI(
    title="Rule Zero API",
    version="0.1.0",
    description="Pre-action safety layer for autonomous AI agents.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts_router)
app.include_router(worker_router)
app.include_router(interceptor_router)
app.include_router(action_gate_router)
app.include_router(recovery_router)
app.include_router(audit_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="rule-zero-api", version="0.1.0")
