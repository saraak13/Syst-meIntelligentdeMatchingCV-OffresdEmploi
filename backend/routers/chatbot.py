import logging
import uuid
from typing import List, Optional
from groq import Groq
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from routers.matching import get_top_candidates_for_job, get_top_jobs_for_user
from schemas.chatbot import (
    ChatbotAnalyzeRequest,
    ChatbotAnalyzeResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    MatchingResult,
)
from utils.chatbot_service import (
    ChatbotService,
    compute_skill_overlap,
    cv_to_data,
    format_analyze_reply,
    job_to_data,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])
chatbot_service = ChatbotService()


def _build_candidate_context(db: Session, user: models.User, job_id: Optional[uuid.UUID] = None) -> str:
    active_cv = db.query(models.CV).filter(
        models.CV.user_id == user.id,
        models.CV.is_active == True
    ).first()
    if not active_cv:
        return "No active CV found. The candidate must upload a CV before matching or advice can be provided."

    cv_data = cv_to_data(active_cv, user)
    lines = [
        "=== CANDIDATE FULL CV DETAILS ===",
        f"Candidate Name: {cv_data.candidate_name}",
        f"CV Title: {(active_cv.parsed_json or {}).get('title', 'N/A')}",
        f"CV Summary: {cv_data.summary or 'N/A'}",
        f"CV Skills: {', '.join(cv_data.skills) if cv_data.skills else 'None extracted'}",
        f"CV Experience:\n{cv_data.experience or 'N/A'}",
        f"CV Education: {cv_data.education or 'N/A'}",
        "================================="
    ]

    # If a specific job ID is targeted, put it at the very top of focus
    if job_id:
        target_job = db.query(models.JobOffer).filter(models.JobOffer.id == job_id).first()
        if target_job:
            recruiter = db.query(models.User).filter(models.User.id == target_job.recruiter_id).first()
            company_name = recruiter.company if (recruiter and recruiter.company) else "TechCorp"
            lines.append("\n=== TARGETED JOB OFFER (IN FOCUS FOR CV MODIFICATION SUGGESTIONS) ===")
            lines.append(f"Job ID: {target_job.id}")
            lines.append(f"Title: {target_job.title}")
            lines.append(f"Company: {company_name}")
            lines.append(f"Description: {target_job.description}")
            lines.append(f"Requirements: {', '.join(target_job.requirements) if target_job.requirements else 'None specified'}")
            lines.append(f"Skills Required: {', '.join(target_job.skills) if target_job.skills else 'None specified'}")
            lines.append("=====================================================================")

    all_jobs = db.query(models.JobOffer).filter(models.JobOffer.is_active == True).all()
    if all_jobs:
        lines.append("\n=== AVAILABLE JOB OFFERS IN DATABASE ===")
        for job in all_jobs:
            if job_id and job.id == job_id:
                continue  # already highlighted in target section
            recruiter = db.query(models.User).filter(models.User.id == job.recruiter_id).first()
            company_name = recruiter.company if (recruiter and recruiter.company) else "TechCorp"
            lines.append(f"\n--- Job Offer ---")
            lines.append(f"Job ID: {job.id}")
            lines.append(f"Title: {job.title}")
            lines.append(f"Company: {company_name}")
            lines.append(f"Description: {job.description}")
            lines.append(f"Requirements: {', '.join(job.requirements) if job.requirements else 'None specified'}")
            lines.append(f"Skills Required: {', '.join(job.skills) if job.skills else 'None specified'}")
        lines.append("\n========================================")
    else:
        lines.append("\nNo active job offers in the database.")

    return "\n".join(lines)


