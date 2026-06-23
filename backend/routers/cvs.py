from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
from utils.parser import cv_to_text, cv_skills_text, cv_experience_text, cv_projects_text
from utils.embeddings import generate_embedding
from utils.llm_extractor import cv_to_json_llm
from pydantic import BaseModel
import uuid
import tempfile
import os
import shutil

router = APIRouter(prefix="/api/cvs", tags=["CVs"])

class CVCreateSchema(BaseModel):
    user_id: uuid.UUID
    parsed_json: dict
    file_url: str = None

@router.post("")
def create_cv(data: CVCreateSchema, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Deactivate previous active CVs for this user
    db.query(models.CV).filter(
        models.CV.user_id == data.user_id, 
        models.CV.is_active == True
    ).update({models.CV.is_active: False})

    raw_text = cv_to_text(data.parsed_json)

    new_cv = models.CV(
        user_id=data.user_id,
        raw_text=raw_text,
        file_url=data.file_url,
        parsed_json=data.parsed_json,
        is_active=True
    )
    db.add(new_cv)
    db.commit()
    db.refresh(new_cv)

    # Generate and store embeddings
    embeddings_to_generate = [
        (models.EmbeddingType.title, data.parsed_json.get("title", "")),
        (models.EmbeddingType.skills, cv_skills_text(data.parsed_json)),
        (models.EmbeddingType.experience, cv_experience_text(data.parsed_json)),
        (models.EmbeddingType.projects, cv_projects_text(data.parsed_json)),
        (models.EmbeddingType.summary, data.parsed_json.get("summary", data.parsed_json.get("bio", "")))
    ]

    for emb_type, text in embeddings_to_generate:
        if text and text.strip():
            vector = generate_embedding(text)
            new_embedding = models.CVEmbedding(
                cv_id=new_cv.id,
                embedding_type=emb_type,
                chunk_index=0,
                chunk_text=text,
                embedding=vector
            )
            db.add(new_embedding)

    db.commit()

    return {
        "message": "CV and embeddings created successfully",
        "cv_id": str(new_cv.id),
        "parsed_json": data.parsed_json
    }

@router.post("/upload")
async def upload_cv_pdf(
    user_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts a CV PDF file, runs the OCR & LLM extraction pipeline,
    creates the CV in PostgreSQL, and generates AI embeddings.
    """
    # 1. Verify User exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Save Uploaded PDF file to a temp location
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        # 3. Execute OCR & LLM extraction
        parsed_json = cv_to_json_llm(temp_path)
        if not parsed_json:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse CV content via LLM."
            )

        # 4. Save CV and generate embeddings using existing logic
        # Prepare the model structure mapping
        cv_data = CVCreateSchema(
            user_id=user_id,
            parsed_json=parsed_json,
            file_url=file.filename # Save filename as simple file_url for this mock stage
        )
        
        result = create_cv(cv_data, db)
        return result

    finally:
        # Ensure temp file is cleaned up
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/user/{user_id}")
def get_cv_by_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    cv = db.query(models.CV).filter(
        models.CV.user_id == user_id, 
        models.CV.is_active == True
    ).first()
    if not cv:
        raise HTTPException(status_code=404, detail="Active CV not found for this user")
    return cv
