import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.integrations.gemini_client import GeminiClient
from app.models.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.cognitive_engine import CognitiveEngine
from app.services.linguistic_classifier import LinguisticClassifier
from app.services.llm_service import LLMService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    gemini = GeminiClient(settings.GEMINI_API_KEY)
    session_repo = SessionRepository(db)
    message_repo = MessageRepository(db)
    signal_repo = SignalRepository(db)
    classifier = LinguisticClassifier(gemini)
    cognitive = CognitiveEngine(signal_repo)
    llm = LLMService(gemini)

    sid = uuid.UUID(request.session_id)
    session = await session_repo.get(sid)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    history = await message_repo.get_recent(sid, limit=settings.MAX_SESSION_HISTORY_MESSAGES)
    prior_user_messages = [item["content"] for item in history if item.get("role") == "user"]
    linguistic_signals = await classifier.classify(request.message, prior_user_messages=prior_user_messages)

    keystroke_dict = request.keystroke_signals.model_dump() if request.keystroke_signals else None
    clarity_result = await cognitive.compute(
        session_id=sid,
        linguistic_signals=linguistic_signals,
        keystroke_signals=keystroke_dict,
        session_metadata=session.to_metadata_dict(),
    )

    crisis = CognitiveEngine.detect_crisis(request.message)
    student_context = str(session.student_context) if session.student_context else ""
    ai_text = await llm.chat(
        mode=clarity_result.mode.value,
        history=history,
        user_message=request.message,
        student_context=student_context,
        crisis=crisis,
    )

    user_msg, _ = await message_repo.save_turn(
        session_id=sid,
        user_text=request.message,
        ai_text=ai_text,
        input_modality="text",
        linguistic_signals=linguistic_signals.model_dump(),
        keystroke_signals=keystroke_dict,
        clarity_score=clarity_result.score,
        clarity_mode=clarity_result.mode.value,
    )
    await session_repo.increment_message_count(sid)

    return ChatMessageResponse(
        turn_id=str(user_msg.id),
        ai_message=ai_text,
        clarity_mode=clarity_result.mode,
        clarity_score=clarity_result.score,
        crisis_flag=crisis,
        linguistic_signals=linguistic_signals.model_dump(),
        indicator_scores=linguistic_signals.indicator_scores,
        explainable_signals=linguistic_signals.explainable_signals,
    )