def _build_recruiter_context(
    db: Session, user: models.User, job_id: Optional[uuid.UUID] = None
) -> str:
    jobs = (
        db.query(models.JobOffer)
        .filter(
            models.JobOffer.recruiter_id == user.id,
            models.JobOffer.is_active == True,
        )
        .all()
    )

    if not jobs:
        return "No active job postings found for this recruiter."

    lines = [f"Recruiter: {user.first_name} {user.last_name}", "\nJob postings:"]
    for job in jobs:
        lines.append(f"- {job.title} (id: {job.id}, applicants: {job.applicants_count})")

    selected_job = None
    if job_id:
        selected_job = next((j for j in jobs if j.id == job_id), None)
    if not selected_job and jobs:
        selected_job = jobs[0]

    if selected_job:
        job, candidates = get_top_candidates_for_job(db, selected_job.id, limit=5)
        recruiter = db.query(models.User).filter(models.User.id == job.recruiter_id).first()
        company = recruiter.company if recruiter else "Company"
        lines.append(f"\nTop candidates for '{selected_job.title}' at {company}:")
        if candidates:
            for c in candidates:
                score_pct = round(c["final_score"] * 100)
                lines.append(
                    f"- {c['first_name']} {c['last_name']} ({c['email']}) — match: {score_pct}%"
                )
        else:
            lines.append("- No candidates with active CVs found.")

    return "\n".join(lines)


def _get_or_create_session(
    db: Session, user_id: uuid.UUID
) -> models.ChatSession:
    session = (
        db.query(models.ChatSession)
        .filter(models.ChatSession.user_id == user_id)
        .order_by(models.ChatSession.created_at.desc())
        .first()
    )
    if not session:
        session = models.ChatSession(user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    return session


def _load_history(db: Session, session_id: uuid.UUID) -> List[dict]:
    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "role": msg.role.value if hasattr(msg.role, "value") else str(msg.role),
            "content": msg.message,
        }
        for msg in messages
    ]


def _extract_job_json(reply: str) -> Optional[str]:
    idx = reply.find("CREATE_JOB")
    if idx == -1:
        return None
    
    start_idx = reply.find("{", idx)
    if start_idx == -1:
        return None
        
    brace_count = 0
    end_idx = -1
    for i in range(start_idx, len(reply)):
        char = reply[i]
        if char == "{":
            brace_count += 1
        elif char == "}":
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
                
    if end_idx != -1:
        return reply[start_idx:end_idx+1]
    return None


def _handle_job_creation_command(db: Session, recruiter_id: uuid.UUID, cmd_str: str) -> Optional[models.JobOffer]:
    try:
        import json
        import ast
        try:
            data = json.loads(cmd_str)
        except Exception:
            try:
                data = ast.literal_eval(cmd_str)
            except Exception as ae:
                logger.error(f"Fallback parsing with ast also failed: {ae}")
                raise ValueError("Invalid JSON format for job creation")

        title = data.get("title", "New Job Offer")
        description = data.get("description", "No description provided.")
        skills = data.get("skills", [])
        requirements = data.get("requirements", [])
        location = data.get("location", "Remote")
        
        wt_str = str(data.get("work_type", "remote")).lower()
        work_type = models.WorkType.remote
        if "hybrid" in wt_str:
            work_type = models.WorkType.hybrid
        elif "onsite" in wt_str or "on-site" in wt_str:
            work_type = models.WorkType.onsite
            
        parsed_json = {
            "position": title,
            "required_skills": skills,
            "responsibilities": requirements,
            "location": location,
            "remote_policy": wt_str
        }
        
        new_job = models.JobOffer(
            recruiter_id=recruiter_id,
            title=title,
            description=description,
            parsed_json=parsed_json,
            location=location,
            work_type=work_type,
            requirements=requirements,
            skills=skills,
            status=models.JobStatus.active,
            is_active=True
        )
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        
        # Generate and store embeddings
        from utils.embeddings import generate_embedding
        embeddings_to_generate = [
            (models.EmbeddingType.title, title),
            (models.EmbeddingType.skills, ", ".join(skills) if skills else title),
            (models.EmbeddingType.experience, ", ".join(requirements) if requirements else title),
            (models.EmbeddingType.summary, description)
        ]

        for emb_type, text in embeddings_to_generate:
            if text and text.strip():
                try:
                    vector = generate_embedding(text)
                    new_embedding = models.JobEmbedding(
                        job_offer_id=new_job.id,
                        embedding_type=emb_type,
                        chunk_index=0,
                        chunk_text=text,
                        embedding=vector
                    )
                    db.add(new_embedding)
                except Exception as e:
                    logger.error(f"Error generating embedding for job chatbot: {e}")
        db.commit()
        return new_job
    except Exception as e:
        logger.error(f"Failed to create job from chatbot command: {e}")
        db.rollback()
        return None


