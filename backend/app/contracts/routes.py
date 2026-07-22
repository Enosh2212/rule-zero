from fastapi import APIRouter

from .models import ContractParseRequest, ContractParseResponse
from .parser import parse_task_contract

router = APIRouter(prefix="/api/contracts", tags=["task-contracts"])


@router.post("/parse", response_model=ContractParseResponse)
def parse_contract(request: ContractParseRequest) -> ContractParseResponse:
    return ContractParseResponse(
        scenario_id=request.scenario_id,
        contract=parse_task_contract(request.instruction),
    )
