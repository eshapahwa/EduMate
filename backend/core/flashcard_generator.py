# core/flashcard_generator.py
from utils.gemini_helper import ask_llm

def generate_flashcards(subject: str, num_cards: int = 5) -> str:
    prompt = f"""
Generate {num_cards} flashcards for learning "{subject}". Format each card like:

Q: [Short question]  
A: [Concise answer]

Keep them useful for spaced repetition and review. Avoid long explanations.
"""
    return ask_llm(prompt)