def _save_message(
    db: Session,
    session_id: uuid.UUID,
    role: models.MessageRole,
    content: str,
) -> None:
    db.add(
        models.ChatMessage(
            session_id=session_id,
            role=role,
            message=content,
        )
    )
    db.commit()


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest, db: Session = Depends(get_db)
) -> ChatMessageResponse:
    user = db.query(models.User).filter(models.User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    target_job_id = None
    if request.job_id:
        try:
            target_job_id = uuid.UUID(request.job_id)
        except ValueError:
            pass

    if request.context == "candidate":
        platform_context = _build_candidate_context(db, user, target_job_id)
    else:
        platform_context = _build_recruiter_context(db, user, target_job_id)

    session = _get_or_create_session(db, user.id)
    history = _load_history(db, session.id)
    _save_message(db, session.id, models.MessageRole.user, request.message)

    # Extract optional language attribute from incoming request payload (defaults to French 'fr')
    user_lang = getattr(request, "language", "fr")

   # 🕵️ Check what properties the request has safely
    user_lang = "fr"
    if hasattr(request, "language") and request.language:
        user_lang = request.language
    elif isinstance(request, dict) and "language" in request:
        user_lang = request["language"]

    try:
        reply = await chatbot_service.chat(
            message=request.message,
            context=request.context,
            user_name=f"{user.first_name} {user.last_name}",
            platform_context=platform_context,
            history=history,
            language=str(user_lang),  # 🌐 Explicitly force a string mapping injection
        )
    except httpx.HTTPError as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(status_code=502, detail="AI service unavailable. Check GROQ_API_KEY.")
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Intercept and check for CREATE_JOB command
    json_str = _extract_job_json(reply)
    if json_str and request.context == "recruiter":
        new_job = _handle_job_creation_command(db, user.id, json_str)
        
        # Clean the reply text by removing the CREATE_JOB command block
        start_pos = reply.find("[CREATE_JOB")
        if start_pos == -1:
            start_pos = reply.find("CREATE_JOB")
            
        end_pos = reply.find(json_str) + len(json_str)
        if end_pos < len(reply) and reply[end_pos] == ']':
            end_pos += 1
            
        if start_pos != -1:
            clean_reply = reply[:start_pos] + reply[end_pos:]
            reply = clean_reply.strip()
            
        if new_job:
            reply += f"\n\n*(Note: I have successfully created this job offer in the database with ID {new_job.id})*"
        else:
            reply += "\n\n*(Note: I tried to create this job offer in the database but encountered an error)*"

    _save_message(db, session.id, models.MessageRole.assistant, reply)
    return ChatMessageResponse(reply=reply, session_id=str(session.id))


@router.post("/analyze", response_model=ChatbotAnalyzeResponse)
async def analyze_matching(request: ChatbotAnalyzeRequest) -> ChatbotAnalyzeResponse:
    try:
        return await chatbot_service.analyze(request)
    except httpx.HTTPError as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(status_code=502, detail="AI service unavailable. Check GROQ_API_KEY.")
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/analyze-job/{user_id}/{job_id}")
async def analyze_job_match(
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_cv, top_jobs = get_top_jobs_for_user(db, user_id, limit=50)
    if not active_cv:
        raise HTTPException(status_code=404, detail="No active CV found for user")

    job = db.query(models.JobOffer).filter(models.JobOffer.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job offer not found")

    recruiter = db.query(models.User).filter(models.User.id == job.recruiter_id).first()
    company = recruiter.company if recruiter else "Company"

    match = next((j for j in top_jobs if j["job_offer_id"] == str(job_id)), None)
    score = round((match["final_score"] if match else 0) * 100, 1)

    matched, missing = compute_skill_overlap(
        active_cv.parsed_json or {}, job, job.parsed_json or {}
    )

    analyze_request = ChatbotAnalyzeRequest(
        cv_data=cv_to_data(active_cv, user),
        job_offer_data=job_to_data(job, company),
        matching_result=MatchingResult(
            compatibility_score=score,
            matched_skills=matched,
            missing_skills=missing,
        ),
    )

    try:
        result = await chatbot_service.analyze(analyze_request)
    except httpx.HTTPError as exc:
        logger.error("Groq API error: %s", exc)
        raise HTTPException(status_code=502, detail="AI service unavailable. Check GROQ_API_KEY.")

    return {
        "analysis": result,
        "formatted_reply": format_analyze_reply(result),
        "match_score": score,
    }