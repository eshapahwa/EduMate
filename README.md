# 🚀 EduMate – Local Setup Guide

Follow these steps to set up the project locally and get it running.

---

## 📦 Clone the Repository

```bash
git clone https://github.com/eshapahwa/EduMate.git
cd EduMate
```

---

## 🐍 Set Up Python Environment

Make sure you have [conda](https://docs.conda.io/en/latest/) installed.

```bash
conda create -n edumate-env python=3.9
conda activate edumate-env
```

---

## 📚 Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## 🌐 Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## 🔐 Set Up Environment Variables

Create a `.env` file in the project root and add your Gemini API key:

```
GEMINI_API_KEY=your-api-key-here
```

---

## 🚴 Run the App

### ▶️ Start the Backend

```bash
uvicorn main:app --reload
```

### ▶️ Start the Frontend

```bash
cd frontend
npm run dev
```

---

You're all set! 🎉 Happy hacking!
