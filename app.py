import os
import logging
import gradio as gr

from api.audio import STTManager, TTSManager
from api.llm import LLMManager
from utils.config import Config
from resources.prompts import prompts
from ui.coding import get_problem_solving_ui
from ui.instructions import get_instructions_ui
from utils.params import default_audio_params


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


def initialize_services():
    """
    Initialize configuration, LLM, TTS, and STT services.

    Returns:
        tuple: Containing Config, LLMManager, TTSManager, and STTManager instances.
    """
    logging.getLogger(__name__).info("Initializing services")
    config = Config()
    llm = LLMManager(config, prompts)
    tts = TTSManager(config)
    stt = STTManager(config)
    logging.getLogger(__name__).info(
        "Services initialized: llm_status=%s tts_status=%s stt_status=%s",
        llm.status,
        tts.status,
        stt.status,
    )

    # Keep audio input in one-shot recording mode; streaming caused unstable temp-file handling.
    default_audio_params["streaming"] = False

    # Disable TTS in silent mode
    if os.getenv("SILENT", False):
        tts.read_last_message = lambda x: None

    return config, llm, tts, stt


def create_interface(llm, tts, stt, audio_params):
    """
    Create and configure the Gradio interface.

    Args:
        llm (LLMManager): Language model manager instance.
        tts (TTSManager): Text-to-speech manager instance.
        stt (STTManager): Speech-to-text manager instance.
        audio_params (dict): Audio parameters for the interface.

    Returns:
        gr.Blocks: Configured Gradio interface.
    """
    logging.getLogger(__name__).info("Creating Gradio interface")
    with gr.Blocks(title="AI Interviewer", theme=gr.themes.Default()) as demo:
        # Create audio output component (visible only in debug mode)
        audio_output = gr.Audio(
            label="Play audio",
            autoplay=True,
            visible=bool(os.environ.get("DEBUG", False)),
            streaming=False,
            value=None,
        )

        # Render problem-solving and instructions UI components
        get_problem_solving_ui(llm, tts, stt, audio_params, audio_output).render()
        get_instructions_ui(llm, tts, stt, audio_params).render()

    return demo


def main():
    """
    Main function to initialize services and launch the Gradio interface.
    """
    logging.getLogger(__name__).info("Starting application")
    config, llm, tts, stt = initialize_services()
    demo = create_interface(llm, tts, stt, default_audio_params)

    # Launch the Gradio interface
    logging.getLogger(__name__).info("Launching Gradio app")
    demo.launch(show_api=False)


if __name__ == "__main__":
    main()
