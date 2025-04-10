# main.py
from fastapi import FastAPI
from api.routes import router
from api.pdf_routes import pdf_router
import uvicorn

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="EduMate AI Tutor")

# Include existing routers
app.include_router(router)

# Include new PDF router with prefix
app.include_router(pdf_router, prefix="/pdf", tags=["PDF"])

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5173"] for Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)