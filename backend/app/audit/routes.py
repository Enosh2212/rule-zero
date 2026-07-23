from fastapi import APIRouter, HTTPException

from .models import (
    AuditAppendRequest, AuditAppendResponse, AuditExportRequest, AuditExportResponse,
    AuditSessionStartRequest, AuditSessionStartResponse, AuditVerificationRequest,
    AuditVerificationResponse,
)
from .service import AuditValidationError, append_artifact, export_session, start_session, verify_session

router = APIRouter(tags=["audit-and-replay"])


@router.post("/api/audit/start", response_model=AuditSessionStartResponse)
def start(request: AuditSessionStartRequest) -> AuditSessionStartResponse:
    try:
        return AuditSessionStartResponse(session=start_session(request))
    except AuditValidationError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/api/audit/append", response_model=AuditAppendResponse)
def append(request: AuditAppendRequest) -> AuditAppendResponse:
    try:
        session, event = append_artifact(request)
        return AuditAppendResponse(session=session, appended_event=event)
    except AuditValidationError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.post("/api/audit/verify", response_model=AuditVerificationResponse)
def verify(request: AuditVerificationRequest) -> AuditVerificationResponse:
    return verify_session(request.session)


@router.post("/api/audit/export", response_model=AuditExportResponse)
def export(request: AuditExportRequest) -> AuditExportResponse:
    return export_session(request)
