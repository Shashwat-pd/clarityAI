import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.integrations.gemini_client import GeminiClient
from app.models.db.brief import Brief
from app.models.schemas.brief import BriefGenerateRequest, BriefResponse
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.brief_service import BriefService
from app.services.docx_service import DOCXService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/briefs", tags=["briefs"])


@router.post("/generate", response_model=BriefResponse)
async def generate_brief(
    request: BriefGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    gemini = GeminiClient(settings.GEMINI_API_KEY)
    service = BriefService(
        gemini=gemini,
        session_repo=SessionRepository(db),
        message_repo=MessageRepository(db),
        signal_repo=SignalRepository(db),
        db=db,
    )

    brief = await service.generate(
        student_id=request.student_id,
        session_ids=request.session_ids,
        days_back=request.days_back or settings.DEFAULT_BRIEF_DAYS_BACK,
    )

    return BriefResponse(
        brief_id=str(brief.id),
        student_id=str(brief.student_id),
        generated_at=brief.generated_at,
        period_start=brief.period_start,
        period_end=brief.period_end,
        session_count=brief.session_count or 0,
        sections=brief.content,
        crisis_flagged=brief.crisis_flagged,
    )


@router.get("/{brief_id}/pdf")
async def get_brief_pdf(
    brief_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Brief).where(Brief.id == uuid.UUID(brief_id)))
    brief = result.scalar_one_or_none()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if brief.pdf_bytes:
        pdf = brief.pdf_bytes
    else:
        pdf_service = PDFService()
        pdf = pdf_service.render(brief)
        brief.pdf_bytes = pdf
        await db.commit()

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"clarityai-brief-{brief.generated_at.strftime('%Y-%m-%d')}.pdf\""},
    )


@router.get("/{brief_id}/preview", response_model=BriefResponse)
async def preview_brief(
    brief_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Brief).where(Brief.id == uuid.UUID(brief_id)))
    brief = result.scalar_one_or_none()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    return BriefResponse(
        brief_id=str(brief.id),
        student_id=str(brief.student_id),
        generated_at=brief.generated_at,
        period_start=brief.period_start,
        period_end=brief.period_end,
        session_count=brief.session_count or 0,
        sections=brief.content,
        crisis_flagged=brief.crisis_flagged,
    )


@router.get("/{brief_id}/export")
async def export_brief_docx(
    brief_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Brief).where(Brief.id == uuid.UUID(brief_id)))
    brief = result.scalar_one_or_none()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    docx_service = DOCXService()
    docx_bytes = docx_service.render(brief)

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="counselor_brief.docx"'},
    )
