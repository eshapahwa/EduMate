# api/schema.py
from pydantic import BaseModel

class MathQuery(BaseModel):
    question: str

class QuizQuery(BaseModel):
    topic: str
    difficulty: str = "medium"
    num_questions: int = 5

class FlashcardQuery(BaseModel):
    subject: str
    num_cards: int = 5
