# core/pdf_processor.py
import os
import tempfile
from typing import List, Dict, Any
import PyPDF2
from fastapi import UploadFile
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class PDFProcessor:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize the PDF processor with chunk size and overlap settings.
        
        Args:
            chunk_size: The approximate size of each text chunk in characters
            chunk_overlap: The overlap between chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.chunks = []
        self.vectorizer = TfidfVectorizer()
        self.document_vectors = None
        
    async def process_pdf(self, file: UploadFile) -> List[str]:
        """
        Process an uploaded PDF file, extracting text and splitting into chunks.
        
        Args:
            file: The uploaded PDF file
        
        Returns:
            List of text chunks from the PDF
        """
        # Create a temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            # Write the uploaded file to the temporary file
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Extract text from PDF
            text = self._extract_text_from_pdf(temp_file_path)
            
            # Split text into chunks
            self.chunks = self._split_text_into_chunks(text)
            
            # Create vectors for similarity search
            self._create_chunk_vectors()
            
            return self.chunks
        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
    
    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text content
        """
        text = ""
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n"
        return text
    
    def _split_text_into_chunks(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: The input text to be split
            
        Returns:
            List of text chunks
        """
        # Split text into paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # Skip empty paragraphs
            if not paragraph.strip():
                continue
                
            # If adding this paragraph exceeds chunk size, save current chunk and start a new one
            if len(current_chunk) + len(paragraph) > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                # If paragraph itself is larger than chunk_size, split it
                if len(paragraph) > self.chunk_size:
                    words = paragraph.split()
                    current_chunk = ""
                    for word in words:
                        if len(current_chunk) + len(word) > self.chunk_size:
                            chunks.append(current_chunk.strip())
                            # Create overlap with previous chunk
                            overlap_text = ' '.join(current_chunk.split()[-self.chunk_overlap//10:])
                            current_chunk = overlap_text + " " + word + " "
                        else:
                            current_chunk += word + " "
                else:
                    # Start new chunk with this paragraph
                    current_chunk = paragraph + "\n\n"
            else:
                # Add paragraph to current chunk
                current_chunk += paragraph + "\n\n"
        
        # Add the last chunk if it has content
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
            
        return chunks
    
    def _create_chunk_vectors(self):
        """Create TF-IDF vectors for all chunks for similarity search."""
        if not self.chunks:
            return
            
        self.document_vectors = self.vectorizer.fit_transform(self.chunks)
    
    def find_relevant_chunks(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find the most relevant chunks for a given query.
        
        Args:
            query: The search query
            top_k: Number of top results to return
            
        Returns:
            List of dictionaries with chunk text and similarity score
        """
        if not self.chunks or self.document_vectors is None:
            return []
            
        # Create vector for the query
        query_vector = self.vectorizer.transform([query])
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vector, self.document_vectors).flatten()
        
        # Get indices of top k results
        top_indices = np.argsort(similarity_scores)[-top_k:][::-1]
        
        # Return the top chunks with their similarity scores
        results = []
        for idx in top_indices:
            results.append({
                "chunk": self.chunks[idx],
                "score": float(similarity_scores[idx])
            })
            
        return results

# Singleton instance to be used across the application
pdf_processor = PDFProcessor()