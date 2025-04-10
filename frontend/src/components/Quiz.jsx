// src/components/Quiz.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveQuiz } from "@/lib/storage";
import { CheckCircle } from "lucide-react";

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5); // Default to 5 questions
  const [questions, setQuestions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showExplanations, setShowExplanations] = useState({});
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchQuiz = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          difficulty,
          num_questions: numQuestions
        }),
      });
      
      const data = await res.json();
      
      // Parse the response to extract questions, options, answers and explanations
      const parsedQuestions = parseQuizQuestions(data.response);
      
      // Filter out malformed questions (those without all required parts)
      const validQuestions = parsedQuestions.filter(q => 
        q.question && 
        q.options.A && q.options.B && q.options.C && q.options.D && 
        q.correctAnswer
      );
      
      if (validQuestions.length === 0) {
        setError("Unable to generate proper quiz questions. Please try again or try a different topic.");
        setQuestions([]);
      } else {
        setQuestions(validQuestions);
        setSubmitted(false);
        setUserAnswers({});
        setShowExplanations({});
        setSaveSuccess(false); // Reset save status when new questions are loaded
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to connect to the quiz service. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const parseQuizQuestions = (text) => {
    // Split by question numbers (Q1., Q2., etc.)
    const questionBlocks = text.split(/Q\d+\./).filter(block => block.trim());
    
    return questionBlocks.map(block => {
      const lines = block.trim().split('\n').map(line => line.trim());
      const questionText = lines[0];
      
      // Extract options
      const options = { A: '', B: '', C: '', D: '' };
      let correctAnswer = '';
      let explanation = '';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('A.')) options.A = line.substring(2).trim();
        else if (line.startsWith('B.')) options.B = line.substring(2).trim();
        else if (line.startsWith('C.')) options.C = line.substring(2).trim();
        else if (line.startsWith('D.')) options.D = line.substring(2).trim();
        else if (line.startsWith('Correct Answer:')) {
          // Extract just the letter
          const match = line.match(/Correct Answer:\s*([A-D])/);
          correctAnswer = match ? match[1] : '';
        }
        else if (line.startsWith('Explanation:')) {
          explanation = line.substring('Explanation:'.length).trim();
          // If explanation spans multiple lines, collect them
          while (i+1 < lines.length && !lines[i+1].startsWith('A.') && 
                 !lines[i+1].startsWith('B.') && !lines[i+1].startsWith('C.') && 
                 !lines[i+1].startsWith('D.') && !lines[i+1].startsWith('Correct Answer:')) {
            explanation += ' ' + lines[i+1].trim();
            i++;
          }
        }
      }
      
      return {
        question: questionText,
        options,
        correctAnswer,
        explanation
      };
    });
  };

  const handleAnswer = (qIndex, option) => {
    setUserAnswers({ ...userAnswers, [qIndex]: option });
  };

  const toggleExplanation = (qIndex) => {
    setShowExplanations(prev => ({
      ...prev,
      [qIndex]: !prev[qIndex]
    }));
  };

  const handleSaveQuiz = () => {
    if (questions.length === 0) return;
    
    const result = saveQuiz(topic, difficulty, questions, userAnswers);
    if (result) {
      setSaveSuccess(true);
      // Reset save success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Count how many questions have been answered
  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  // Calculate score for submitted quiz
  const correctCount = submitted ? 
    Object.keys(userAnswers).filter(idx => userAnswers[idx] === questions[idx].correctAnswer).length : 0;

  return (
    <div className="space-y-6 p-6">
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        placeholder="Topic (e.g. Dynamic Programming)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        
        <div className="flex items-center">
          <label className="mr-3 text-gray-300">Questions:</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
          />
        </div>
      </div>
      
      <Button 
        onClick={fetchQuiz} 
        disabled={loading || !topic.trim()}
        className="w-full"
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </Button>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-300">Generating your quiz questions...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {questions.map((q, idx) => {
        const userChoice = userAnswers[idx];
        const isCorrect = submitted && userChoice === q.correctAnswer;
        
        return (
          <div key={idx} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mt-4">
            <p className="mb-4 font-semibold text-gray-100">Q{idx + 1}. {q.question}</p>
            
            {['A', 'B', 'C', 'D'].map(opt => (
              <div key={opt} className="mb-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value={opt}
                    disabled={submitted}
                    checked={userAnswers[idx] === opt}
                    onChange={() => handleAnswer(idx, opt)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className={`
                    ${submitted && userChoice === opt 
                      ? (isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold") 
                      : "text-gray-300"}
                    ${submitted && opt === q.correctAnswer && userChoice !== opt ? "text-green-400" : ""}
                  `}>
                    {opt}. {q.options[opt]}
                  </span>
                </label>
              </div>
            ))}
            
            {submitted && (
              <div className="mt-4 space-y-2">
                <div className="text-sm text-gray-100">
                  ✅ Correct: <strong>{q.correctAnswer}</strong>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleExplanation(idx)}
                  className="text-gray-300 border-gray-600 hover:bg-gray-700"
                >
                  {showExplanations[idx] ? "Hide Explanation" : "Show Explanation"}
                </Button>
                
                {showExplanations[idx] && (
                  <div className="mt-2 p-3 bg-gray-700 rounded-lg text-gray-200 text-sm">
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {questions.length > 0 && !submitted && (
        <div className="mt-4 space-y-4">
          {unansweredCount > 0 && (
            <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 p-3 rounded-lg">
              {unansweredCount} question{unansweredCount !== 1 ? 's' : ''} unanswered
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => setSubmitted(true)}
              className="flex-1"
            >
              Submit Quiz
            </Button>
            
            {unansweredCount > 0 && (
              <Button 
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to skip the remaining questions? Unanswered questions will be marked as incorrect.")) {
                    setSubmitted(true);
                  }
                }}
                className="flex-1 border-yellow-600 text-yellow-300 hover:bg-yellow-900/20"
              >
                Submit with {unansweredCount} Unanswered
              </Button>
            )}
          </div>
        </div>
      )}
      
      {submitted && questions.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-xl text-center mt-4 space-y-4">
          <p className="text-xl font-bold mb-2">
            Your Score: {correctCount} / {questions.length}
          </p>
          {unansweredCount > 0 && (
            <p className="text-sm text-yellow-300 mb-3">
              {unansweredCount} question{unansweredCount !== 1 ? 's were' : ' was'} left unanswered
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => {
                setSubmitted(false);
                setUserAnswers({});
                setShowExplanations({});
              }}
              variant="outline"
              className="flex-1"
            >
              Retry Quiz
            </Button>
            
            <Button 
              onClick={handleSaveQuiz}
              variant="outline"
              className="flex-1 border-teal-500 text-teal-400 hover:bg-teal-900/20"
              disabled={saveSuccess}
            >
              {saveSuccess ? (
                <span className="flex items-center justify-center">
                  <CheckCircle size={18} className="mr-2" /> Saved
                </span>
              ) : (
                "Save Quiz Results"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}