// src/lib/storage.js
// Utility functions for local storage management

// Get items from localStorage with default fallback
const getStorageItem = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Set items to localStorage with error handling
const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

// Notes storage
export const saveNote = (text) => {
  const notes = getStorageItem('edumate_notes');
  const newNote = {
    id: Date.now(),
    content: text,
    createdAt: new Date().toISOString(),
  };
  notes.push(newNote);
  return setStorageItem('edumate_notes', notes);
};

export const getNotes = () => {
  return getStorageItem('edumate_notes');
};

export const deleteNote = (id) => {
  const notes = getStorageItem('edumate_notes');
  const filteredNotes = notes.filter(note => note.id !== id);
  return setStorageItem('edumate_notes', filteredNotes);
};

// Flashcards storage
export const saveFlashcardSet = (subject, cards) => {
  const flashcardSets = getStorageItem('edumate_flashcards');
  const newSet = {
    id: Date.now(),
    subject,
    cards,
    createdAt: new Date().toISOString(),
  };
  flashcardSets.push(newSet);
  return setStorageItem('edumate_flashcards', flashcardSets);
};

export const getFlashcardSets = () => {
  return getStorageItem('edumate_flashcards');
};

export const getFlashcardSet = (id) => {
  const sets = getStorageItem('edumate_flashcards');
  return sets.find(set => set.id === id);
};

export const deleteFlashcardSet = (id) => {
  const sets = getStorageItem('edumate_flashcards');
  const filteredSets = sets.filter(set => set.id !== id);
  return setStorageItem('edumate_flashcards', filteredSets);
};

// Quiz storage
export const saveQuiz = (topic, difficulty, questions, userAnswers = {}) => {
  const quizzes = getStorageItem('edumate_quizzes');
  const newQuiz = {
    id: Date.now(),
    topic,
    difficulty,
    questions,
    userAnswers,
    createdAt: new Date().toISOString(),
    score: calculateScore(questions, userAnswers)
  };
  quizzes.push(newQuiz);
  return setStorageItem('edumate_quizzes', quizzes);
};

// Helper to calculate quiz score
const calculateScore = (questions, userAnswers) => {
  if (!questions || !questions.length) return 0;
  
  let correct = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswer) {
      correct++;
    }
  });
  
  return {
    correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100)
  };
};

export const getQuizzes = () => {
  return getStorageItem('edumate_quizzes');
};

export const getQuiz = (id) => {
  const quizzes = getStorageItem('edumate_quizzes');
  return quizzes.find(quiz => quiz.id === id);
};

export const deleteQuiz = (id) => {
  const quizzes = getStorageItem('edumate_quizzes');
  const filteredQuizzes = quizzes.filter(quiz => quiz.id !== id);
  return setStorageItem('edumate_quizzes', filteredQuizzes);
};