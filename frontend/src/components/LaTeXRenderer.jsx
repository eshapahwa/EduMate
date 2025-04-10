// src/components/LaTeXRenderer.jsx
import React from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

export default function LaTeXRenderer({ expression }) {
  return (
    <div className="bg-gray-900 border border-gray-700 shadow-lg p-4 rounded-xl mx-auto my-4">
      <BlockMath>{expression}</BlockMath>
    </div>
  );
}
