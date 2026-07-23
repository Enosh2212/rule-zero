from fastapi import APIRouter

from .engine import evaluate_action
from .models import ActionEvaluationRequest, ActionEvaluationResponse

router = APIRouter(prefix="/api/interceptor", tags=["rule-zero-evaluation"])


@router.post("/evaluate", response_model=ActionEvaluationResponse)
def evaluate(request: ActionEvaluationRequest) -> ActionEvaluationResponse:
    return evaluate_action(request)
