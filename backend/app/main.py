from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .models import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    ScoreQuizRequest,
    ScoreQuizResponse,
)
from .fallback_service import get_fallback_questions
from .ai_service import generate_questions_ai

# -----------------------------------------------------------------------------
# Logging setup
# -----------------------------------------------------------------------------
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="AI Quiz Backend")

# Allow frontend to talk to backend
origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(req: GenerateQuestionsRequest):
    """
    Generate quiz questions based on category, difficulty, numQuestions and useAI toggle.
    """
    logger.info(
        "GenerateQuestions called | category=%s difficulty=%s num=%s useAI=%s",
        req.category,
        req.difficulty,
        req.numQuestions,
        req.useAI,
    )

    questions = []
    source = "fallback"

    if req.useAI:
        try:
            logger.info("AI mode ON → calling Gemini...")
            questions = await generate_questions_ai(
                topic=req.category,
                difficulty=req.difficulty,
                num_questions=req.numQuestions,
            )
            source = "ai"
            logger.info("Gemini returned %d questions.", len(questions))
        except Exception as e:
            logger.error("AI generation failed: %r", e)
            logger.info("Falling back to preloaded questions...")
            questions = get_fallback_questions(
                category=req.category,
                difficulty=req.difficulty,
                num_questions=req.numQuestions,
            )
            source = "fallback"
            logger.info("Fallback returned %d questions.", len(questions))
    else:
        logger.info("AI mode OFF → using preloaded questions only.")
        questions = get_fallback_questions(
            category=req.category,
            difficulty=req.difficulty,
            num_questions=req.numQuestions,
        )
        source = "fallback"
        logger.info("Fallback returned %d questions.", len(questions))

    logger.info("Question source used for this quiz: %s", source)
    return GenerateQuestionsResponse(source=source, questions=questions)


@app.post("/api/score-quiz", response_model=ScoreQuizResponse)
async def score_quiz(req: ScoreQuizRequest):
    """
    Calculate score based on questions + userAnswers.
    """
    total = len(req.questions)
    correct = 0

    for q, ans in zip(req.questions, req.userAnswers):
        if ans == q.correctIndex:
            correct += 1

    wrong = total - correct if total >= correct else 0
    score_percent = (correct / total * 100.0) if total > 0 else 0.0

    logger.info(
        "ScoreQuiz | total=%d correct=%d wrong=%d percent=%.2f",
        total,
        correct,
        wrong,
        score_percent,
    )

    return ScoreQuizResponse(
        totalQuestions=total,
        correctCount=correct,
        wrongCount=wrong,
        scorePercent=score_percent,
    )
