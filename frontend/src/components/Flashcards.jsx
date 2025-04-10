// src/components/Flashcards.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveFlashcardSet } from "@/lib/storage";
import { CheckCircle } from "lucide-react";

export default function Flashcards() {
  const [subject, setSubject] = useState("");
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchFlashcards = async () => {
    if (!subject.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, num_cards: 5 }),
      });
      const data = await res.json();
      const lines = data.response.split("Q:").slice(1).map(pair => {
        const [q, a] = pair.split("A:");
        return { q: q?.trim(), a: a?.trim() };
      });
      setCards(lines);
      setCurrent(0);
      setFlipped(false);
      setSaveSuccess(false); // Reset save status when new cards are loaded
    } catch (error) {
      console.error("Error fetching flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    setFlipped(!flipped);
  };

  const handleSaveFlashcards = () => {
    if (cards.length === 0) return;
    
    const result = saveFlashcardSet(subject, cards);
    if (result) {
      setSaveSuccess(true);
      // Reset save success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        placeholder="Subject (e.g. Neural Networks)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <Button 
        onClick={fetchFlashcards} 
        disabled={loading || !subject.trim()}
        className="w-full"
      >
        {loading ? "Generating..." : "Generate Flashcards"}
      </Button>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-300">Generating your flashcards...</p>
        </div>
      )}
      
      {cards.length > 0 && (
        <div className="w-full h-64 perspective-1000 my-8" onClick={flipCard}>
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
            {/* Front Card (Question) */}
            <div className="absolute w-full h-full backface-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-8 rounded-xl shadow-2xl text-center cursor-pointer flex items-center justify-center">
              <p className="text-2xl font-semibold text-white">
                {cards[current].q}
              </p>
            </div>
            
            {/* Back Card (Answer) */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-8 rounded-xl shadow-2xl text-center cursor-pointer flex items-center justify-center">
              <p className="text-2xl font-semibold text-white">
                {cards[current].a}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering card flip
                setCurrent((prev) => Math.max(0, prev - 1));
                setFlipped(false);
              }}
              disabled={current === 0}
              className="px-5"
            >
              ⏮ Prev
            </Button>
            
            <div className="text-center px-4">
              <span className="text-gray-300">
                Card {current + 1} of {cards.length}
              </span>
            </div>
            
            <Button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering card flip
                setCurrent((prev) => Math.min(cards.length - 1, prev + 1));
                setFlipped(false);
              }}
              disabled={current === cards.length - 1}
              className="px-5"
            >
              Next ⏭
            </Button>
          </div>
          
          <Button 
            onClick={handleSaveFlashcards}
            variant="outline"
            className="w-full border-teal-500 text-teal-400 hover:bg-teal-900/20 relative"
            disabled={saveSuccess}
          >
            {saveSuccess ? (
              <span className="flex items-center justify-center">
                <CheckCircle size={18} className="mr-2" /> Saved to My Flashcards
              </span>
            ) : (
              "Save Flashcard Set"
            )}
          </Button>
        </div>
      )}

      {/* CSS for 3D flipping card effect */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}