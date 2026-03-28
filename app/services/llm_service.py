from app.integrations.gemini_client import GeminiClient
from app.utils.prompts import build_system_prompt


class LLMService:
    def __init__(self, gemini: GeminiClient):
        self.gemini = gemini

    async def chat(
        self,
        mode: str,
        history: list[dict],
        user_message: str,
        student_context: str = "",
        crisis: bool = False,
    ) -> str:
        system_prompt = build_system_prompt(mode=mode, student_context=student_context, crisis=crisis)
        return await self.gemini.chat(
            system_prompt=system_prompt,
            history=history,
            user_message=user_message,
        )
