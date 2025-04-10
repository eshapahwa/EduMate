// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { getNotes, deleteNote, getFlashcardSets, deleteFlashcardSet, getQuizzes, deleteQuiz } from "@/lib/storage";
import NoteCard from "@/components/NoteCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [notes, setNotes] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  useEffect(() => {
    loadSavedData();
  }, []);
  
  const loadSavedData = () => {
    setNotes(getNotes());
    setFlashcardSets(getFlashcardSets());
    setQuizzes(getQuizzes());
  };
  
  const handleDeleteNote = (id) => {
    deleteNote(id);
    setNotes(getNotes());
  };
  
  const handleDeleteFlashcardSet = (id) => {
    deleteFlashcardSet(id);
    setFlashcardSets(getFlashcardSets());
  };
  
  const handleDeleteQuiz = (id) => {
    deleteQuiz(id);
    setQuizzes(getQuizzes());
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Tabs defaultValue="notes">
        <TabsList className="flex justify-center mb-6 bg-gray-800 p-2 rounded-xl">
          <TabsTrigger value="notes" className="px-4 py-2 font-medium">
            📓 Notes
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="px-4 py-2 font-medium">
            🎴 Flashcards
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="px-4 py-2 font-medium">
            🧪 Quizzes
          </TabsTrigger>
        </TabsList>
        
        {/* Notes Tab */}
        <TabsContent value="notes">
          <h2 className="text-2xl font-bold mb-6 text-center">📓 Saved Notes</h2>
          {notes.length === 0 ? (
            <p className="text-gray-400 text-center">No notes saved yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {notes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  content={note.content} 
                  onDelete={() => handleDeleteNote(note.id)} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Flashcards Tab */}
        <TabsContent value="flashcards">
          <h2 className="text-2xl font-bold mb-6 text-center">🎴 Saved Flashcard Sets</h2>
          {flashcardSets.length === 0 ? (
            <p className="text-gray-400 text-center">No flashcard sets saved yet.</p>
          ) : (
            <div className="space-y-4">
              {flashcardSets.map((set) => (
                <div 
                  key={set.id} 
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-blue-400">{set.subject}</h3>
                    <span className="text-sm text-gray-400">Saved on {formatDate(set.createdAt)}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-300">{set.cards.length} flashcards in this set</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => {
                        // In a real app, you'd probably want to redirect to the flashcards tab
                        // and load this set for review
                        alert(`This would open the flashcard set "${set.subject}" for review`);
                      }}
                      className="flex-1"
                    >
                      Study this set
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-400 border-red-400 hover:bg-red-900/20"
                      onClick={() => handleDeleteFlashcardSet(set.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          <h2 className="text-2xl font-bold mb-6 text-center">🧪 Saved Quizzes</h2>
          {quizzes.length === 0 ? (
            <p className="text-gray-400 text-center">No quizzes saved yet.</p>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id} 
                  className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-green-400">{quiz.topic}</h3>
                    <span className="text-sm text-gray-400">Saved on {formatDate(quiz.createdAt)}</span>
                  </div>
                  
                  <div className="flex justify-between mb-4">
                    <p className="text-gray-300">
                      <span className="font-semibold capitalize">{quiz.difficulty}</span> difficulty • 
                      {quiz.questions.length} questions
                    </p>
                    
                    <div className="bg-gray-700 px-3 py-1 rounded-lg">
                      <p className="text-sm">
                        Score: <span className="font-bold text-green-400">
                          {quiz.score?.correct || 0}/{quiz.score?.total || quiz.questions.length}
                        </span> 
                        {quiz.score?.percentage ? ` (${quiz.score.percentage}%)` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => {
                        // In a real app, you'd probably want to redirect to the quiz tab
                        // and load this quiz for review
                        alert(`This would open the quiz "${quiz.topic}" for review`);
                      }}
                      className="flex-1"
                    >
                      Review quiz
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-400 border-red-400 hover:bg-red-900/20"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}