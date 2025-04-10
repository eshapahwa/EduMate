# core/math_solver.py
from sympy import symbols, integrate, sympify
from utils.gemini_helper import ask_llm

def solve_math_problem(question: str) -> str:
    prompt = f"""
You are a helpful math tutor. Solve the following problem step-by-step using proper math rules.
Format all equations using LaTeX. Keep explanations clear and logical. It should not be a broken LaTeX. Everything should be accurate.

Problem: {question}
"""
    return ask_llm(prompt)
