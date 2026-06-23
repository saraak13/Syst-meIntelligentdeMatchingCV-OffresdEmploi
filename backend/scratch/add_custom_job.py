import sys
import os
import uuid
from datetime import datetime

# Add the parent directory to the Python path to resolve backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
import models
from utils.embeddings import generate_embedding

def add_job():
    print("[INFO] Starting addition of Junior AI & Data Engineer job offer...")
    db = next(database.get_db())

    # 1. Ensure a default recruiter exists
    recruiter = db.query(models.User).filter(models.User.role == models.UserRole.recruiter).first()
    if not recruiter:
        print("[INFO] Creating a default recruiter user...")
        recruiter = models.User(
            id=uuid.uuid4(),
            first_name="Alice",
            last_name="Recruiter",
            email="recruiter@recruit.ai",
            password_hash="pbkdf2_sha256$260000$mockedpasswordhash",
            role=models.UserRole.recruiter,
            location="Paris, France",
            company="NovaMind Technologies"
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)
    
    # Update recruiter company name to match this custom job offer!
    recruiter.company = "NovaMind Technologies"
    db.commit()

    # 2. Parse details
    job_id = uuid.uuid4()
    title = "Junior AI & Data Engineer"
    description = (
        "We are looking for a Junior AI & Data Engineer passionate about machine learning, "
        "NLP, and scalable data systems. The candidate will work on AI-powered applications, "
        "semantic search pipelines, data processing workflows, and full-stack integrations for intelligent platforms."
    )
    location = "Casablanca, Morocco"
    
    skills = [
        "Python", "SQL", "FastAPI", "Flask", "React", "Node.js", 
        "PostgreSQL", "MongoDB", "Docker", "Git", "Linux", "Machine Learning", 
        "NLP", "REST API", "Vector Databases", "RAG Architecture", 
        "OpenAI APIs", "Spark", "Kafka", "Airflow", "Power BI", "Azure", "GCP"
    ]
    
    requirements = [
        "Degree in Computer Engineering, Data Engineering, Artificial Intelligence, or Computer Science",
        "Autonomy, Communication, Adaptability, Team Spirit, Problem Solving",
        "Required languages: French, English"
    ]

    job_data_json = {
        "title": title,
        "company": "NovaMind Technologies",
        "location": location,
        "employment_type": "Internship to Full-Time",
        "remote_policy": "Hybrid",
        "experience_level": "Junior",
        "salary_range": "8000 - 12000 MAD",
        "description": description,
        "responsibilities": [
            "Develop AI-powered applications using Python and modern ML frameworks",
            "Build and optimize semantic search and vector-based retrieval pipelines",
            "Design and maintain REST APIs using FastAPI or Flask",
            "Implement data processing and automation workflows",
            "Collaborate with frontend developers using React and Node.js",
            "Create dashboards and analytics reports using Power BI",
            "Work with PostgreSQL and NoSQL databases",
            "Participate in deployment and CI/CD processes"
        ],
        "required_skills": [
            "Python", "SQL", "FastAPI", "Flask", "React", "Node.js", 
            "PostgreSQL", "MongoDB", "Docker", "Git", "Linux", "Machine Learning", 
            "NLP", "REST API"
        ],
        "preferred_skills": [
            "Vector Databases", "RAG Architecture", "OpenAI APIs", "Spark", 
            "Kafka", "Airflow", "Power BI", "Azure", "GCP"
        ],
        "education_requirements": [
            "Computer Engineering", "Data Engineering", "Artificial Intelligence", "Computer Science"
        ],
        "languages_required": [
            "French", "English"
        ],
        "soft_skills": [
            "Autonomy", "Communication", "Adaptability", "Team Spirit", "Problem Solving"
        ],
        "technologies": {
            "backend": ["FastAPI", "Flask", "Node.js"],
            "frontend": ["React"],
            "databases": ["PostgreSQL", "MongoDB", "ChromaDB"],
            "cloud_devops": ["Docker", "CI/CD", "Azure", "GCP"],
            "big_data": ["Spark", "Kafka", "Airflow"]
        },
        "keywords": [
            "AI", "Machine Learning", "Semantic Search", "RAG", 
            "Vector Database", "NLP", "Data Pipeline", "Power BI", "REST API"
        ],
        "posted_at": "2026-05-19T12:00:00Z",
        "status": "active"
    }

    # 3. Insert Job Offer
    new_job = models.JobOffer(
        id=job_id,
        recruiter_id=recruiter.id,
        title=title,
        description=description,
        parsed_json=job_data_json,
        location=location,
        work_type=models.WorkType.hybrid,
        skills=skills,
        requirements=requirements,
        status=models.JobStatus.active,
        is_active=True
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    print(f"[SUCCESS] Job offer inserted successfully! ID: {new_job.id}")

    # 4. Generate embeddings for AI matching
    print("[INFO] Generating semantic vector embeddings for AI matching...")
    
    # Title Embedding
    title_vector = generate_embedding(title)
    title_emb = models.JobEmbedding(
        job_offer_id=new_job.id,
        embedding_type=models.EmbeddingTypeEnum.title,
        chunk_index=0,
        chunk_text=title,
        embedding=title_vector
    )
    db.add(title_emb)

    # Skills Embedding
    skills_text = "\n".join(skills)
    skills_vector = generate_embedding(skills_text)
    skills_emb = models.JobEmbedding(
        job_offer_id=new_job.id,
        embedding_type=models.EmbeddingTypeEnum.skills,
        chunk_index=0,
        chunk_text=skills_text,
        embedding=skills_vector
    )
    db.add(skills_emb)
    
    db.commit()
    print("[SUCCESS] Semantic embeddings generated and stored! This job is now active in matching.")

if __name__ == "__main__":
    add_job()
