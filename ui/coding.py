import gradio as gr
import logging
import numpy as np
import os
import time
from itertools import chain
from typing import List, Dict, Generator, Optional, Tuple, Any
from functools import partial

from resources.data import fixed_messages, topic_lists, interview_types
from utils.ui import add_candidate_message, add_interviewer_message
from api.llm import LLMManager
from api.audio import TTSManager, STTManager

DEMO_MESSAGE: str = """<span style="color: red;"> 
This service is running in demo mode with limited performance (e.g. slow voice recognition). For a better experience, run the service locally, refer to the Instruction tab for more details.
</span>"""

logger = logging.getLogger(__name__)


def send_request(
    code: str,
    previous_code: str,
    chat_history: List[Dict[str, str]],
    chat_display: List[List[Optional[str]]],
    llm: LLMManager,
    tts: Optional[TTSManager],
    silent: Optional[bool] = False,
) -> Generator[Tuple[List[Dict[str, str]], List[List[Optional[str]]], str, bytes], None, None]:
    """
    Send a request to the LLM and process the response.

    Args:
        code (str): Current code.
        previous_code (str): Previous code.
        chat_history (List[Dict[str, str]]): Current chat history.
        chat_display (List[List[Optional[str]]]): Current chat display.
        llm (LLMManager): LLM manager instance.
        tts (Optional[TTSManager]): TTS manager instance.
        silent (Optional[bool]): Whether to silence audio output. Defaults to False.

    Yields:
        Tuple[List[Dict[str, str]], List[List[Optional[str]]], str, bytes]: Updated chat history, chat display, code, and audio chunk.
    """

    # TODO: Find the way to simplify it and remove duplication in logic
    logger.info(
        "send_request called: code_len=%s previous_code_len=%s chat_history_len=%s chat_display_len=%s",
        len(code or ""),
        len(previous_code or ""),
        len(chat_history or []),
        len(chat_display or []),
    )

    if silent is None:
        silent = os.getenv("SILENT", False)

    if chat_display[-1][0] is None and code == previous_code:
        yield chat_history, chat_display, code, b""
        return

    chat_history = llm.update_chat_history(code, previous_code, chat_history, chat_display)
    logger.info("send_request updated chat_history_len=%s", len(chat_history))
    original_len = len(chat_display)
    chat_display.append([None, ""])

    text_chunks = []
    reply = llm.get_text(chat_history)

    chat_history.append({"role": "assistant", "content": ""})

    audio_generator = iter(())
    has_text_item = True
    has_audio_item = not silent
    audio_created = 0
    is_notes = False

    while has_text_item or has_audio_item:
        try:
            text_chunk = next(reply)
            text_chunks.append(text_chunk)
            has_text_item = True
        except StopIteration:
            has_text_item = False
            chat_history[-1]["content"] = "".join(text_chunks)

        if silent:
            audio_chunk = b""
        else:
            try:
                audio_chunk = next(audio_generator)
                has_audio_item = True
            except StopIteration:
                audio_chunk = b""
                has_audio_item = False

        if has_text_item and not is_notes:
            last_message = chat_display[-1][1]
            last_message += text_chunk

            split_notes = last_message.split("#NOTES#")
            if len(split_notes) > 1:
                is_notes = True
            last_message = split_notes[0]
            split_messages = last_message.split("\n\n")
            chat_display[-1][1] = split_messages[0]
            for m in split_messages[1:]:
                chat_display.append([None, m])

        if not silent:
            if len(chat_display) - original_len > audio_created + has_text_item:
                audio_generator = chain(audio_generator, tts.read_text(chat_display[original_len + audio_created][1]))
                audio_created += 1
                has_audio_item = True

        yield chat_history, chat_display, code, audio_chunk

    if chat_display and len(chat_display) > 1 and chat_display[-1][1] == "" and chat_display[-2][1]:
        chat_display.pop()
        yield chat_history, chat_display, code, b""
    logger.info("send_request completed")


