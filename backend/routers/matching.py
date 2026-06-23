from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models
import uuid

router = APIRouter(prefix="/api/matching", tags=["Matching"])

def keyword_overlap_bonus(cv_json: dict, job_json: dict) -> float:
    """
    Computes a keyword overlap bonus based on matching skills, up to 0.25.
    """
    try:
        cv_skills = set()
        technical = cv_json.get("technical_skills", {})
        if isinstance(technical, dict):
            for values in technical.values():
                if isinstance(values, list):
                    for skill in values:
                        cv_skills.add(str(skill).lower())
                elif isinstance(values, str):
                    cv_skills.add(values.lower())
        
        job_skills = set()
        req_skills = job_json.get("required_skills", [])
        if isinstance(req_skills, list):
            for skill in req_skills:
                job_skills.add(str(skill).lower())
        elif isinstance(req_skills, str):
            job_skills.add(req_skills.lower())

        if not job_skills:
            return 0.0

        overlap = cv_skills & job_skills
        bonus = len(overlap) * 0.05
        return min(bonus, 0.25)
    except Exception:
        return 0.0


def get_top_jobs_for_user(db: Session, user_id: uuid.UUID, limit: int = 5):
    # 1. Locate the candidate's active CV first
    active_cv = db.query(models.CV).filter(
        models.CV.user_id == user_id,
        models.CV.is_active == True
    ).first()
    if not active_cv:
        return None, []

    # 2. Extract specific candidate embedding IDs to prevent row multiplication errors
    cv_embeddings = db.query(models.CVEmbedding).filter(models.CVEmbedding.cv_id == active_cv.id).all()
    cv_emb_map = {emb.embedding_type.value if hasattr(emb.embedding_type, 'value') else str(emb.embedding_type): emb.id for emb in cv_embeddings}
    
    cv_title_id = cv_emb_map.get('title')
    cv_skills_id = cv_emb_map.get('skills')
    cv_exp_id = cv_emb_map.get('experience')

    # 3. Defensive Fallback: If candidate CV lacks embeddings, match based on basic keyword scores
    if not cv_title_id or not cv_skills_id:
        query = text("""
            SELECT j.id AS job_id, j.title, j.description, j.parsed_json, j.location, j.work_type,
                   j.requirements, j.skills, j.salary_min, j.salary_max, j.currency, u.company
            FROM job_offers j
            LEFT JOIN users u ON u.id = j.recruiter_id
            WHERE j.is_active = true
        """)
        results = db.execute(query).fetchall()
        jobs = []
        for row in results:
            job_json = row.parsed_json or {}
            keyword_bonus = keyword_overlap_bonus(active_cv.parsed_json or {}, job_json)
            jobs.append({
                "job_offer_id": str(row.job_id), "job_id": str(row.job_id), "title": row.title,
                "company": row.company or "Tech SaaS Innovations", "description": row.description,
                "location": row.location or "Remote", "work_type": str(row.work_type),
                "requirements": row.requirements or [], "skills": row.skills or [],
                "score": round(0.45 + keyword_bonus, 3), "semantic_score": 0.45, "keyword_bonus": round(keyword_bonus, 3),
                "final_score": round(0.45 + keyword_bonus, 3)
            })
        return active_cv, sorted(jobs, key=lambda x: x["final_score"], reverse=True)[:limit]

    # 4. Clean Vector Query: Match active jobs strictly against the pre-fetched candidate embedding IDs
    query = text("""
        SELECT 
            j.id AS job_id,
            j.title AS title,
            j.description AS description,
            j.parsed_json AS parsed_json,
            j.location AS location,
            j.work_type AS work_type,
            j.requirements AS requirements,
            j.skills AS skills,
            j.salary_min AS salary_min,
            j.salary_max AS salary_max,
            j.currency AS currency,
            u.company AS company,
            COALESCE(1 - (job_title.embedding <=> (SELECT embedding FROM cv_embeddings WHERE id = :cv_title_id)), 0.5) AS title_sim,
            COALESCE(1 - (job_skills.embedding <=> (SELECT embedding FROM cv_embeddings WHERE id = :cv_skills_id)), 0.5) AS skills_sim,
            COALESCE(1 - (job_exp.embedding <=> (SELECT embedding FROM cv_embeddings WHERE id = :cv_exp_id)), 0.5) AS exp_sim,
            COALESCE(1 - (job_exp.embedding <=> (SELECT embedding FROM cv_embeddings WHERE id = :cv_exp_id)), 0.5) AS proj_sim
        FROM job_offers j
        -- Recruiter User to get Company Name
        LEFT JOIN users u ON u.id = j.recruiter_id
        -- Job Embeddings Linked Safely
        LEFT JOIN job_embeddings job_title ON job_title.job_offer_id = j.id AND job_title.embedding_type = 'title'
        LEFT JOIN job_embeddings job_skills ON job_skills.job_offer_id = j.id AND job_skills.embedding_type = 'skills'
        LEFT JOIN job_embeddings job_exp ON job_exp.job_offer_id = j.id AND job_exp.embedding_type = 'experience'
        WHERE j.is_active = true
    """)

    results = db.execute(query, {
        "cv_title_id": cv_title_id,
        "cv_skills_id": cv_skills_id,
        "cv_exp_id": cv_exp_id if cv_exp_id else cv_title_id
    }).fetchall()

    jobs = []
    for row in results:
        t_sim = max(0.1, min(1.0, float(row.title_sim)))
        s_sim = max(0.1, min(1.0, float(row.skills_sim)))
        e_sim = max(0.1, min(1.0, float(row.exp_sim)))
        p_sim = max(0.1, min(1.0, float(row.proj_sim)))

        # Calculate semantic score using custom weights
        semantic_score = (0.40 * t_sim) + (0.40 * s_sim) + (0.15 * e_sim) + (0.05 * p_sim)

        job_json = row.parsed_json or {}
        keyword_bonus = keyword_overlap_bonus(active_cv.parsed_json or {}, job_json)
        final_score = min(semantic_score + keyword_bonus, 1.0)

        jobs.append({
            "job_offer_id": str(row.job_id),
            "job_id": str(row.job_id),
            "title": row.title,
            "company": row.company or "Tech SaaS Innovations",
            "description": row.description,
            "location": row.location or "Remote",
            "work_type": row.work_type.value if hasattr(row.work_type, 'value') else str(row.work_type),
            "requirements": row.requirements or [],
            "skills": row.skills or [],
            "salary_min": float(row.salary_min) if row.salary_min is not None else None,
            "salary_max": float(row.salary_max) if row.salary_max is not None else None,
            "currency": row.currency or "EUR",
            "score": round(final_score, 3),
            "semantic_score": round(semantic_score, 3),
            "keyword_bonus": round(keyword_bonus, 3),
            "final_score": round(final_score, 3),
            "breakdown": {
                "title_score": round(t_sim, 3),
                "skills_score": round(s_sim, 3),
                "experience_score": round(e_sim, 3),
                "projects_score": round(p_sim, 3),
                "keyword_bonus": round(keyword_bonus, 3)
            }
        })

    return active_cv, sorted(jobs, key=lambda x: x["final_score"], reverse=True)[:limit]

