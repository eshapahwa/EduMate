# core/quiz_generator.py
from utils.gemini_helper import ask_llm

def generate_quiz(topic: str, difficulty: str = "medium", num_questions: int = 5) -> str:
    prompt = f"""
You are a helpful AI tutor. Generate {num_questions} multiple choice questions on the topic "{topic}" with {difficulty} difficulty.

Format each question like this:
Q1. [Question text]  
A. Option 1  
B. Option 2  
C. Option 3  
D. Option 4  
Correct Answer: [Letter]  
Explanation: [Short explanation]

Ensure variety and clarity.
"""
    return ask_llm(prompt)
