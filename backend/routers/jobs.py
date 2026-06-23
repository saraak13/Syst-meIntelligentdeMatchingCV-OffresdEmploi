from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
from utils.parser import offer_to_text, job_skills_text, job_responsibilities_text
from utils.embeddings import generate_embedding
from utils.job_extractor import extract_job_from_text
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import date


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

class JobCreateSchema(BaseModel):
    recruiter_id: uuid.UUID
    title: str
    description: str
    parsed_json: dict
    location: Optional[str] = None
    work_type: Optional[models.WorkType] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = "$"
    requirements: Optional[List[str]] = []
    skills: Optional[List[str]] = []
    experience_level: Optional[str] = None
    education_level: Optional[str] = None
    deadline: Optional[date] = None

class JobExtractSchema(BaseModel):
    recruiter_id: uuid.UUID
    raw_text: str
    position_hint: Optional[str] = "Not specified"
    company_hint: Optional[str] = "Not specified"

@router.post("")
def create_job(data: JobCreateSchema, db: Session = Depends(get_db)):
    # Check if recruiter exists
    recruiter = db.query(models.User).filter(
        models.User.id == data.recruiter_id, 
        models.User.role == models.UserRole.recruiter
    ).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    new_job = models.JobOffer(
        recruiter_id=data.recruiter_id,
        title=data.title,
        description=data.description,
        parsed_json=data.parsed_json,
        location=data.location,
        work_type=data.work_type,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        currency=data.currency,
        requirements=data.requirements,
        skills=data.skills,
        experience_level=data.experience_level,
        education_level=data.education_level,
        deadline=data.deadline,
        status=models.JobStatus.active,
        is_active=True
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # Generate and store embeddings
    embeddings_to_generate = [
        (models.EmbeddingType.title, data.title),
        (models.EmbeddingType.skills, job_skills_text(data.parsed_json)),
        (models.EmbeddingType.experience, job_responsibilities_text(data.parsed_json)),
        (models.EmbeddingType.summary, data.description)
    ]

    for emb_type, text in embeddings_to_generate:
        if text and text.strip():
            vector = generate_embedding(text)
            new_embedding = models.JobEmbedding(
                job_offer_id=new_job.id,
                embedding_type=emb_type,
                chunk_index=0,
                chunk_text=text,
                embedding=vector
            )
            db.add(new_embedding)

    db.commit()

    return {
        "message": "Job offer and embeddings created successfully",
        "job_id": str(new_job.id),
        "parsed_json": data.parsed_json
    }

@router.post("/extract")
def create_job_from_raw_text(data: JobExtractSchema, db: Session = Depends(get_db)):
    """
    Accepts raw job description text, parses it using Groq LLM,
    creates the job offer in PostgreSQL, and generates AI embeddings.
    """
    # 1. Parse raw text using LLM extractor
    parsed_json = extract_job_from_text(
        description=data.raw_text,
        position=data.position_hint,
        company_name=data.company_hint
    )
    if not parsed_json:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse job description via LLM."
        )

    # 2. Extract values and clean
    title = parsed_json.get("position", data.position_hint or "Job Offer")
    location = parsed_json.get("location", "Not specified")
    
    # Map remote policy string to WorkType enum
    remote_policy = str(parsed_json.get("remote_policy", "")).lower()
    work_type = models.WorkType.remote
    if "hybrid" in remote_policy:
        work_type = models.WorkType.hybrid
    elif "onsite" in remote_policy or "on-site" in remote_policy:
        work_type = models.WorkType.onsite
    elif "remote" in remote_policy:
        work_type = models.WorkType.remote
    else:
        work_type = None

    # Clean salary strings to simple numeric range if possible, otherwise default None
    # Let's extract clean numbers for min/max if possible (simplified default to None for text)
    salary_str = str(parsed_json.get("salary", "")).lower()
    salary_min = None
    salary_max = None
    
    skills = parsed_json.get("required_skills", [])
    requirements = parsed_json.get("responsibilities", [])

    # 3. Create job using existing logic
    job_create_data = JobCreateSchema(
        recruiter_id=data.recruiter_id,
        title=title,
        description=data.raw_text,
        parsed_json=parsed_json,
        location=location,
        work_type=work_type,
        salary_min=salary_min,
        salary_max=salary_max,
        requirements=requirements,
        skills=skills,
        experience_level=parsed_json.get("seniority_level", "Not specified"),
        education_level=parsed_json.get("education", "Not specified")
    )

    result = create_job(job_create_data, db)
    return result

@router.get("")
def list_jobs(db: Session = Depends(get_db)):
    return db.query(models.JobOffer).filter(models.JobOffer.is_active == True).all()

@router.get("/recruiter/{recruiter_id}")
def get_recruiter_jobs(recruiter_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(models.JobOffer).filter(
        models.JobOffer.recruiter_id == recruiter_id,
        models.JobOffer.is_active == True
    ).all()

@router.get("/{job_id}")
def get_job(job_id: uuid.UUID, db: Session = Depends(get_db)):
    job = db.query(models.JobOffer).filter(models.JobOffer.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")
    return job


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job_offer(job_id: uuid.UUID, db: Session = Depends(get_db)):
    job = db.query(models.JobOffer).filter(models.JobOffer.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")
    
    # Soft delete: flip the active status flag
    job.is_active = False
    db.commit()
    return {"message": "Job offer successfully deleted"}