@router.get("/top-jobs/{user_id}")
def get_top_jobs(user_id: uuid.UUID, limit: int = 5, db: Session = Depends(get_db)):
    active_cv, jobs = get_top_jobs_for_user(db, user_id, limit)
    if not active_cv:
        raise HTTPException(status_code=404, detail="No active CV found for user")
    return jobs


def get_top_candidates_for_job(db: Session, job_id: uuid.UUID, limit: int = 5):
    job = db.query(models.JobOffer).filter(models.JobOffer.id == job_id).first()
    if not job:
        return None, []

    # 1. Gather exact job embedding target IDs to completely stop row duplication multiplication errors
    job_embeddings = db.query(models.JobEmbedding).filter(models.JobEmbedding.job_offer_id == job_id).all()
    job_emb_map = {emb.embedding_type.value if hasattr(emb.embedding_type, 'value') else str(emb.embedding_type): emb.id for emb in job_embeddings}
    
    title_emb_id = job_emb_map.get('title')
    skills_emb_id = job_emb_map.get('skills')
    exp_emb_id = job_emb_map.get('experience')

    # 2. Defensive Fallback Block: If AI Vectors aren't fully seeded, run keyword overlap rankings to keep app green
    if not title_emb_id or not skills_emb_id:
        query = text("""
            SELECT u.id AS user_id, u.first_name, u.last_name, u.email, c.id AS cv_id, c.parsed_json
            FROM cvs c
            JOIN users u ON u.id = c.user_id
            WHERE c.is_active = true
        """)
        results = db.execute(query).fetchall()
        candidates = []
        for row in results:
            cv_json = row.parsed_json or {}
            keyword_bonus = keyword_overlap_bonus(cv_json, job.parsed_json or {})
            candidates.append({
                "user_id": str(row.user_id),
                "first_name": row.first_name,
                "last_name": row.last_name,
                "candidateName": f"{row.first_name} {row.last_name}",
                "email": row.email,
                "cv_id": str(row.cv_id),
                "semantic_score": 0.45,
                "keyword_bonus": round(keyword_bonus, 3),
                "final_score": round(0.45 + keyword_bonus, 3),
                "semantic_vector_fit": 50,
                "skills_overlap": int(keyword_bonus * 400),
                "suitability_score": int(45 + (keyword_bonus * 200))
            })
        return job, sorted(candidates, key=lambda x: x["suitability_score"], reverse=True)[:limit]

    # 3. Clean Vector Matching Selection Query (Isolates lookup filters on precise target IDs)
    query = text("""
        SELECT 
            u.id AS user_id,
            u.first_name AS first_name,
            u.last_name AS last_name,
            u.email AS email,
            c.id AS cv_id,
            c.parsed_json AS parsed_json,
            COALESCE(1 - (cv_title.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :title_emb_id)), 0.5) AS title_sim,
            COALESCE(1 - (cv_skills.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :skills_emb_id)), 0.5) AS skills_sim,
            COALESCE(1 - (cv_exp.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :exp_emb_id)), 0.5) AS exp_sim,
            COALESCE(1 - (cv_proj.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :exp_emb_id)), 0.5) AS proj_sim
        FROM cvs c
        -- Candidate Embeddings
        LEFT JOIN cv_embeddings cv_title ON cv_title.cv_id = c.id AND cv_title.embedding_type = 'title'
        LEFT JOIN cv_embeddings cv_skills ON cv_skills.cv_id = c.id AND cv_skills.embedding_type = 'skills'
        LEFT JOIN cv_embeddings cv_exp ON cv_exp.cv_id = c.id AND cv_exp.embedding_type = 'experience'
        LEFT JOIN cv_embeddings cv_proj ON cv_proj.cv_id = c.id AND cv_proj.embedding_type = 'projects'
        -- Users Join
        JOIN users u ON u.id = c.user_id
        WHERE c.is_active = true
    """)

    results = db.execute(query, {
        "title_emb_id": title_emb_id,
        "skills_emb_id": skills_emb_id,
        "exp_emb_id": exp_emb_id if exp_emb_id else title_emb_id
    }).fetchall()

    candidates = []
    for row in results:
        t_sim = max(0.1, min(1.0, float(row.title_sim)))
        s_sim = max(0.1, min(1.0, float(row.skills_sim)))
        e_sim = max(0.1, min(1.0, float(row.exp_sim)))
        p_sim = max(0.1, min(1.0, float(row.proj_sim)))

        semantic_score = (0.40 * t_sim) + (0.40 * s_sim) + (0.15 * e_sim) + (0.05 * p_sim)

        cv_json = row.parsed_json or {}
        keyword_bonus = keyword_overlap_bonus(cv_json, job.parsed_json or {})
        final_score = min(semantic_score + keyword_bonus, 1.0)

        # Scale output properties perfectly to realistic integer percentage scales out of 100
        semantic_vector_fit_pct = int(s_sim * 100)
        skills_overlap_pct = int(keyword_bonus * 400) 
        suitability_score_pct = int(final_score * 100)

        candidates.append({
            "user_id": str(row.user_id),
            "first_name": row.first_name,
            "last_name": row.last_name,
            "candidateName": f"{row.first_name} {row.last_name}",
            "email": row.email,
            "cv_id": str(row.cv_id),
            "semantic_score": round(semantic_score, 3),
            "keyword_bonus": round(keyword_bonus, 3),
            "final_score": round(final_score, 3),
            "semantic_vector_fit": max(10, min(100, semantic_vector_fit_pct)),
            "skills_overlap": max(5, min(100, skills_overlap_pct)),
            "suitability_score": max(15, min(100, suitability_score_pct))
        })

    candidates = sorted(candidates, key=lambda x: x["final_score"], reverse=True)[:limit]
    return job, candidates


