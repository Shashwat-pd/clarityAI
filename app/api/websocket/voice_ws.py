import base64
import json
import logging
import uuid

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.integrations.deepgram_client import DeepgramSTTClient
from app.integrations.gemini_client import GeminiClient
from app.integrations.gemini_tts_client import GeminiTTSClient
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.cognitive_engine import CognitiveEngine
from app.services.linguistic_classifier import LinguisticClassifier
from app.services.llm_service import LLMService
from app.utils.audio import pcm_to_mp3

logger = logging.getLogger(__name__)


async def voice_websocket_handler(websocket: WebSocket, session_id: str, db: AsyncSession):
    await websocket.accept()

    gemini = GeminiClient(settings.GEMINI_API_KEY)
    deepgram = DeepgramSTTClient(settings.DEEPGRAM_API_KEY)
    tts = GeminiTTSClient(settings.GEMINI_API_KEY)
    session_repo = SessionRepository(db)
    message_repo = MessageRepository(db)
    signal_repo = SignalRepository(db)
    classifier = LinguisticClassifier(gemini)
    cognitive = CognitiveEngine(signal_repo)
    llm = LLMService(gemini)

    sid = uuid.UUID(session_id)
    audio_buffer = bytearray()
    keystroke_signals = None

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            if msg_type == "audio_chunk":
                chunk = base64.b64decode(msg["data"])
                audio_buffer.extend(chunk)

            elif msg_type == "keystroke_signals":
                keystroke_signals = msg.get("data")

            elif msg_type == "end_of_speech":
                if not audio_buffer:
                    continue

                audio_bytes = bytes(audio_buffer)
                audio_buffer.clear()

                # STT
                stt_result = await deepgram.transcribe_file(audio_bytes, "audio/webm")
                transcript = stt_result["transcript"]

                await websocket.send_json({
                    "type": "transcript_final",
                    "text": transcript,
                    "confidence": stt_result["confidence"],
                })

                # Load session
                session = await session_repo.get(sid)
                history = await message_repo.get_recent(sid, limit=20)
                prior_user_messages = [item["content"] for item in history if item.get("role") == "user"]

                # Linguistic signals
                ling_signals = await classifier.classify(
                    transcript,
                    prior_user_messages=prior_user_messages,
                )

                # Clarity
                clarity_result = await cognitive.compute(
                    session_id=sid,
                    linguistic_signals=ling_signals,
                    keystroke_signals=keystroke_signals,
                    session_metadata=session.to_metadata_dict() if session else {},
                )

                crisis = CognitiveEngine.detect_crisis(transcript)

                # LLM
                await websocket.send_json({"type": "ai_text_start"})

                student_context = str(session.student_context) if session and session.student_context else ""
                ai_text = await llm.chat(
                    mode=clarity_result.mode.value,
                    history=history,
                    user_message=transcript,
                    student_context=student_context,
                    crisis=crisis,
                )

                await websocket.send_json({"type": "ai_text_chunk", "text": ai_text})
                await websocket.send_json({
                    "type": "ai_text_end",
                    "clarity_mode": clarity_result.mode.value,
                    "clarity_score": clarity_result.score,
                    "crisis_flag": crisis,
                    "indicator_scores": ling_signals.indicator_scores,
                    "explainable_signals": ling_signals.explainable_signals.model_dump(),
                })

                # TTS
                pcm_bytes = await tts.synthesise(text=ai_text, mode=clarity_result.mode.value)
                mp3_bytes = pcm_to_mp3(pcm_bytes)

                chunk_size = 16384
                for i in range(0, len(mp3_bytes), chunk_size):
                    chunk = mp3_bytes[i : i + chunk_size]
                    await websocket.send_json({
                        "type": "audio_chunk",
                        "data": base64.b64encode(chunk).decode(),
                        "sequence": i // chunk_size + 1,
                    })
                await websocket.send_json({"type": "audio_end"})

                # Persist
                await message_repo.save_turn(
                    session_id=sid,
                    user_text=transcript,
                    ai_text=ai_text,
                    input_modality="voice",
                    linguistic_signals=ling_signals.model_dump(),
                    keystroke_signals=keystroke_signals,
                    clarity_score=clarity_result.score,
                    clarity_mode=clarity_result.mode.value,
                )
                await session_repo.increment_message_count(sid)
                keystroke_signals = None

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        await websocket.close(code=1011, reason=str(e))
