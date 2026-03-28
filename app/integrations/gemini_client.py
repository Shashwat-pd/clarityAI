import asyncio
import logging

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY = 4


class GeminiClient:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.0-flash"

    async def _request_with_retry(self, func, *args, **kwargs):
        for attempt in range(MAX_RETRIES):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    delay = RETRY_DELAY * (attempt + 1)
                    logger.warning(f"Rate limited, retrying in {delay}s (attempt {attempt + 1}/{MAX_RETRIES})")
                    await asyncio.sleep(delay)
                else:
                    raise
        return await func(*args, **kwargs)

    async def chat(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
    ) -> str:
        contents = []

        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

        contents.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

        response = await self._request_with_retry(
            self.client.aio.models.generate_content,
            model=self.model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=512,
                temperature=0.7,
            ),
        )
        return response.text

    async def classify(self, prompt: str) -> str:
        response = await self._request_with_retry(
            self.client.aio.models.generate_content,
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=256,
                temperature=0.1,
            ),
        )
        return response.text
