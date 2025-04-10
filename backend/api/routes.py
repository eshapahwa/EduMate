# api/routes.py
from fastapi import APIRouter
from core.math_solver import solve_math_problem
from core.quiz_generator import generate_quiz
from core.flashcard_generator import generate_flashcards
from api.schema import MathQuery, QuizQuery, FlashcardQuery

router = APIRouter()

@router.post("/math")
def math_endpoint(query: MathQuery):
    try:
        return {"response": solve_math_problem(query.question)}
    except Exception as e:
        return {"error": str(e)}

@router.post("/quiz")
def quiz_endpoint(query: QuizQuery):
    try:
        return {"response": generate_quiz(query.topic, query.difficulty, query.num_questions)}
    except Exception as e:
        return {"error": str(e)}

@router.post("/flashcards")
def flashcards_endpoint(query: FlashcardQuery):
    try:
        return {"response": generate_flashcards(query.subject, query.num_cards)}
    except Exception as e:
        return {"error": str(e)}
