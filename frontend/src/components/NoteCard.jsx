// src/components/NoteCard.jsx
import React from "react";

export default function NoteCard({ content, onDelete }) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-xl mb-4 border border-gray-600 shadow-md">
      <p className="whitespace-pre-wrap text-sm text-gray-200">{content}</p>
      <button
        className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
        onClick={onDelete}
      >
        🗑 Delete
      </button>
    </div>
  );
}
