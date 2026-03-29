import logging
import os
from typing import Any, Dict, Generator, List, Optional, Tuple

from utils.errors import APIError

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - handled at runtime when dependency is missing
    genai = None
    types = None


class PromptManager:
    def __init__(self, prompts: Dict[str, str]):
        """
        Initialize the PromptManager.

        Args:
            prompts (Dict[str, str]): A dictionary of prompt keys and their corresponding text.
        """
        self.prompts: Dict[str, str] = prompts
        self.limit: Optional[str] = os.getenv("DEMO_WORD_LIMIT")

    def add_limit(self, prompt: str) -> str:
        """
        Add word limit to the prompt if specified in the environment variables.

        Args:
            prompt (str): The original prompt.

        Returns:
            str: The prompt with added word limit if applicable.
        """
        if self.limit:
            prompt += f" Keep your responses very short and simple, no more than {self.limit} words."
        return prompt

    def get_system_prompt(self, key: str) -> str:
        """
        Retrieve and limit a system prompt by its key.

        Args:
            key (str): The key for the desired prompt.

        Returns:
            str: The retrieved prompt with added word limit if applicable.

        Raises:
            KeyError: If the key is not found in the prompts dictionary.
        """
        prompt = self.prompts[key]
        return self.add_limit(prompt)

    def get_problem_requirements_prompt(
        self, type: str, difficulty: Optional[str] = None, topic: Optional[str] = None, requirements: Optional[str] = None
    ) -> str:
        """
        Create a problem requirements prompt with optional parameters.

        Args:
            type (str): The type of problem.
            difficulty (Optional[str]): The difficulty level of the problem.
            topic (Optional[str]): The topic of the problem.
            requirements (Optional[str]): Additional requirements for the problem.

        Returns:
            str: The constructed problem requirements prompt.
        """
        prompt = f"Create a {type} problem. Difficulty: {difficulty}. Topic: {topic}. Additional requirements: {requirements}."
        return self.add_limit(prompt)


