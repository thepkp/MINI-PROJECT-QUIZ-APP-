import json
from typing import List

import google.generativeai as genai

from .config import GEMINI_API_KEY
from .models import Question

# Configure Gemini once at import time
if not GEMINI_API_KEY:
  raise RuntimeError("GEMINI_API_KEY is not set in .env")

genai.configure(api_key=GEMINI_API_KEY)

# You can change the model name later if needed
MODEL_NAME = "gemini-flash-latest"


def _build_prompt(topic: str, difficulty: str, num_questions: int) -> str:
    """
    Build a clear prompt for Gemini so it returns STRICT JSON only.
    """
    difficulty_text = {
        "easy": "easy, beginner-friendly",
        "medium": "moderate, for undergraduate level",
        "hard": "challenging, conceptual and analytical"
    }.get(difficulty.lower(), "mixed difficulty")

    # We strongly instruct the model to output only JSON in a known format.
    return f"""
You are a question generator for a multiple-choice quiz app.

Generate exactly {num_questions} MCQ questions on the topic: "{topic}".

Difficulty level: {difficulty_text}.

Rules:
- Each question must have exactly 4 options.
- Only one option is correct.
- Make questions clear, concise, and non-ambiguous.
- Avoid offensive, unsafe, or personal content.
- Keep questions generic and suitable for engineering students.

Return the output as pure JSON (no explanations, no markdown, no backticks).
Use this exact schema:

{{
  "questions": [
    {{
      "id": "string-question-id",
      "questionText": "your question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0
    }}
  ]
}}

Remember:
- "correctIndex" is an integer 0, 1, 2 or 3 indicating which option is correct.
- Do NOT wrap the JSON in ```json or any other text.
- Do NOT include extra keys.
"""


async def generate_questions_ai(topic: str, difficulty: str, num_questions: int) -> List[Question]:
    """
    Call Gemini API and return a list of Question objects.

    If anything fails (API error / JSON parse error / wrong format),
    let the exception bubble up so the caller can fall back to offline questions.
    """
    model = genai.GenerativeModel(MODEL_NAME)
    prompt = _build_prompt(topic, difficulty, num_questions)

    # Call the model (synchronous, but fine for this mini-project)
    response = model.generate_content(prompt)
    raw_text = response.text or ""
    print("\n==== GEMINI RAW OUTPUT START ====\n")
    print(raw_text[:2000])  # print first 2000 chars
    print("\n==== GEMINI RAW OUTPUT END ====\n")


    # Sometimes models still wrap JSON in ```...```; strip that defensively
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        # remove the first ```... line
        raw_text = raw_text.split("```", maxsplit=2)[1]
        raw_text = raw_text.strip()
    if raw_text.startswith("json"):
        raw_text = raw_text[4:].strip()

    # Extract JSON substring between first '{' and last '}'
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start == -1 or end == -1:
        raise RuntimeError("Gemini output did not contain valid JSON")

    json_str = raw_text[start : end + 1]

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse Gemini JSON: {e}") from e

    questions_raw = data.get("questions")
    if not isinstance(questions_raw, list) or len(questions_raw) == 0:
        raise RuntimeError("Gemini JSON does not contain a non-empty 'questions' list")

    questions: List[Question] = []
    for i, q in enumerate(questions_raw):
        try:
            q_id = str(q.get("id") or f"ai_{topic}_{difficulty}_{i}")
            q_text = str(q["questionText"])
            options = list(q["options"])
            correct_index = int(q["correctIndex"])

            # Basic validation
            if len(options) != 4:
                raise ValueError("Each question must have exactly 4 options")
            if correct_index < 0 or correct_index > 3:
                raise ValueError("correctIndex must be between 0 and 3")

            questions.append(
                Question(
                    id=q_id,
                    questionText=q_text,
                    options=options,
                    correctIndex=correct_index,
                    category=topic,
                    difficulty=difficulty,
                )
            )
        except Exception as e:
            # If one question is malformed, skip it; we just need enough for the quiz
            print(f"[Gemini] Skipping malformed question {i}: {e}")
            continue

    if not questions:
        raise RuntimeError("No valid questions could be built from Gemini output")

    # Trim to requested count in case Gemini returns more
    return questions[:num_questions]