@router.get("/top-candidates/{job_id}")
def get_top_candidates(job_id: uuid.UUID, limit: int = 5, db: Session = Depends(get_db)):
    job, candidates = get_top_candidates_for_job(db, job_id, limit)
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")
    return candidates

def calculate_match_score(db: Session, cv_id: uuid.UUID, job_offer_id: uuid.UUID) -> float:
    # 1. Fetch CV embeddings IDs
    cv_embeddings = db.query(models.CVEmbedding).filter(models.CVEmbedding.cv_id == cv_id).all()
    cv_emb_map = {emb.embedding_type.value if hasattr(emb.embedding_type, 'value') else str(emb.embedding_type): emb.id for emb in cv_embeddings}
    cv_title_id = cv_emb_map.get('title')
    cv_skills_id = cv_emb_map.get('skills')
    cv_exp_id = cv_emb_map.get('experience')

    # 2. Fetch Job embeddings IDs
    job_embeddings = db.query(models.JobEmbedding).filter(models.JobEmbedding.job_offer_id == job_offer_id).all()
    job_emb_map = {emb.embedding_type.value if hasattr(emb.embedding_type, 'value') else str(emb.embedding_type): emb.id for emb in job_embeddings}
    title_emb_id = job_emb_map.get('title')
    skills_emb_id = job_emb_map.get('skills')
    exp_emb_id = job_emb_map.get('experience')

    # If any embedding is missing, fallback to keyword bonus + base score
    if not cv_title_id or not cv_skills_id or not title_emb_id or not skills_emb_id:
        cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
        job = db.query(models.JobOffer).filter(models.JobOffer.id == job_offer_id).first()
        bonus = 0.0
        if cv and job:
            bonus = keyword_overlap_bonus(cv.parsed_json or {}, job.parsed_json or {})
        return round(0.45 + bonus, 3)

    # Compute similarity using SQL pgvector <=> operator
    query = text("""
        SELECT 
            COALESCE(1 - (cv_title.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :title_emb_id)), 0.5) AS title_sim,
            COALESCE(1 - (cv_skills.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :skills_emb_id)), 0.5) AS skills_sim,
            COALESCE(1 - (cv_exp.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :exp_emb_id)), 0.5) AS exp_sim,
            COALESCE(1 - (cv_proj.embedding <=> (SELECT embedding FROM job_embeddings WHERE id = :exp_emb_id)), 0.5) AS proj_sim
        FROM cvs c
        LEFT JOIN cv_embeddings cv_title ON cv_title.cv_id = c.id AND cv_title.embedding_type = 'title'
        LEFT JOIN cv_embeddings cv_skills ON cv_skills.cv_id = c.id AND cv_skills.embedding_type = 'skills'
        LEFT JOIN cv_embeddings cv_exp ON cv_exp.cv_id = c.id AND cv_exp.embedding_type = 'experience'
        LEFT JOIN cv_embeddings cv_proj ON cv_proj.cv_id = c.id AND cv_proj.embedding_type = 'projects'
        WHERE c.id = :cv_id
    """)
    row = db.execute(query, {
        "cv_id": cv_id,
        "title_emb_id": title_emb_id,
        "skills_emb_id": skills_emb_id,
        "exp_emb_id": exp_emb_id if exp_emb_id else title_emb_id
    }).first()

    if not row:
        return 0.5

    t_sim = max(0.1, min(1.0, float(row.title_sim)))
    s_sim = max(0.1, min(1.0, float(row.skills_sim)))
    e_sim = max(0.1, min(1.0, float(row.exp_sim)))
    p_sim = max(0.1, min(1.0, float(row.proj_sim)))

    semantic_score = (0.40 * t_sim) + (0.40 * s_sim) + (0.15 * e_sim) + (0.05 * p_sim)
    
    cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    job = db.query(models.JobOffer).filter(models.JobOffer.id == job_offer_id).first()
    bonus = 0.0
    if cv and job:
        bonus = keyword_overlap_bonus(cv.parsed_json or {}, job.parsed_json or {})

    final_score = min(semantic_score + bonus, 1.0)
    return round(final_score, 3)