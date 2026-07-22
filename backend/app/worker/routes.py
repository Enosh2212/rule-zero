from fastapi import APIRouter, HTTPException, status

from .models import WorkerStepRequest, WorkerStepResponse
from .sequence import ACTION_BUILDERS, SCENARIO_ID, propose_worker_step

router = APIRouter(prefix="/api/worker", tags=["worker-proposals"])


@router.post("/propose", response_model=WorkerStepResponse)
def propose_action(request: WorkerStepRequest) -> WorkerStepResponse:
    if request.scenario_id != SCENARIO_ID:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unsupported scenario_id: {request.scenario_id}",
        )
    if request.step_index >= len(ACTION_BUILDERS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"step_index must be between 0 and {len(ACTION_BUILDERS) - 1}",
        )
    return propose_worker_step(request.step_index, request.observation)
