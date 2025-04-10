import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveNote } from "@/lib/storage";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// KaTeX + Markdown styling
const customStyles = `
.katex-wrapper {
  overflow-x: auto;
}
.math-block {
  display: block;
  text-align: center;
  margin: 1em 0;
}
.katex-display {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5em 0;
}
.katex .msupsub {
  text-align: left;
}
`;

// Helper to render LaTeX in markdown
function MarkdownWithLaTeX({ children }) {
  return (
    <div className="katex-wrapper">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, inline, className, children, ...props }) {
            if (className === "language-math") {
              return <span className="math-block">{children}</span>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

// Simple text => LaTeX transformations
function processText(text) {
  if (!text) return "";
  let processed = text.replace(/\*\*\s*([^*]+)\s*\*\*/g, "**$1**");
  processed = processed.replace(/([a-zA-Z])(\^)([0-9a-zA-Z]+)(?!\$)/g, "$$1$2$3$");
  processed = processed.replace(/([a-zA-Z])\(([a-zA-Z])\)(?!\$)/g, "$$1($2)$");
  processed = processed.replace(/(?<!\$)(\\frac\\{[^{}]+\\}\\{[^{}]+\\})(?!\$)/g, "$$1$");
  processed = processed.replace(/(?<!\$)(\\int[^$]+dx)(?!\$)/g, "$$1$");

  const latexCommands = ["\\neq", "\\leq", "\\geq", "\\alpha", "\\beta", "\\sum", "\\prod"];
  latexCommands.forEach((cmd) => {
    const escapedCmd = cmd.replace(/\\/g, "\\\\");
    const regex = new RegExp(`(?<!\\$)(${escapedCmd})(?!\\$)`, "g");
    processed = processed.replace(regex, "$$1$");
  });

  const dollarCount = (processed.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    processed += "$";
  }
  return processed;
}

// Recursively find a message by its id in our conversation tree
function findMessageById(arr, id) {
  for (const msg of arr) {
    if (msg.id === id) return msg;
    if (msg.children?.length) {
      const found = findMessageById(msg.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Recursively attach new children to the correct message node
function attachChildMessages(arr, targetId, newMessages) {
  return arr.map((msg) => {
    if (msg.id === targetId) {
      return { ...msg, children: [...msg.children, ...newMessages] };
    }
    if (msg.children?.length) {
      return { ...msg, children: attachChildMessages(msg.children, targetId, newMessages) };
    }
    return msg;
  });
}

export default function Tutor() {
  // The entire conversation is stored as `messages`.
  // Each message: { id, role: 'user'|'tutor', text, children: [] }
  const [messages, setMessages] = useState([]);
  
  // Single text area for normal questions or expansions
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  // For expansion mode: if expandParentId is not null, we're in expand mode.
  // expandText stores the originally highlighted text.
  const [expandParentId, setExpandParentId] = useState(null);
  const [expandText, setExpandText] = useState("");

  // Floating selection menu state (buttons remain exactly unchanged)
  const [selectionMenu, setSelectionMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedText: "",
    parentId: null,
  });

  const chatEndRef = useRef(null);

  // Scroll to bottom after new messages are added.
  function scrollToBottom() {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Listen for "highlightExpand" events from child messages.
  useEffect(() => {
    function handleHighlightEvent(e) {
      setSelectionMenu({
        visible: true,
        x: e.detail.x,
        y: e.detail.y,
        selectedText: e.detail.selectedText,
        parentId: e.detail.parentId,
      });
    }
    document.addEventListener("highlightExpand", handleHighlightEvent);
    return () => {
      document.removeEventListener("highlightExpand", handleHighlightEvent);
    };
  }, []);

  // ============ SENDING A MESSAGE ============
  // Works for both normal and expansion modes.
  async function handleSend() {
    if (!userInput.trim()) return;

    if (expandParentId) {
      // ----- EXPANSION MODE -----
      // Immediately add the user's expansion reply as a child of the parent message.
      const userMsg = {
        id: Date.now(),
        role: "user",
        text: userInput,
        children: [],
      };
      setMessages((prev) => attachChildMessages(prev, expandParentId, [userMsg]));

      const inputText = userInput;
      setUserInput(""); // Clear the input after sending

      // Build prompt for LLM, including parent's text, the highlighted text, and the new user query.
      const parentMsg = findMessageById(messages, expandParentId);
      const parentText = parentMsg ? parentMsg.text : "";
      const prompt = `Context:\n${parentText}\n\nSelected text:\n${expandText}\n\nAdditional Query:\n${inputText}`;
      try {
        const res = await fetch("http://127.0.0.1:8000/math", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: prompt }),
        });
        const data = await res.json();
        const tutorMsg = {
          id: Date.now() + 1,
          role: "tutor",
          text: data.response || "No expansion found.",
          children: [],
        };
        // Append tutor's expansion reply as a child of the parent message.
        setMessages((prev) => attachChildMessages(prev, expandParentId, [tutorMsg]));
      } catch (err) {
        console.error(err);
      }
      // Exit expand mode.
      setExpandParentId(null);
      setExpandText("");

      scrollToBottom();
    } else {
      // ----- NORMAL MODE -----
      setLoading(true);
      
      // Insert user's message into the conversation.
      const userMsg = {
        id: Date.now(),
        role: "user",
        text: userInput,
        children: [],
      };
      setMessages((prev) => [...prev, userMsg]);

      const inputText = userInput;
      setUserInput(""); // Clear input

      // LLM call for tutor's reply.
      try {
        const res = await fetch("http://127.0.0.1:8000/math", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: inputText }),
        });
        const data = await res.json();
        const tutorMsg = {
          id: Date.now() + 1,
          role: "tutor",
          text: data.response || "No response.",
          children: [],
        };
        setMessages((prev) => [...prev, tutorMsg]);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
      scrollToBottom();
    }
  }

  // ============ FLOATING MENU (TAKE NOTE / EXPAND) ============
  function handleTakeNote() {
    if (!selectionMenu.selectedText) return;
    saveNote(selectionMenu.selectedText);
    setSelectionMenu((p) => ({ ...p, visible: false }));
    alert("Note saved!");
  }

  function handleExpand() {
    if (!selectionMenu.selectedText) return;
    setSelectionMenu((p) => ({ ...p, visible: false }));

    // Enter expansion mode: store the parent ID and the highlighted text.
    setExpandParentId(selectionMenu.parentId);
    setExpandText(selectionMenu.selectedText);
    // Do not prefill the input—leave it empty so the user can type their query.
    setUserInput("");
  }

  // ============ MOUSE UP IN A MESSAGE ============
  // Show/hide the floating menu (buttons remain unchanged)
  function handleMouseUp(messageId) {
    const selection = document.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (!text) {
      setSelectionMenu((prev) => ({ ...prev, visible: false }));
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position the floating menu such that its top-left corner appears just above the highlighted text.
    const x = rect.right + window.scrollX;
    const y = rect.top + window.scrollY - 20; // subtract 20px to place it above

    setSelectionMenu({
      visible: true,
      x,
      y,
      selectedText: text,
      parentId: messageId,
    });
  }

  // ============ RENDERING THE CONVERSATION RECURSIVELY ============
  function renderMessageAndChildren(msg) {
    const isUser = msg.role === "user";
    return (
      <div key={msg.id}>
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
          <div
            className={`${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-600 dark:text-gray-100 text-black cursor-text"
            } p-4 rounded-xl max-w-xl w-fit break-words`}
            onMouseUp={() => (!isUser ? handleMouseUp(msg.id) : null)}
          >
            {isUser ? msg.text : <MarkdownWithLaTeX>{processText(msg.text)}</MarkdownWithLaTeX>}
          </div>
        </div>
        {/* Render child messages (expansions) as inline replies */}
        <div className="ml-5 pl-2 border-l border-gray-500">
          {msg.children?.map((child) => renderMessageAndChildren(child))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col p-6 space-y-4">
      <style>{customStyles}</style>

      {/* Conversation display: all messages and inline expansions in one scrollable column */}
      <div className="flex flex-col space-y-4 overflow-y-auto max-h-[600px] pb-4">
        {messages.map((m) => renderMessageAndChildren(m))}
        <div ref={chatEndRef} />
      </div>

      {/* If in expand mode, display a note above the text area */}
      {expandParentId && (
        <div className="text-sm text-gray-600 mb-2">
          You’re expanding on: <em>{expandText}</em>
        </div>
      )}

      {/* Single text area for both normal questions and expansion replies */}
      <div className="flex flex-col space-y-2">
        <textarea
          className="w-full p-4 bg-gray-200 dark:bg-gray-400 text-gray-100 rounded-xl border border-gray-700 placeholder-gray-900 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          rows={3}
          placeholder="Enter your question here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={loading}>
            {loading ? "Thinking..." : "Send"}
          </Button>
        </div>
      </div>

      {/* FLOATING MENU for highlighted text actions (buttons remain unchanged) */}
      {selectionMenu.visible && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 flex flex-row"
          style={{
            top: `${selectionMenu.y}px`,
            left: `${selectionMenu.x}px`
          }}
        >
          <Button variant="ghost" size="sm" onClick={handleTakeNote}>
            Take Note
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExpand}>
            Expand
          </Button>
        </div>
      )}
    </div>
  );
}
