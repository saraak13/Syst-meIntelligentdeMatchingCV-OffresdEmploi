from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
import uuid


class CVData(BaseModel):
    candidate_name: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: Optional[str] = None
    education: Optional[str] = None
    raw_text: Optional[str] = None


class JobOfferData(BaseModel):
    title: str
    company: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    nice_to_have: List[str] = Field(default_factory=list)
    responsibilities: Optional[str] = None


class MatchingResult(BaseModel):
    compatibility_score: float = Field(..., ge=0, le=100)
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    additional_context: Optional[Dict[str, Any]] = None


class ChatbotAnalyzeRequest(BaseModel):
    cv_data: CVData
    job_offer_data: JobOfferData
    matching_result: MatchingResult


class ChatbotAnalyzeResponse(BaseModel):
    can_apply: bool
    compatibility_level: str
    recommendations: List[str] = Field(default_factory=list)
    missing_skills_explanations: List[str] = Field(default_factory=list)
    cv_improvement_suggestions: List[str] = Field(default_factory=list)
    detail: Optional[str] = None


class ChatMessageRequest(BaseModel):
    user_id: str
    message: str
    context: str
    job_id: Optional[str] = None
    language: Optional[str] = "fr"


# ➕ Added this missing response schema to satisfy your router's imports!
class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str