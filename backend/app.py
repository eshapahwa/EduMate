import streamlit as st
import requests

st.set_page_config(page_title="EduMate Tutor", layout="centered")

# ---------- 🔧 Custom Styling ----------
st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap');
        html, body, [class*="css"]  {
            font-family: 'DM Sans', sans-serif;
            background: radial-gradient(ellipse at top left, #1e1e2f, #121212);
            color: #f1f1f1;
        }
        .main-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(10px);
            margin-top: 2rem;
        }
        .stButton>button {
            background: linear-gradient(90deg, #00c9ff, #92fe9d);
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 12px;
            font-weight: bold;
            color: black;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .stButton>button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 10px #00c9ff80;
        }
        code {
            background-color: rgba(255,255,255,0.1);
            padding: 4px;
            border-radius: 6px;
        }
        .response-block {
            background-color: rgba(255, 255, 255, 0.07);
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 12px;
            font-size: 1rem;
            white-space: pre-wrap;
        }
    </style>
""", unsafe_allow_html=True)

st.markdown("<div class='main-card'>", unsafe_allow_html=True)

st.title("🎓 EduMate – Your AI Study Buddy")
st.markdown("Ask about **Math**, **Code**, generate **Quizzes** or **Flashcards** – AI’s got you covered.")

# ---------- 🧠 UI Tabs ----------
tab_math, tab_code, tab_quiz, tab_flashcards = st.tabs(["🧮 Math", "💻 Code", "🧪 Quiz", "🎴 Flashcards"])

# ---------- 🧮 Math ----------
with tab_math:
    st.subheader("Solve a Math Problem")
    math_input = st.text_area("✏️ Enter a math problem")
    if st.button("🔍 Solve Math"):
        if math_input:
            res = requests.post("http://127.0.0.1:8000/math", json={"question": math_input})
            st.markdown("### 📘 Response:")
            st.markdown(f"<div class='response-block'>{res.json().get('response', '')}</div>", unsafe_allow_html=True)
        else:
            st.warning("Enter a problem first!")

# ---------- 💻 Code ----------
with tab_code:
    st.subheader("Explain Code")
    code_input = st.text_area("💡 Paste your code snippet here", height=200)
    if st.button("🧠 Explain Code"):
        if code_input:
            res = requests.post("http://127.0.0.1:8000/code", json={"code": code_input})
            st.markdown("### 📘 Response:")
            st.markdown(f"<div class='response-block'>{res.json().get('response', '')}</div>", unsafe_allow_html=True)
        else:
            st.warning("Enter code first!")

# ---------- 🧪 Quiz ----------
with tab_quiz:
    st.subheader("Generate Quiz Questions")
    topic = st.text_input("📚 Topic (e.g. Binary Trees)")
    difficulty = st.selectbox("🎯 Difficulty", ["easy", "medium", "hard"])
    num_questions = st.slider("📝 Number of Questions", 1, 10, 5)
    if st.button("🎲 Generate Quiz"):
        if topic:
            res = requests.post("http://127.0.0.1:8000/quiz", json={
                "topic": topic,
                "difficulty": difficulty,
                "num_questions": num_questions
            })
            st.markdown("### 📘 Quiz Output:")
            st.markdown(f"<div class='response-block'>{res.json().get('response', '')}</div>", unsafe_allow_html=True)
        else:
            st.warning("Enter a topic first!")

# ---------- 🎴 Flashcards ----------
with tab_flashcards:
    st.subheader("Create Flashcards")
    subject = st.text_input("📖 Subject or Topic")
    num_cards = st.slider("🃏 Number of Flashcards", 1, 10, 5)
    if st.button("📇 Generate Flashcards"):
        if subject:
            res = requests.post("http://127.0.0.1:8000/flashcards", json={
                "subject": subject,
                "num_cards": num_cards
            })
            st.markdown("### 📘 Flashcards:")
            st.markdown(f"<div class='response-block'>{res.json().get('response', '')}</div>", unsafe_allow_html=True)
        else:
            st.warning("Enter a subject first!")

st.markdown("</div>", unsafe_allow_html=True)
