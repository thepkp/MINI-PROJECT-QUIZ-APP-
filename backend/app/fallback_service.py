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
    """Return up to num_questions questions for given category & difficulty from static JSON."""
    category_data = _DATA.get(category)
    if not category_data:
        # If category not found, pick the first available one
        category_data = next(iter(_DATA.values()))

    difficulty_questions = category_data.get(difficulty, [])
    if not difficulty_questions:
        # If no questions for difficulty, fallback to easy
        difficulty_questions = category_data.get("easy", [])

    sampled = random.sample(difficulty_questions, k=min(num_questions, len(difficulty_questions)))

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
