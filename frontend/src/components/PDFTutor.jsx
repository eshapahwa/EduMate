import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveNote } from "@/lib/storage"; // Import the saveNote function
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Enhanced KaTeX + Markdown styling
const customStyles = `
.katex-wrapper {
  overflow-x: auto;
  font-size: 1.1em;
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
.markdown-content {
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.9);
}
.dark .markdown-content {
  color: rgba(255, 255, 255, 0.9);
}
.dark .katex {
  color: #d1d5db;
}
`;

// Helper to render LaTeX in markdown
function MarkdownWithLaTeX({ children }) {
  if (!children) return null;
  
  // Process and ensure proper LaTeX formatting
  let content = children;
  
  // Check if there are LaTeX commands without delimiters and fix them
  if (content.includes("\\begin{") && !content.includes("$$\\begin{")) {
    content = content.replace(/\\begin\{/g, "$$\\begin{");
    content = content.replace(/\\end\{/g, "\\end{$$");
  }
  
  // Process common LaTeX commands to ensure they have delimiters
  const latexCommands = ["\\int", "\\sum", "\\frac", "\\neq", "\\leq", "\\geq", "\\alpha", "\\beta"];
  latexCommands.forEach((cmd) => {
    if (content.includes(cmd) && !content.includes(`$${cmd}`)) {
      const regex = new RegExp(`(?<!\\$)(${cmd}[^$]+?)(?=\\s|$|\\.|\\,|\\)|\\]|\\})`, "g");
      content = content.replace(regex, `$${cmd}$`);
    }
  });

  return (
    <div className="katex-wrapper">
      <div className="markdown-content">
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
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// Recursively find a message by its id in our conversation tree
function findMessageById(messages, id) {
  for (const msg of messages) {
    if (msg.id === id) return msg;
    if (msg.children?.length) {
      const found = findMessageById(msg.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Recursively attach new children to the correct message node
function attachChildMessages(messages, targetId, newMessages) {
  return messages.map((msg) => {
    if (msg.id === targetId) {
      return { ...msg, children: [...(msg.children || []), ...newMessages] };
    }
    if (msg.children?.length) {
      return { ...msg, children: attachChildMessages(msg.children, targetId, newMessages) };
    }
    return msg;
  });
}

export default function PDFTutor() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pdfStatus, setPdfStatus] = useState({ pdf_loaded: false });
  const [activeTab, setActiveTab] = useState("upload");
  
  // For expansion mode
  const [expandParentId, setExpandParentId] = useState(null);
  const [expandText, setExpandText] = useState("");
  
  // Selection menu for highlighting text
  const [selectionMenu, setSelectionMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedText: "",
    parentId: null,
  });
  
  const fileInputRef = useRef(null);
  const responsesEndRef = useRef(null);
  const hasPdfBeenCleared = useRef(false);
  
  // Clear the PDF cache on the backend
  async function clearPdfData() {
    try {
      await fetch("http://127.0.0.1:8000/pdf/clear", {
        method: "POST",
      });
      setPdfStatus({ pdf_loaded: false });
      hasPdfBeenCleared.current = true;
    } catch (error) {
      console.error("Error clearing PDF data:", error);
    }
  }

  // Fetch PDF status on component mount
  useEffect(() => {
    // Clear PDF data when component first mounts
    clearPdfData();
    
    // Return a cleanup function to clear PDF data when unmounting
    return () => {
      clearPdfData();
    };
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    responsesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if a PDF is already loaded
  const checkPdfStatus = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/pdf/status");
      const data = await response.json();
      
      // Only update the status if we've explicitly uploaded a PDF
      // or if there's no PDF loaded
      if (file || !data.pdf_loaded || hasPdfBeenCleared.current) {
        setPdfStatus(data);
      }
    } catch (error) {
      console.error("Error checking PDF status:", error);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setUploadStatus(null);
      } else {
        setUploadStatus({
          success: false,
          message: "Please select a PDF file"
        });
      }
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Upload the PDF file
  const uploadPdf = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/pdf/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        // Clear previous chat when a new PDF is uploaded
        setMessages([]);
        
        // Mark that we've uploaded a PDF
        hasPdfBeenCleared.current = false;
        
        setUploadStatus({
          success: true,
          message: `PDF uploaded successfully!`,
          chunks: data.chunks_created
        });
        checkPdfStatus();
      } else {
        setUploadStatus({
          success: false,
          message: data.detail || "Error uploading PDF"
        });
      }
    } catch (error) {
      setUploadStatus({
        success: false,
        message: "Server error. Please try again."
      });
    } finally {
      setUploading(false);
    }
  };

  // Ask a question about the PDF content
  const askQuestion = async () => {
    if (!question.trim() || !pdfStatus.pdf_loaded) return;
    
    // Exit expand mode if we're in it
    const isExpanding = expandParentId !== null;
    const expandPrompt = isExpanding 
      ? `Context from previous answer: ${expandText}\n\nFollow-up question: ${question}`
      : question;
      
    setLoading(true);

    // Add user message
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: question,
      children: [],
    };
    
    if (isExpanding) {
      // Add as child to the parent message
      setMessages(prev => attachChildMessages(prev, expandParentId, [userMsg]));
    } else {
      // Add as top-level message
      setMessages(prev => [...prev, userMsg]);
    }
    
    const currentQuestion = question;
    setQuestion(""); // Clear input field
    
    try {
      const response = await fetch("http://127.0.0.1:8000/pdf/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: expandPrompt,
          context_chunks: 2
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Create AI response message
        const aiMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: data.response,
          children: [],
        };
        
        if (isExpanding) {
          // Add as child to the parent message
          setMessages(prev => attachChildMessages(prev, expandParentId, [aiMsg]));
          
          // Exit expand mode
          setExpandParentId(null);
          setExpandText("");
        } else {
          // Add as top-level message
          setMessages(prev => [...prev, aiMsg]);
        }
      } else {
        // Add error message
        const errorMsg = {
          id: Date.now() + 1,
          role: "error",
          content: data.detail || "Error getting response",
          children: [],
        };
        
        if (isExpanding) {
          setMessages(prev => attachChildMessages(prev, expandParentId, [errorMsg]));
          setExpandParentId(null);
          setExpandText("");
        } else {
          setMessages(prev => [...prev, errorMsg]);
        }
      }
    } catch (error) {
      console.error("Error asking question:", error);
      const errorMsg = {
        id: Date.now() + 1,
        role: "error",
        content: "Server error. Please try again.",
        children: [],
      };
      
      if (isExpanding) {
        setMessages(prev => attachChildMessages(prev, expandParentId, [errorMsg]));
        setExpandParentId(null);
        setExpandText("");
      } else {
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle mouse up event to show selection menu
  function handleMouseUp(messageId) {
    const selection = document.getSelection();
    if (!selection) return;
    
    const text = selection.toString().trim();
    if (!text) {
      setSelectionMenu(prev => ({ ...prev, visible: false }));
      return;
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position the menu near the selection
    const x = rect.right + window.scrollX;
    const y = rect.top + window.scrollY - 20;
    
    setSelectionMenu({
      visible: true,
      x,
      y,
      selectedText: text,
      parentId: messageId,
    });
  }
  
  // Handle take note action
  function handleTakeNote() {
    if (!selectionMenu.selectedText) return;
    saveNote(selectionMenu.selectedText);
    setSelectionMenu(prev => ({ ...prev, visible: false }));
    alert("Note saved!");
  }
  
  // Handle expand action
  function handleExpand() {
    if (!selectionMenu.selectedText) return;
    
    // Enter expansion mode
    setExpandParentId(selectionMenu.parentId);
    setExpandText(selectionMenu.selectedText);
    setQuestion(""); // Clear input field
    
    // Hide selection menu
    setSelectionMenu(prev => ({ ...prev, visible: false }));
    
    // Switch to chat tab if we're not already there
    setActiveTab("chat");
  }
  
  // Render message and its children recursively
  function renderMessageAndChildren(msg) {
    const isUser = msg.role === "user";
    const isError = msg.role === "error";
    
    return (
      <div key={msg.id} className="w-full">
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-1`}>
          <div
            className={`p-4 rounded-xl max-w-xl w-fit break-words ${
              isUser
                ? "bg-blue-600 text-white"
                : isError
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  : "bg-gray-300 dark:bg-gray-600 dark:text-gray-100 text-black cursor-text"
            }`}
            onMouseUp={() => (!isUser && !isError ? handleMouseUp(msg.id) : null)}
          >
            {isUser || isError ? (
              msg.content
            ) : (
              <MarkdownWithLaTeX>{msg.content}</MarkdownWithLaTeX>
            )}
          </div>
        </div>
        
        {/* Render child messages (expansions) as indented replies */}
        {msg.children && msg.children.length > 0 && (
          <div className="ml-5 pl-2 border-l border-gray-500">
            {msg.children.map(child => renderMessageAndChildren(child))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 space-y-6">
      <style>{customStyles}</style>
      
      <div className="w-full">
        {/* Simple tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload PDF
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat with PDF
          </button>
        </div>
        
        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div className="border p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Upload Educational Materials</h2>
              <p className="text-gray-600 mb-4">
                Upload a PDF to ask questions about its content
              </p>
              
              <div className="flex flex-col space-y-4">
                <input
                  type="file"
                  accept="application/pdf"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div 
                    onClick={handleUploadClick}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer flex-1 flex flex-col items-center justify-center hover:bg-gray-50"
                  >
                    <div className="text-4xl mb-2">📄</div>
                    <p>Select PDF file</p>
                    {file && <p className="text-sm text-gray-500 mt-2">{file.name}</p>}
                  </div>
                  
                  <Button
                    onClick={uploadPdf}
                    disabled={!file || uploading}
                    className="p-4 h-auto flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">📤</span>
                        Upload PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {uploadStatus && (
                <div className={`mt-4 p-4 rounded-lg ${uploadStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-medium">
                    {uploadStatus.success ? '✅ Success' : '❌ Error'}
                  </p>
                  <p>{uploadStatus.message}</p>
                </div>
              )}
              
              {/* Only show this when we've explicitly uploaded a PDF */}
              {pdfStatus.pdf_loaded && !hasPdfBeenCleared.current && (
                <div className="mt-4 p-4 rounded-lg bg-blue-50 text-blue-800">
                  <p className="font-medium">📚 PDF Ready</p>
                  <p>
                    PDF is loaded!
                    Switch to the Chat tab to ask questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="border p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Chat with Your PDF</h2>
              <p className="text-gray-600 mb-4">
                Ask questions about your uploaded educational materials
              </p>
              
              {!pdfStatus.pdf_loaded || hasPdfBeenCleared.current ? (
                <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800">
                  <p className="font-medium">⚠️ No PDF Loaded</p>
                  <p>
                    Please upload a PDF first before asking questions.
                  </p>
                </div>
              ) : (
                <>
                  {/* Conversation Display */}
                  <div className="relative border rounded-md p-4 h-96 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-32">
                        <div className="text-4xl mb-4">📚</div>
                        <p>Ask a question about your PDF to start a conversation</p>
                      </div>
                    ) : (
                      messages.map(msg => renderMessageAndChildren(msg))
                    )}
                    <div ref={responsesEndRef} />
                    
                    {/* Floating selection menu */}
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
                  
                  {/* Question Input */}
                  <div className="flex flex-col space-y-2 mt-4">
                    {/* Show what we're expanding on if in expand mode */}
                    {expandParentId && (
                      <div className="text-sm text-gray-600 mb-2">
                        You're expanding on: <em>{expandText}</em>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={expandParentId 
                          ? "Ask a follow-up question about the selected text..." 
                          : "Ask a question about your PDF..."}
                        className="flex-1 p-2 border rounded-md resize-none"
                        rows={2}
                      />
                      <Button 
                        onClick={askQuestion} 
                        disabled={!question.trim() || loading || !pdfStatus.pdf_loaded || hasPdfBeenCleared.current}
                        className="px-8"
                      >
                        {loading ? "⏳" : "Ask"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}