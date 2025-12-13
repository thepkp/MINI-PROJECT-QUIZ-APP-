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

# ----------------------------------------------------
# FastAPI app + logging
# ----------------------------------------------------
app = FastAPI(title="AI Quiz Backend")

logger = logging.getLogger("app.main")
logging.basicConfig(level=logging.INFO)

# ----------------------------------------------------
# CORS – allow ALL origins (simple + safe for mini project)
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow requests from anywhere (Netlify, localhost, etc.)
    allow_credentials=False,    # must be False when allow_origins = ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Health check
# ----------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# ----------------------------------------------------
# Generate questions
# ----------------------------------------------------
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
        logger.info("AI mode ON → calling Gemini...")
        try:
            questions = await generate_questions_ai(
                topic=req.category,
                difficulty=req.difficulty,
                num_questions=req.numQuestions,
            )
            source = "ai"
        except Exception as e:
            logger.error("AI generation failed: %r", e)
            logger.info("Falling back to preloaded questions...")
            questions = get_fallback_questions(
                category=req.category,
                difficulty=req.difficulty,
                num_questions=req.numQuestions,
            )
            source = "fallback"
    else:
        logger.info("AI mode OFF → using fallback questions only.")
        questions = get_fallback_questions(
            category=req.category,
            difficulty=req.difficulty,
            num_questions=req.numQuestions,
        )
        source = "fallback"

    logger.info("Question source used for this quiz: %s", source)
    return GenerateQuestionsResponse(source=source, questions=questions)

# ----------------------------------------------------
# Score quiz
# ----------------------------------------------------
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
        "ScoreQuiz | total=%s correct=%s wrong=%s percent=%.2f",
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
