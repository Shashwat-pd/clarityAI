from deepgram import DeepgramClient, PrerecordedOptions


class DeepgramSTTClient:
    def __init__(self, api_key: str):
        self.client = DeepgramClient(api_key)

    async def transcribe_file(self, audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language="en-US",
            punctuate=True,
            utterances=False,
        )
        source = {"buffer": audio_bytes, "mimetype": mimetype}
        response = await self.client.listen.asyncrest.v("1").transcribe_file(source, options)
        channel = response.results.channels[0]
        alternative = channel.alternatives[0]
        return {
            "transcript": alternative.transcript,
            "confidence": alternative.confidence,
            "duration": response.metadata.duration if hasattr(response, 'metadata') else None,
        }
