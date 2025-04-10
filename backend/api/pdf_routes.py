# api/pdf_routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from core.pdf_processor import pdf_processor
from utils.gemini_helper import ask_llm

pdf_router = APIRouter()

class PDFQueryRequest(BaseModel):
    query: str
    context_chunks: int = 2

@pdf_router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF file.
    
    Args:
        file: The PDF file to upload
        
    Returns:
        A message indicating success and the number of chunks created
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        chunks = await pdf_processor.process_pdf(file)
        return {
            "message": f"PDF processed successfully",
            "filename": file.filename,
            "chunks_created": len(chunks),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@pdf_router.post("/query")
async def query_pdf(request: PDFQueryRequest):
    """
    Query the processed PDF content.
    
    Args:
        request: The query and context settings
        
    Returns:
        The response from the LLM with relevant content from the PDF
    """
    if not pdf_processor.chunks:
        raise HTTPException(status_code=400, detail="No PDF has been processed. Please upload a PDF first.")
    
    # Find relevant chunks based on the query
    relevant_chunks = pdf_processor.find_relevant_chunks(request.query, top_k=request.context_chunks)
    
    if not relevant_chunks:
        raise HTTPException(status_code=404, detail="No relevant content found in the PDF")
    
    # Prepare context from relevant chunks
    context = "\n\n---\n\n".join([chunk["chunk"] for chunk in relevant_chunks])
    
    # Build prompt with context
    prompt = f"""
    You are an AI tutor helping a student understand content from their educational materials.
    Use the following context from their PDF to answer their question. If the context doesn't
    contain relevant information, say so and provide general guidance.
    
    CONTEXT FROM PDF:
    {context}
    
    STUDENT QUESTION:
    {request.query}
    
    Provide a comprehensive answer based on the context. Use LaTeX formatting for any mathematical expressions.
    """
    
    try:
        # Call LLM with the prompt
        response = ask_llm(prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@pdf_router.get("/status")
async def pdf_status():
    """
    Get the status of the currently loaded PDF.
    
    Returns:
        Information about the currently loaded PDF
    """
    return {
        "pdf_loaded": len(pdf_processor.chunks) > 0,
        "chunks_available": len(pdf_processor.chunks),
        "status": "active" if len(pdf_processor.chunks) > 0 else "no_pdf"
    }

# In pdf_routes.py
@pdf_router.post("/clear")
async def clear_pdf():
    """
    Clear the currently loaded PDF.
    
    Returns:
        Status message
    """
    pdf_processor.chunks = []
    pdf_processor.document_vectors = None
    return {
        "message": "PDF data cleared",
        "status": "success"
    }