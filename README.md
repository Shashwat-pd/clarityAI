---
title: Interview With AI
emoji: 📚
colorFrom: pink
colorTo: yellow
sdk: gradio
sdk_version: 4.40.0
app_file: app.py
pinned: true
license: apache-2.0
short_description: Mock tech interview with AI.
tags:
  - LLM
  - AI
  - Interview
  - Coding
  - System Design
  - Speech-to-Text
  - Text-to-Speech
  - Agent
  - Chatbot
  - Voice Assistant
  - Education
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference


# Welcome to the AI Mock Interviewer!

You can try this service in the demo mode here: [AI Interviewer](https://huggingface.co/spaces/IliaLarchenko/interviewer).

But for the good experience you need to run it locally [Project repository](https://github.com/IliaLarchenko/Interviewer).

This tool is designed to help you practice various technical interviews by simulating real interview experiences. 
You can enhance your skills in coding, (machine learning) system design, and other topics. 
You can brush your interview skills in a realistic setting, although it’s not intended to replace thorough preparations like studying algorithms or practicing coding problems.

## Key Features

- **Speech-First Interface**: Talk to the AI just like you would with a real interviewer. This makes your practice sessions feel more realistic.
- **Various AI Models**: The tool uses three types of AI models:
  - **LLM (Large Language Model)**: Acts as the interviewer.
- **Speech-to-Text and Text-to-Speech Models**: These models help to mimic real conversations by converting spoken words to text and vice versa. The default documented audio provider is Deepgram.
- **Model Flexibility**: The app uses Gemini for the interviewer LLM and Deepgram for audio.
- **Streaming Mode**: All models can be used in streaming mode. Instead of waiting for the full response from the AI, you can get partial responses in real-time.


# Running the AI Tech Interviewer Simulator

To get the real experience you should run the AI interviewer locally and use your own API keys.

## Initial Setup

### Clone the Repository

First, clone the project repository to your local machine with the following commands:

```bash
git clone https://github.com/IliaLarchenko/Interviewer
cd interviewer
```

### Configure the Environment

Create a `.env` file from the provided example and edit it to include your Gemini and Deepgram API keys:

```bash
cp env_examples/.env.gemini.example .env
nano .env  # You can use any text editor
```

If you want to use any other model, follow the instructions in Models Configuration section.

### Build and Run the Docker Container

To build and start the Docker container:

```bash
docker-compose build
docker-compose up
```

The application will be accessible at `http://localhost:7860`.

### Running Locally (alternative)

If you don't want to use Docker just set up a Python environment and install dependencies to run the application locally:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

The application should now be accessible at `http://localhost:7860`.


# Models Configuration

AI Interviewer is powered by three types of AI models: a Large Language Model (LLM) for simulating interviews, a Speech-to-Text (STT) model for audio processing, and a Text-to-Speech (TTS) model to read LLM responses. You can configure each model separately to tailor the experience based on your preferences and available resources.

### Large Language Model (LLM)

- **Gemini Models**: The interviewer LLM now uses Google's Gemini API through the `google-genai` Python SDK. Configure it with `GEMINI_API_KEY`, `LLM_TYPE=GEMINI_API`, and a Gemini model name such as `gemini-2.5-flash`.

### Speech-to-Text (STT)

- **Deepgram Nova-3**: The repo uses Deepgram's pre-recorded transcription API for microphone chunks.

### Text-to-Speech (TTS)

- **Deepgram Aura**: The repo uses Deepgram's TTS API for interviewer audio playback.

## Configuration via .env File

The tool uses a `.env` file for environment configuration. Here’s a breakdown of how this works:

- **API Keys**: Your Gemini and Deepgram API keys must be specified in the `.env` file.
- **Model URLs and Types**: Specify the API endpoint URLs for each model and their type (`GEMINI_API` and `DEEPGRAM_API`).
- **Model Names**: Set the specific model names, such as `gemini-2.5-flash`, `nova-3`, or `aura-2-thalia-en`.

### Example Configuration

Gemini LLM:
```plaintext
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
LLM_URL=https://generativelanguage.googleapis.com
LLM_TYPE=GEMINI_API
LLM_NAME=gemini-2.5-flash
```

Deepgram audio:
```plaintext
DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY
STT_URL=https://api.deepgram.com/v1/listen
STT_TYPE=DEEPGRAM_API
STT_NAME=nova-3
TTS_URL=https://api.deepgram.com/v1/speak
TTS_TYPE=DEEPGRAM_API
TTS_NAME=aura-2-thalia-en
```

Use [env_examples/.env.gemini.example](/Users/shashwatpoudel/Documents/hack-clarity/Interviewer/env_examples/.env.gemini.example) as the starting point for your `.env`.

# Acknowledgements

The service is powered by Gradio, and the demo version is hosted on HuggingFace Spaces.

Even though the service can be used with a few model providers I want to specifically acknowledge a few of them:
- **Google**: For Gemini models used as the interviewer LLM. More details are available at [Google AI for Developers](https://ai.google.dev/).
- **Deepgram**: For Nova-3 speech-to-text and Aura text-to-speech audio services. More details are available at [Deepgram's docs](https://developers.deepgram.com/documentation/).

Please ensure to review the specific documentation and follow the terms of service for each model and API you use, as this is crucial for responsible and compliant use of these technologies.


# Important Legal and Compliance Information

## Acceptance of Terms
By utilizing this project, in any form—hosted or locally run—you acknowledge and consent to the terms outlined herein. Continued use of the service following any modifications to these terms constitutes acceptance of the revised terms.

## General User Responsibilities
Users of this project are responsible for complying with all applicable laws and regulations in their jurisdiction, including data protection and privacy laws.

## Liability Disclaimer
The creator of this open source software disclaims all liability for any damages or legal issues that arise from the use of this software. Users are solely responsible for their own data and ensuring compliance with all applicable laws and regulations.

## License Compatibility
This project is released under the Apache 2.0 license. Users must ensure compatibility with this license when integrating additional software or libraries.

## Contribution Guidelines
Contributors are required to ensure that their contributions comply with this license and respect the legal rights of third parties.

## Specific Guidelines for Usage
### 1. Hosted Demo Version on Hugging Face Spaces
- **Prohibition on Personal Data Submission**: Users must not input any private, personal, sensitive information, or other restricted categories such as commercial secrets, proprietary business information, or potentially non-public financial data into this service. The functionalities that process personal data, such as CV analysis and behavioral interviews, have been disabled in this demo mode. The service is designed solely for non-personal data interaction.
- **Third-Party API Usage**: User inputs are processed using third-party APIs, including services by Google and Deepgram, under the service owner's API keys. No data is stored by the service owner. Users must review and comply with the terms of service and privacy policies of these third-party services.
- **Hugging Face Policies**: Usage of this service on Hugging Face Spaces binds users to Hugging Face’s terms of use and privacy policy. Users are advised to review these policies, accessible on the Hugging Face website, to understand their rights and obligations.

### 2. Running the Service Locally
- **Absolute User Responsibility**: When the service is run locally, users have absolute control and responsibility over its operation. Users must secure their own API keys from third-party providers. Users are fully responsible for ensuring that their use complies with all applicable laws and third-party policies.
- **Data Sensitivity Caution**: Users are strongly cautioned against entering sensitive, personal, or non-public information, including but not limited to trade secrets, undisclosed patents, or insider information that could potentially result in legal repercussions or breaches of confidentiality.

## AI-Generated Content Disclaimer
- **Nature of AI Content**: Content generated by this service is derived from artificial intelligence, utilizing models such as Large Language Models (LLM), Speech-to-Text (STT), Text-to-Speech (TTS), and other models. The service owner assumes no responsibility for the content generated by AI. This content is provided for informational or entertainment purposes only and should not be considered legally binding or factually accurate. AI-generated content does not constitute an agreement or acknowledge any factual statements or obligations.
