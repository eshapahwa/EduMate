# api/pdf_schema.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class PDFQueryRequest(BaseModel):
    """Schema for querying PDF content"""
    query: str = Field(..., description="The user's question or query")
    context_chunks: int = Field(2, description="Number of most relevant chunks to include in context")

class PDFChunk(BaseModel):
    """Schema for a single PDF chunk with similarity score"""
    chunk: str = Field(..., description="Text content of the chunk")
    score: float = Field(..., description="Similarity score between 0-1")

class PDFQueryResponse(BaseModel):
    """Schema for the response to a PDF query"""
    response: str = Field(..., description="The AI-generated response")
    source_chunks: Optional[List[PDFChunk]] = Field(None, description="Source chunks used for the response")

class PDFUploadResponse(BaseModel):
    """Schema for the response to a PDF upload"""
    message: str
    filename: str
    chunks_created: int
    status: str

class PDFStatusResponse(BaseModel):
    """Schema for checking PDF processing status"""
    pdf_loaded: bool
    chunks_available: int
    status: str