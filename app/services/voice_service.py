import time
import uuid

from app.integrations.deepgram_client import DeepgramSTTClient
from app.integrations.gemini_tts_client import GeminiTTSClient
from app.models.schemas.common import ExplainableSignals, LinguisticSignals
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.services.cognitive_engine import CognitiveEngine
from app.services.linguistic_classifier import LinguisticClassifier
from app.services.llm_service import LLMService
from app.utils.audio import pcm_to_mp3


class VoiceTurnResult:
    def __init__(
        self,
        transcript: str,
        ai_text: str,
        audio_bytes: bytes,
        clarity_mode: str,
        clarity_score: float,
        crisis_flag: bool,
        turn_id: str,
        processing_ms: dict,
        indicator_scores: dict[str, float],
        explainable_signals: ExplainableSignals,
    ):
        self.transcript = transcript
        self.ai_text = ai_text
        self.audio_bytes = audio_bytes
        self.clarity_mode = clarity_mode
        self.clarity_score = clarity_score
        self.crisis_flag = crisis_flag
        self.turn_id = turn_id
        self.processing_ms = processing_ms
        self.indicator_scores = indicator_scores
        self.explainable_signals = explainable_signals


class VoiceService:
    def __init__(
        self,
        deepgram: DeepgramSTTClient,
        gemini_tts: GeminiTTSClient,
        llm_service: LLMService,
        linguistic_classifier: LinguisticClassifier,
        cognitive_engine: CognitiveEngine,
        session_repo: SessionRepository,
        message_repo: MessageRepository,
    ):
        self.deepgram = deepgram
        self.gemini_tts = gemini_tts
        self.llm_service = llm_service
        self.linguistic_classifier = linguistic_classifier
        self.cognitive_engine = cognitive_engine
        self.session_repo = session_repo
        self.message_repo = message_repo

    async def process_voice_turn(
        self,
        session_id: str,
        audio_bytes: bytes,
        audio_mimetype: str,
        keystroke_signals: dict | None = None,
    ) -> VoiceTurnResult:
        total_start = time.time()
        sid = uuid.UUID(session_id)

        # 1. STT
        stt_start = time.time()
        stt_result = await self.deepgram.transcribe_file(audio_bytes, audio_mimetype)
        transcript = stt_result["transcript"]
        stt_ms = int((time.time() - stt_start) * 1000)

        # 2. Load session state + message history
        session = await self.session_repo.get(sid)
        history = await self.message_repo.get_recent(sid, limit=20)
        prior_user_messages = [item["content"] for item in history if item.get("role") == "user"]

        # 3. Linguistic signals
        linguistic_signals = await self.linguistic_classifier.classify(
            transcript,
            prior_user_messages=prior_user_messages,
        )

        # 4. Clarity score
        clarity_result = await self.cognitive_engine.compute(
            session_id=sid,
            linguistic_signals=linguistic_signals,
            keystroke_signals=keystroke_signals,
            session_metadata=session.to_metadata_dict() if session else {},
        )

        # 5. Crisis detection
        crisis = CognitiveEngine.detect_crisis(transcript)

        # 6. LLM response
        llm_start = time.time()
        student_context = ""
        if session and session.student_context:
            student_context = str(session.student_context)
        ai_text = await self.llm_service.chat(
            mode=clarity_result.mode.value,
            history=history,
            user_message=transcript,
            student_context=student_context,
            crisis=crisis,
        )
        llm_ms = int((time.time() - llm_start) * 1000)

        # 7. TTS
        tts_start = time.time()
        pcm_bytes = await self.gemini_tts.synthesise(text=ai_text, mode=clarity_result.mode.value)
        audio_out = pcm_to_mp3(pcm_bytes)
        tts_ms = int((time.time() - tts_start) * 1000)

        # 8. Persist
        user_msg, _ = await self.message_repo.save_turn(
            session_id=sid,
            user_text=transcript,
            ai_text=ai_text,
            input_modality="voice",
            linguistic_signals=linguistic_signals.model_dump(),
            keystroke_signals=keystroke_signals,
            clarity_score=clarity_result.score,
            clarity_mode=clarity_result.mode.value,
        )
        await self.session_repo.increment_message_count(sid)

        total_ms = int((time.time() - total_start) * 1000)

        return VoiceTurnResult(
            transcript=transcript,
            ai_text=ai_text,
            audio_bytes=audio_out,
            clarity_mode=clarity_result.mode.value,
            clarity_score=clarity_result.score,
            crisis_flag=crisis,
            turn_id=str(user_msg.id),
            processing_ms={"stt": stt_ms, "llm": llm_ms, "tts": tts_ms, "total": total_ms},
            indicator_scores=linguistic_signals.indicator_scores,
            explainable_signals=linguistic_signals.explainable_signals,
        )
