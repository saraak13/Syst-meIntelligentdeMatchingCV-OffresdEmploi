from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, get_db
import models

from routers import auth, cvs, jobs, matching, applications, chatbot, admin

# Ensure tables are created (Assuming they already exist from your SQL script, but this is safe if they don't)
# We don't want to overwrite your existing tables, so we just let SQLAlchemy know about them.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recruitment Platform API",
    description="FastAPI backend for AI Recruitment Platform",
    version="1.0.0"
)

# Configure CORS to allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"], # Vite / standard React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Recruitment AI API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "database": "connected"}

# Include Routers
app.include_router(auth.router)
app.include_router(cvs.router)
app.include_router(jobs.router)
app.include_router(matching.router)
app.include_router(applications.router)
app.include_router(chatbot.router)
app.include_router(admin.router)

