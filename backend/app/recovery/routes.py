from fastapi import APIRouter, HTTPException

from .models import (
    RecoveryExecutionRequest,
    RecoveryExecutionResponse,
    RecoveryPlanRequest,
    RecoveryPlanResponse,
)
from .service import RecoveryValidationError, execute_recovery_step, plan_recovery

router = APIRouter(tags=["safe-recovery"])


@router.post("/api/recovery/plan", response_model=RecoveryPlanResponse)
def create_plan(request: RecoveryPlanRequest) -> RecoveryPlanResponse:
    try:
        return RecoveryPlanResponse(recovery_plan=plan_recovery(request))
    except RecoveryValidationError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/api/recovery/execute-step", response_model=RecoveryExecutionResponse)
def execute_step(request: RecoveryExecutionRequest) -> RecoveryExecutionResponse:
    try:
        return execute_recovery_step(request)
    except RecoveryValidationError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
