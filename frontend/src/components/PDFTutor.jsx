import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Assuming this import works
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// KaTeX + Markdown styling (same as in Tutor.jsx)
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

export default function PDFTutor() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState([]);
  const [pdfStatus, setPdfStatus] = useState({ pdf_loaded: false });
  const [activeTab, setActiveTab] = useState("upload");
  
  const fileInputRef = useRef(null);
  const responsesEndRef = useRef(null);

  // Fetch PDF status on component mount
  useEffect(() => {
    checkPdfStatus();
  }, []);

  // Scroll to bottom when new responses are added
  useEffect(() => {
    responsesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  // Check if a PDF is already loaded
  const checkPdfStatus = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/pdf/status");
      const data = await response.json();
      setPdfStatus(data);
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

    setLoading(true);
    
    // Add user question to responses
    const newResponses = [
      ...responses,
      { role: "user", content: question }
    ];
    setResponses(newResponses);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/pdf/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: question,
          context_chunks: 2 // Use 2 chunks by default
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Add AI response to responses
        setResponses([
          ...newResponses,
          { role: "assistant", content: data.response }
        ]);
        setQuestion(""); // Clear input
      } else {
        // Add error message
        setResponses([
          ...newResponses,
          { 
            role: "error", 
            content: data.detail || "Error getting response"
          }
        ]);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      setResponses([
        ...newResponses,
        { 
          role: "error", 
          content: "Server error. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
              
              {pdfStatus.pdf_loaded && (
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
              
              {!pdfStatus.pdf_loaded ? (
                <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800">
                  <p className="font-medium">⚠️ No PDF Loaded</p>
                  <p>
                    Please upload a PDF first before asking questions.
                  </p>
                </div>
              ) : (
                <>
                  {/* Conversation Display */}
                  <div className="border rounded-md p-4 h-96 overflow-y-auto flex flex-col space-y-4 bg-gray-50">
                    {responses.length === 0 ? (
                      <div className="text-center text-gray-500 mt-32">
                        <div className="text-4xl mb-4">📚</div>
                        <p>Ask a question about your PDF to start a conversation</p>
                      </div>
                    ) : (
                      responses.map((msg, index) => (
                        <div 
                          key={index} 
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`p-3 rounded-lg max-w-[80%] ${
                              msg.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : msg.role === 'error'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-200'
                            }`}
                          >
                            {msg.role === 'assistant' ? (
                              <MarkdownWithLaTeX>{msg.content}</MarkdownWithLaTeX>
                            ) : (
                              msg.content
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={responsesEndRef} />
                  </div>
                  
                  {/* Question Input */}
                  <div className="flex space-x-2 mt-4">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about your PDF..."
                      className="flex-1 p-2 border rounded-md resize-none"
                      rows={2}
                    />
                    <Button 
                      onClick={askQuestion} 
                      disabled={!question.trim() || loading || !pdfStatus.pdf_loaded}
                      className="px-8"
                    >
                      {loading ? "⏳" : "Ask"}
                    </Button>
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