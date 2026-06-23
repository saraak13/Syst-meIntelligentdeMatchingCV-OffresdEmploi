import sys
import os
import uuid
from datetime import datetime

# Add the parent directory to the Python path to resolve backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
import models
from utils.embeddings import generate_embedding

def seed_database():
    print("[INFO] Starting the AI Job Offer Seeder...")
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
            company="Tech SaaS Innovations"
        )
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)
        print(f"[SUCCESS] Recruiter created: {recruiter.email} (ID: {recruiter.id})")
    else:
        print(f"[INFO] Using existing recruiter: {recruiter.email} (ID: {recruiter.id})")

    # 2. Define the 5 high-quality job offers
    jobs_data = [
        {
            "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
            "title": "Senior Full-Stack Python Developer",
            "description": "We are looking for a Senior Full-Stack Developer to lead our core product development. You will build highly scalable FastAPI backend services and modular React frontend web applications.",
            "location": "Paris, France",
            "work_type": models.WorkType.remote,
            "skills": ["Python", "React", "FastAPI", "PostgreSQL", "SQLAlchemy", "TypeScript"],
            "requirements": ["5+ years of experience with Python & React", "Experience building REST APIs with FastAPI/Django", "Strong knowledge of PostgreSQL and SQLAlchemy"]
        },
        {
            "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
            "title": "Machine Learning Engineer (NLP & LLMs)",
            "description": "Join our AI team to build semantic search engines and agentic LLM pipelines. You will optimize local vector search, design custom fine-tuned transformer architectures, and embed models.",
            "location": "Casablanca, Morocco",
            "work_type": models.WorkType.hybrid,
            "skills": ["Python", "PyTorch", "HuggingFace", "Transformers", "Vector Databases", "NLP"],
            "requirements": ["Experience with PyTorch, HuggingFace, and transformers", "Solid knowledge of Vector Databases and embeddings", "Python expert"]
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "title": "DevOps Cloud Engineer",
            "description": "Responsible for deploying and maintaining our automated pipelines, Kubernetes clusters, and multi-tenant AWS architecture. Experience with infrastructure-as-code is a must.",
            "location": "Remote",
            "work_type": models.WorkType.remote,
            "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Linux"],
            "requirements": ["Strong background in AWS Cloud infrastructure", "Deep expertise in Docker and Kubernetes Orchestration", "CI/CD pipeline automation"]
        },
        {
            "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
            "title": "Frontend Developer (React & TailwindCSS)",
            "description": "We are seeking a Frontend Developer passionate about building high-fidelity interactive user interfaces, modular dashboards, and fluid state-driven custom components.",
            "location": "Paris, France",
            "work_type": models.WorkType.onsite,
            "skills": ["React", "TypeScript", "TailwindCSS", "CSS", "HTML5", "Next.js"],
            "requirements": ["3+ years of experience with React & TypeScript", "Advanced mastery of TailwindCSS and CSS animations", "Experience with state management libraries"]
        },
        {
            "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
            "title": "Data Scientist",
            "description": "Analyze large-scale transactional datasets, engineer advanced features, and build regression, classification, and time-series predictive models to extract actionable business insights.",
            "location": "Paris, France",
            "work_type": models.WorkType.hybrid,
            "skills": ["Python", "Pandas", "Scikit-Learn", "SQL", "Data Analytics", "Statistics"],
            "requirements": ["Mastery of Python libraries (Pandas, Scikit-Learn, NumPy)", "Strong experience in SQL data retrieval and querying", "Background in statistics and probability"]
        }
    ]

    for job in jobs_data:
        # Check if the job offer already exists
        existing_job = db.query(models.JobOffer).filter(models.JobOffer.id == job["id"]).first()
        if existing_job:
            print(f"[INFO] Job offer '{job['title']}' already exists. Deleting it to re-insert clean embeddings...")
            db.delete(existing_job)
            db.commit()

        print(f"[INFO] Seeding Job Offer: {job['title']}...")
        new_job = models.JobOffer(
            id=job["id"],
            recruiter_id=recruiter.id,
            title=job["title"],
            description=job["description"],
            location=job["location"],
            work_type=job["work_type"],
            skills=job["skills"],
            requirements=job["requirements"],
            status=models.JobStatus.active,
            is_active=True
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        # 3. Generate REAL 768-dimensional AI embeddings for Title and Skills
        print(f"   [INFO] Generating real vector embeddings for '{job['title']}'...")
        
        # Embedding for Job Title
        title_vector = generate_embedding(job["title"])
        title_emb = models.JobEmbedding(
            job_offer_id=new_job.id,
            embedding_type=models.EmbeddingTypeEnum.title,
            chunk_index=0,
            chunk_text=job["title"],
            embedding=title_vector
        )
        db.add(title_emb)

        # Embedding for Job Skills (formatted as line-separated list)
        skills_text = "\n".join(job["skills"])
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

    print("\n[SUCCESS] The database has been successfully seeded with realistic, FULLY-EMBEDDED job offers!")
    print("[SUCCESS] You are ready to test your AI semantic weighted matching system in the browser!")

if __name__ == "__main__":
    seed_database()
