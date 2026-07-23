from fastapi import APIRouter

from .models import ActionExecutionRequest, ActionExecutionResponse, ApprovalDecisionRequest, CanonicalScenarioSnapshot
from .scenario import snapshot
from .service import decide_approval, execute_action

router = APIRouter(tags=["safe-action-gate"])


@router.get("/api/scenarios/shopping-trap/state", response_model=CanonicalScenarioSnapshot)
def get_state() -> CanonicalScenarioSnapshot:
    return snapshot()


@router.post("/api/actions/execute", response_model=ActionExecutionResponse)
def execute(request: ActionExecutionRequest) -> ActionExecutionResponse:
    return execute_action(request)


@router.post("/api/approvals/decide", response_model=ActionExecutionResponse)
def approve(request: ApprovalDecisionRequest) -> ActionExecutionResponse:
    return decide_approval(request)
