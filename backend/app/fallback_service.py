import json
import os
import random
from typing import List

from .models import Question

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "preloaded_questions.json")

# Load once at startup
with open(DATA_PATH, "r", encoding="utf-8") as f:
    _DATA = json.load(f)


def get_fallback_questions(category: str, difficulty: str, num_questions: int) -> List[Question]:
    """Return exactly num_questions offline questions or raise error."""

    category_data = _DATA.get(category)
    if not category_data:
        category_data = next(iter(_DATA.values()))

    difficulty_questions = category_data.get(difficulty)
    if not difficulty_questions:
        difficulty_questions = category_data.get("easy", [])

    if len(difficulty_questions) < num_questions:
        raise ValueError(
            f"Only {len(difficulty_questions)} offline questions available "
            f"for {category} ({difficulty}). Need {num_questions}."
        )

    sampled = random.sample(difficulty_questions, k=num_questions)

    return [
        Question(
            id=q["id"],
            questionText=q["questionText"],
            options=q["options"],
            correctIndex=q["correctIndex"],
            category=category,
            difficulty=difficulty,
        )
        for q in sampled
    ]

