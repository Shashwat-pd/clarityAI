from google import genai
from google.genai import types


VOICE_BY_MODE = {
    "grounding": {"voice_name": "Aoede", "style_hint": "Speak very slowly, softly, and warmly. Be calm and unhurried."},
    "structuring": {"voice_name": "Aoede", "style_hint": "Speak gently and clearly, at a measured pace."},
    "guidance": {"voice_name": "Charon", "style_hint": "Speak clearly and confidently, at a natural conversational pace."},
}


class GeminiTTSClient:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    async def synthesise(self, text: str, mode: str = "guidance") -> bytes:
        voice_config = VOICE_BY_MODE.get(mode, VOICE_BY_MODE["guidance"])
        styled_text = f"[{voice_config['style_hint']}] {text}"

        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=styled_text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_config["voice_name"],
                        )
                    )
                ),
            ),
        )
        return response.candidates[0].content.parts[0].inline_data.data
