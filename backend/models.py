import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, Integer, Numeric, Date, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base

# --- Enums ---
import enum

class UserRole(enum.Enum):
    candidate = "candidate"
    recruiter = "recruiter"
    admin = "admin"

class WorkType(enum.Enum):
    remote = "remote"
    onsite = "onsite"
    hybrid = "hybrid"

class JobStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    closed = "closed"

class EmbeddingType(enum.Enum):
    skills = "skills"
    experience = "experience"
    projects = "projects"
    title = "title"
    summary = "summary"

class MessageRole(enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

# --- Tables ---

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(30), nullable=True)
    password_hash = Column(Text, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    avatar_url = Column(Text, nullable=True)
    company = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    # 📸 Added this column to store the FaceID portrait file links!
    profile_photo_path = Column(String(255), nullable=True)  
    created_at = Column(DateTime, default=datetime.utcnow)

    cvs = relationship("CV", back_populates="user", cascade="all, delete-orphan")
    job_offers = relationship("JobOffer", back_populates="recruiter", cascade="all, delete-orphan")

class CV(Base):
    __tablename__ = "cvs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=False)
    file_url = Column(Text, nullable=True)
    parsed_json = Column(JSONB, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cvs")
    embeddings = relationship("CVEmbedding", back_populates="cv", cascade="all, delete-orphan")

class JobOffer(Base):
    __tablename__ = "job_offers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    parsed_json = Column(JSONB, nullable=True)
    location = Column(String(255), nullable=True)
    work_type = Column(Enum(WorkType), nullable=True)
    salary_min = Column(Numeric, nullable=True)
    salary_max = Column(Numeric, nullable=True)
    currency = Column(String(10), default="EUR")
    requirements = Column(ARRAY(Text), nullable=True)
    skills = Column(ARRAY(Text), nullable=True)
    experience_level = Column(String(100), nullable=True)
    education_level = Column(String(255), nullable=True)
    applicants_count = Column(Integer, default=0)
    status = Column(Enum(JobStatus), default=JobStatus.active)
    is_active = Column(Boolean, default=True)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    recruiter = relationship("User", back_populates="job_offers")
    embeddings = relationship("JobEmbedding", back_populates="job_offer", cascade="all, delete-orphan")

class CVEmbedding(Base):
    __tablename__ = "cv_embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cv_id = Column(UUID(as_uuid=True), ForeignKey("cvs.id", ondelete="CASCADE"), nullable=False)
    embedding_type = Column(Enum(EmbeddingType), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=False) # Maps to Ollama's 768-dim models
    embedding_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cv = relationship("CV", back_populates="embeddings")

class JobEmbedding(Base):
    __tablename__ = "job_embeddings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_offer_id = Column(UUID(as_uuid=True), ForeignKey("job_offers.id", ondelete="CASCADE"), nullable=False)
    embedding_type = Column(Enum(EmbeddingType), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=False) # Maps to Ollama's 768-dim models
    embedding_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_offer = relationship("JobOffer", back_populates="embeddings")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_offer_id = Column(UUID(as_uuid=True), ForeignKey("job_offers.id", ondelete="CASCADE"), nullable=False)
    cv_id = Column(UUID(as_uuid=True), ForeignKey("cvs.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="pending")
    cover_letter = Column(Text, nullable=True)
    recruiter_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(MessageRole), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")