def change_code_area(interview_type: str) -> gr.update:
    """
    Update the code area based on the interview type.

    Args:
        interview_type (str): Type of interview.

    Returns:
        gr.update: Gradio update object for the code area.
    """
    if interview_type == "coding":
        return gr.update(
            label="Please write your code here. You can use any language, but only Python syntax highlighting is available.",
            language="python",
        )
    elif interview_type == "sql":
        return gr.update(
            label="Please write your query here.",
            language="sql",
        )
    else:
        return gr.update(
            label="Please write any notes for your solution here.",
            language=None,
        )


def get_problem_solving_ui(
    llm: LLMManager, tts: TTSManager, stt: STTManager, default_audio_params: Dict[str, Any], audio_output: gr.Audio
) -> gr.Tab:
    """
    Create the problem-solving UI for the interview application.

    Args:
        llm (LLMManager): LLM manager instance.
        tts (TTSManager): TTS manager instance.
        stt (STTManager): STT manager instance.
        default_audio_params (Dict[str, Any]): Default audio parameters.
        audio_output (gr.Audio): Gradio audio output component.

    Returns:
        gr.Tab: Gradio tab containing the problem-solving UI.
    """
    send_request_partial = partial(send_request, llm=llm, tts=tts)
    play_last_message = tts.read_last_message if os.environ.get("DEBUG", False) else (lambda _chat: None)

    def log_stage(stage: str):
        logger.info("generate_button stage=%s", stage)

    def start_timer():
        logger.info("generate_button stage=start_timer")
        return time.time()

    def get_duration_string(start_time):
        logger.info("generate_button stage=get_duration_string start_time=%s", start_time)
        if start_time is None:
            duration_str = ""
        else:
            duration = int(time.time() - start_time)
            minutes, seconds = divmod(duration, 60)
            duration_str = f"Interview duration: {minutes} minutes, {seconds} seconds"
        return duration_str

    def log_and_add_interviewer_start(chat):
        logger.info("generate_button stage=add_start_message chat_is_none=%s", chat is None)
        return add_interviewer_message(fixed_messages["start"])(chat)

    def log_play_last_message(chat):
        logger.info("generate_button stage=play_last_message debug_enabled=%s", bool(os.environ.get("DEBUG", False)))
        return play_last_message(chat)

    def hide_initial_controls():
        logger.info("generate_button stage=hide_initial_controls")
        return (
            gr.update(visible=False),
            gr.update(interactive=False),
            gr.update(interactive=False),
            gr.update(interactive=False),
            gr.update(visible=False),
        )

    def show_problem_section():
        logger.info("generate_button stage=show_problem_section")
        return gr.update(visible=True)

    def generate_problem_with_logging(requirements, difficulty, topic, interview_type):
        logger.info(
            "generate_button stage=generate_problem interview_type=%s difficulty=%s topic=%s requirements_len=%s",
            interview_type,
            difficulty,
            topic,
            len(requirements or ""),
        )
        for text in llm.get_problem(requirements, difficulty, topic, interview_type):
            logger.info("generate_button stage=generate_problem_chunk current_len=%s", len(text or ""))
            yield text
        logger.info("generate_button stage=generate_problem_done")

    def init_bot_with_logging(description, interview_type):
        logger.info(
            "generate_button stage=init_bot interview_type=%s description_len=%s",
            interview_type,
            len(description or ""),
        )
        return llm.init_bot(description, interview_type)

    def show_solution_section():
        logger.info("generate_button stage=show_solution_section")
        return (gr.update(visible=True), gr.update(interactive=True), gr.update(interactive=True))

    def log_transcription_started():
        logger.info("audio_input stage=transcription_started")

    def log_transcription_finished():
        logger.info("audio_input stage=transcription_finished")

    def log_hidden_text(text):
        logger.info("audio_input stage=hidden_text_updated text_len=%s", len(text or ""))
        return text

    def log_chat_after_stt(chat):
        logger.info("audio_input stage=chat_updated_after_stt chat_len=%s", len(chat or []))
        return chat

    def transcribe_recorded_audio(audio, current_text):
        if audio is None:
            logger.info("audio_input stage=transcribe_recorded_audio audio_is_none=True")
            return current_text

        sample_rate, audio_data = audio
        audio_len = 0 if audio_data is None else len(audio_data)
        logger.info(
            "audio_input stage=transcribe_recorded_audio sample_rate=%s audio_len=%s existing_text_len=%s",
            sample_rate,
            audio_len,
            len(current_text or ""),
        )
        if audio_len == 0:
            return current_text
        return stt.transcribe_audio(audio_data, current_text, sample_rate=sample_rate)

    def hide_audio_input():
        logger.info("audio_input stage=stop_recording_hide_input")
        return gr.update(visible=False)

    def reset_hidden_text():
        logger.info("audio_input stage=reset_hidden_text")
        return ""

    def show_audio_input():
        logger.info("audio_input stage=show_audio_input")
        return gr.update(visible=True)

    with gr.Tab("Interview", render=False, elem_id=f"tab") as problem_tab:
        if os.getenv("IS_DEMO"):
            gr.Markdown(DEMO_MESSAGE)
        chat_history = gr.State([])
        previous_code = gr.State("")
        start_time = gr.State(None)
        hi_markdown = gr.Markdown(
            "<h2 style='text-align: center;'> Hi! I'm here to guide you through a practice session for your technical interview. Choose the interview settings to begin.</h2>\n"
        )

        # UI components for interview settings
        with gr.Row() as init_acc:
            with gr.Column(scale=3):
                interview_type_select = gr.Dropdown(
                    show_label=False,
                    info="Type of the interview.",
                    choices=interview_types,
                    value="coding",
                    container=True,
                    allow_custom_value=False,
                    elem_id=f"interview_type_select",
                    scale=2,
                )
                difficulty_select = gr.Dropdown(
                    show_label=False,
                    info="Difficulty of the problem.",
                    choices=["Easy", "Medium", "Hard"],
                    value="Medium",
                    container=True,
                    allow_custom_value=True,
                    elem_id=f"difficulty_select",
                    scale=2,
                )
                topic_select = gr.Dropdown(
                    show_label=False,
                    info="Topic (you can type any value).",
                    choices=topic_lists[interview_type_select.value],
                    value=np.random.choice(topic_lists[interview_type_select.value]),
                    container=True,
                    allow_custom_value=True,
                    elem_id=f"topic_select",
                    scale=2,
                )
            with gr.Column(scale=4):
                requirements = gr.Textbox(
                    label="Requirements",
                    show_label=False,
                    placeholder="Specify additional requirements if any.",
                    container=False,
                    lines=5,
                    elem_id=f"requirements",
                )
                with gr.Row():
                    terms_checkbox = gr.Checkbox(
                        label="",
                        container=False,
                        value=not os.getenv("IS_DEMO", False),
                        interactive=True,
                        elem_id=f"terms_checkbox",
                        min_width=20,
                    )
                    with gr.Column(scale=100):
                        gr.Markdown(
                            "#### I agree to the [terms and conditions](https://github.com/IliaLarchenko/Interviewer?tab=readme-ov-file#important-legal-and-compliance-information)"
                        )
                start_btn = gr.Button("Generate a problem", elem_id=f"start_btn", interactive=not os.getenv("IS_DEMO", False))

        # Problem statement and solution components
        with gr.Accordion("Problem statement", open=True, visible=False) as problem_acc:
            description = gr.Markdown(elem_id=f"problem_description", line_breaks=True)
        with gr.Accordion("Solution", open=True, visible=False) as solution_acc:
            with gr.Row() as content:
                with gr.Column(scale=2):
                    code = gr.Code(
                        label="Please write your code here.",
                        language="python",
                        lines=46,
                        elem_id=f"code",
                    )
                with gr.Column(scale=1):
                    end_btn = gr.Button("Finish the interview", interactive=False, variant="stop", elem_id=f"end_btn")
                    chat = gr.Chatbot(label="Chat", show_label=False, show_share_button=False, elem_id=f"chat", value=[])

                    audio_input = gr.Audio(interactive=False, **default_audio_params, elem_id=f"audio_input")

        with gr.Accordion("Feedback", open=True, visible=False) as feedback_acc:
            interview_time = gr.Markdown()
            feedback = gr.Markdown(elem_id=f"feedback", line_breaks=True)

        start_btn.click(fn=start_timer, outputs=[start_time]).success(
            fn=log_and_add_interviewer_start, inputs=[chat], outputs=[chat]
        ).success(fn=log_play_last_message, inputs=[chat], outputs=[audio_output]).success(
            fn=hide_initial_controls,
            outputs=[init_acc, start_btn, terms_checkbox, interview_type_select, hi_markdown],
        ).success(
            fn=show_problem_section,
            outputs=[problem_acc],
        ).success(
            fn=generate_problem_with_logging,
            inputs=[requirements, difficulty_select, topic_select, interview_type_select],
            outputs=[description],
            scroll_to_output=True,
        ).success(
            fn=init_bot_with_logging, inputs=[description, interview_type_select], outputs=[chat_history]
        ).success(
            fn=show_solution_section,
            outputs=[solution_acc, end_btn, audio_input],
        )

        end_btn.click(fn=lambda x: add_candidate_message("Let's stop here.", x), inputs=[chat], outputs=[chat]).success(
            fn=add_interviewer_message(fixed_messages["end"]),
            inputs=[chat],
            outputs=[chat],
        ).success(fn=play_last_message, inputs=[chat], outputs=[audio_output]).success(
            fn=lambda: (
                gr.update(open=False),
                gr.update(interactive=False),
                gr.update(open=False),
                gr.update(interactive=False),
            ),
            outputs=[solution_acc, end_btn, problem_acc, audio_input],
        ).success(
            fn=lambda: (gr.update(visible=True)),
            outputs=[feedback_acc],
        ).success(
            fn=llm.end_interview, inputs=[description, chat_history, interview_type_select], outputs=[feedback]
        ).success(
            fn=get_duration_string, inputs=[start_time], outputs=[interview_time]
        )

        hidden_text = gr.State("")

        stop_audio_recording = audio_input.stop_recording(fn=hide_audio_input, outputs=[audio_input])
        stop_audio_recording.success(
            fn=log_transcription_started
        ).success(
            fn=transcribe_recorded_audio, inputs=[audio_input, hidden_text], outputs=[hidden_text]
        ).success(
            fn=log_hidden_text, inputs=[hidden_text], outputs=[hidden_text]
        ).success(
            fn=stt.add_to_chat, inputs=[hidden_text, chat], outputs=[chat]
        ).success(
            fn=log_chat_after_stt, inputs=[chat], outputs=[chat]
        ).success(
            fn=log_transcription_finished
        ).success(
            fn=send_request_partial,
            inputs=[code, previous_code, chat_history, chat],
            outputs=[chat_history, chat, previous_code, audio_output],
            show_progress="full",
        ).then(fn=reset_hidden_text, outputs=[hidden_text]).then(
            fn=show_audio_input, outputs=[audio_input]
        )

        interview_type_select.change(
            fn=lambda x: gr.update(choices=topic_lists[x], value=np.random.choice(topic_lists[x])),
            inputs=[interview_type_select],
            outputs=[topic_select],
        ).success(fn=change_code_area, inputs=[interview_type_select], outputs=[code])

        terms_checkbox.change(fn=lambda x: gr.update(interactive=x), inputs=[terms_checkbox], outputs=[start_btn])
    return problem_tab