class LLMManager:
    def __init__(self, config: Any, prompts: Dict[str, str]):
        """
        Initialize the LLMManager.

        Args:
            config (Any): Configuration object containing LLM settings.
            prompts (Dict[str, str]): A dictionary of prompts for the PromptManager.
        """
        self.config = config
        self.llm_type = config.llm.type
        if self.llm_type != "GEMINI_API":
            raise ValueError(f"Unsupported LLM type: {self.llm_type}. Only GEMINI_API is supported.")
        if genai is None or types is None:
            raise ImportError("google-genai is required for GEMINI_API. Install dependencies from requirements.txt.")

        self.client = genai.Client(api_key=config.llm.key)

        self.prompt_manager = PromptManager(prompts)

        self.status = self.test_llm(stream=False)
        self.streaming = self.test_llm(stream=True) if self.status else False

    def get_text(self, messages: List[Dict[str, str]], stream: Optional[bool] = None) -> Generator[str, None, None]:
        """
        Generate text from the LLM, optionally streaming the response.

        Args:
            messages (List[Dict[str, str]]): List of message dictionaries.
            stream (Optional[bool]): Whether to stream the response. Defaults to self.streaming if not provided.

        Yields:
            str: Generated text chunks.

        Raises:
            APIError: If an unexpected error occurs during text generation.
        """
        if stream is None:
            stream = self.streaming
        try:
            yield from self._get_text_gemini(messages, stream)
        except Exception as e:
            raise APIError(f"LLM Get Text Error: Unexpected error: {e}")

    def _get_text_gemini(self, messages: List[Dict[str, str]], stream: bool) -> Generator[str, None, None]:
        """
        Generate text using the Gemini API.

        Args:
            messages (List[Dict[str, str]]): List of message dictionaries.
            stream (bool): Whether to stream the response.

        Yields:
            str: Generated text chunks.
        """
        system_instruction, contents = self._prepare_gemini_messages(messages)
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=1,
            max_output_tokens=2000,
        )

        if not stream:
            response = self.client.models.generate_content(
                model=self.config.llm.name,
                contents=contents,
                config=config,
            )
            yield self._extract_gemini_text(response).strip()
        else:
            response = self.client.models.generate_content_stream(
                model=self.config.llm.name,
                contents=contents,
                config=config,
            )
            for chunk in response:
                text = self._extract_gemini_text(chunk)
                if text:
                    yield text

    def _prepare_gemini_messages(self, messages: List[Dict[str, str]]) -> Tuple[Optional[str], List[Any]]:
        """
        Convert OpenAI-style chat history into Gemini contents plus a single system instruction.

        Args:
            messages (List[Dict[str, str]]): List of message dictionaries.

        Returns:
            Tuple[Optional[str], List[Any]]: Gemini system instruction and contents list.
        """
        system_message = None
        contents = []

        for message in messages:
            if message["role"] == "system":
                if system_message is None:
                    system_message = message["content"]
                else:
                    system_message += "\n" + message["content"]
            else:
                role = "model" if message["role"] == "assistant" else "user"
                if contents and contents[-1].role == role:
                    contents[-1].parts.append(types.Part(text=message["content"]))
                else:
                    contents.append(types.Content(role=role, parts=[types.Part(text=message["content"])]))

        return system_message, contents

    def _extract_gemini_text(self, response: Any) -> str:
        """
        Extract plain text from Gemini SDK responses and streamed chunks.

        Args:
            response (Any): Gemini response or chunk.

        Returns:
            str: Extracted text, if any.
        """
        text = getattr(response, "text", None)
        if text:
            return text

        candidates = getattr(response, "candidates", None) or []
        collected_parts = []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None) or []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    collected_parts.append(part_text)
        return "".join(collected_parts)

    def test_llm(self, stream: bool = False) -> bool:
        """
        Test the LLM connection with or without streaming.

        Args:
            stream (bool): Whether to test streaming functionality.

        Returns:
            bool: True if the test is successful, False otherwise.
        """
        try:
            test_messages = [
                {"role": "system", "content": "You just help me test the connection."},
                {"role": "user", "content": "Hi!"},
                {"role": "user", "content": "Ping!"},
            ]
            list(self.get_text(test_messages, stream=stream))
            return True
        except APIError as e:
            logging.error(f"LLM test failed: {e}")
            return False
        except Exception as e:
            logging.error(f"Unexpected error during LLM test: {e}")
            return False

    def init_bot(self, problem: str, interview_type: str = "coding") -> List[Dict[str, str]]:
        """
        Initialize the bot with a system prompt and problem description.

        Args:
            problem (str): The problem description.
            interview_type (str): The type of interview. Defaults to "coding".

        Returns:
            List[Dict[str, str]]: Initial messages for the bot.
        """
        system_prompt = self.prompt_manager.get_system_prompt(f"{interview_type}_interviewer_prompt")
        return [{"role": "system", "content": f"{system_prompt}\nThe candidate is solving the following problem:\n {problem}"}]

    def get_problem_prepare_messages(self, requirements: str, difficulty: str, topic: str, interview_type: str) -> List[Dict[str, str]]:
        """
        Prepare messages for generating a problem based on given requirements.

        Args:
            requirements (str): Specific requirements for the problem.
            difficulty (str): Difficulty level of the problem.
            topic (str): Topic of the problem.
            interview_type (str): Type of interview.

        Returns:
            List[Dict[str, str]]: Prepared messages for problem generation.
        """
        system_prompt = self.prompt_manager.get_system_prompt(f"{interview_type}_problem_generation_prompt")
        full_prompt = self.prompt_manager.get_problem_requirements_prompt(interview_type, difficulty, topic, requirements)
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_prompt},
        ]

    def get_problem(self, requirements: str, difficulty: str, topic: str, interview_type: str) -> Generator[str, None, None]:
        """
        Get a problem from the LLM based on the given requirements, difficulty, and topic.

        Args:
            requirements (str): Specific requirements for the problem.
            difficulty (str): Difficulty level of the problem.
            topic (str): Topic of the problem.
            interview_type (str): Type of interview.

        Yields:
            str: Incrementally generated problem statement.
        """
        messages = self.get_problem_prepare_messages(requirements, difficulty, topic, interview_type)
        problem = ""
        for text in self.get_text(messages):
            problem += text
            yield problem

    def update_chat_history(
        self, code: str, previous_code: str, chat_history: List[Dict[str, str]], chat_display: List[List[Optional[str]]]
    ) -> List[Dict[str, str]]:
        """
        Update chat history with the latest user message and code.

        Args:
            code (str): Current code.
            previous_code (str): Previous code.
            chat_history (List[Dict[str, str]]): Current chat history.
            chat_display (List[List[Optional[str]]]): Current chat display.

        Returns:
            List[Dict[str, str]]: Updated chat history.
        """
        message = chat_display[-1][0]
        if not message:
            message = ""
        if code != previous_code:
            message += "\nMY NOTES AND CODE:\n" + code
        chat_history.append({"role": "user", "content": message})
        return chat_history

    def end_interview_prepare_messages(
        self, problem_description: str, chat_history: List[Dict[str, str]], interview_type: str
    ) -> List[Dict[str, str]]:
        """
        Prepare messages to end the interview and generate feedback.

        Args:
            problem_description (str): The original problem description.
            chat_history (List[Dict[str, str]]): The chat history.
            interview_type (str): The type of interview.

        Returns:
            List[Dict[str, str]]: Prepared messages for generating feedback.
        """
        transcript = [f"{message['role'].capitalize()}: {message['content']}" for message in chat_history[1:]]
        system_prompt = self.prompt_manager.get_system_prompt(f"{interview_type}_grading_feedback_prompt")
        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"The original problem to solve: {problem_description}"},
            {"role": "user", "content": "\n\n".join(transcript)},
            {"role": "user", "content": "Grade the interview based on the transcript provided and give feedback."},
        ]

    def end_interview(
        self, problem_description: str, chat_history: List[Dict[str, str]], interview_type: str = "coding"
    ) -> Generator[str, None, None]:
        """
        End the interview and get feedback from the LLM.

        Args:
            problem_description (str): The original problem description.
            chat_history (List[Dict[str, str]]): The chat history.
            interview_type (str): The type of interview. Defaults to "coding".

        Yields:
            str: Incrementally generated feedback.
        """
        if len(chat_history) <= 2:
            yield "No interview history available"
            return
        messages = self.end_interview_prepare_messages(problem_description, chat_history, interview_type)
        feedback = ""
        for text in self.get_text(messages):
            feedback += text
            yield feedback
