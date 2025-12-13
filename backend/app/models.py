from typing import List, Optional
from pydantic import BaseModel


class Question(BaseModel):
    id: str
    questionText: str
    options: List[str]
    correctIndex: int
    explanation: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None


class GenerateQuestionsRequest(BaseModel):
    category: str
    difficulty: str
    numQuestions: int
    useAI: bool = True


class GenerateQuestionsResponse(BaseModel):
    source: str  # "ai" or "fallback"
    questions: List[Question]


class ScoreQuizRequest(BaseModel):
    questions: List[Question]
    userAnswers: List[int]


class ScoreQuizResponse(BaseModel):
    totalQuestions: int
    correctCount: int
    wrongCount: int
    scorePercent: float
