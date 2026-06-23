import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

# Force load the .env file BEFORE reading variables globally
load_dotenv(override=True)

from groq import Groq
from schemas.chatbot import (
    ChatbotAnalyzeRequest,
    ChatbotAnalyzeResponse,
    CVData,
    JobOfferData,
    MatchingResult,
)
from utils.parser import cv_experience_text, cv_skills_text

logger = logging.getLogger(__name__)

# Core Environment Variables Fallbacks
GROQ_API_KEY = os.getenv("GROQ_API_KEY") or "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"
GROQ_MODEL = os.getenv("GROQ_MODEL") or "llama-3.3-70b-versatile"

ANALYZE_PROMPT = """
You are an AI career assistant. Do not calculate the compatibility score. Analyze the provided matching results and advise the candidate.

Input:
- CV data: {cv_data}
- Job offer data: {job_data}
- Matching result: {matching_result}

Your response must be valid JSON only, with no markdown, backticks, or extra commentary.
Return a single JSON object with these keys:
- can_apply: boolean
- compatibility_level: string
- recommendations: array of strings
- missing_skills_explanations: array of strings
- cv_improvement_suggestions: array of strings
- detail: string

Use the matching results to determine whether the candidate should apply.
Do not invent skills or requirements beyond what is provided.
"""

CHAT_PROMPT = """
You are RecruitAI Assistant, an expert recruitment and career advisor for the RecruitAI platform.

Mode: {context}
User name: {user_name}

Platform context (real data from PostgreSQL + AI matching):
{platform_context}

Conversation history:
{history}

User message: {message}

Instructions:
- Answer based on the platform context above. Do not invent candidates, jobs, or scores.
- If the user has no CV uploaded, tell them to upload one first via the Upload CV page.
- For candidates: reference their top job matches when relevant. If they ask to suggest modifications, improvements, or optimization to their CV for a specific job offer listed in the context, compare their CV details (skills, experience, summary) against the job's description and requirements and suggest concrete, actionable modifications (such as highlights to add, projects to describe, or key terms/skills to include).
- For recruiters: reference their job postings and ranked candidates when relevant. If the recruiter wants to add, create, or post a new job offer in the database, or if they provide details for a new job posting, you MUST include a command block formatted EXACTLY as `[CREATE_JOB: {{"title": "...", "description": "...", "skills": ["...", "..."], "requirements": ["...", "..."], "location": "...", "work_type": "..."}}]` embedded in your message. Do not confirm the creation of a job offer to the user without including this `[CREATE_JOB: ...]` command block.
- Be concise, actionable, and friendly. Use markdown (**bold**, bullet lists) when helpful.
- Do not mention that you are using Groq or any internal system details.
"""

class GroqService:
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        url: str = None,
        timeout: int = 45,
    ):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model or GROQ_MODEL
        
        # Bypasses local network/firewall strict SSL handshake constraints cleanly
        unsafe_http_client = httpx.Client(verify=False)
        
        self.client = Groq(
            api_key=self.api_key, 
            timeout=timeout,
            http_client=unsafe_http_client
        )

    async def create_chat_completion(
        self,
        messages: list,
        temperature: float = 0.4,
        max_tokens: int = 900,
    ) -> str:
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Native Groq SDK execution failure context: {str(e)}")
            raise RuntimeError(f"Groq API connection rejected or timed out: {str(e)}")


class ChatbotService:
    def __init__(self, groq_service: GroqService = None):
        self.groq_service = groq_service or GroqService()

    async def analyze(self, request_data: ChatbotAnalyzeRequest) -> ChatbotAnalyzeResponse:
        raw_prompt = ANALYZE_PROMPT.format(
            cv_data=request_data.cv_data.model_dump(),
            job_data=request_data.job_offer_data.model_dump(),
            matching_result=request_data.matching_result.model_dump(),
        )

        messages = [
            {"role": "system", "content": "You are a professional career coach and CV reviewer."},
            {"role": "user", "content": raw_prompt},
        ]

        assistant_text = await self.groq_service.create_chat_completion(messages=messages)
        parsed = self._parse_json_response(assistant_text)
        return ChatbotAnalyzeResponse(**parsed)

    async def chat(
        self,
        message: str,
        context: str,
        user_name: str,
        platform_context: str,
        history: Optional[List[Dict[str, str]]] = None,
        language: str = "fr",  # 🌐 ➕ Add this parameter right here!
    ) -> str:
        history_text = ""
        if history:
            lines = []
            for entry in history[-6:]:
                role = entry.get("role", "user")
                content = entry.get("content", "")
                lines.append(f"{role}: {content}")
            history_text = "\n".join(lines) or "(no prior messages)"

        prompt = CHAT_PROMPT.format(
            context=context,
            user_name=user_name,
            platform_context=platform_context,
            history=history_text,
            message=message,
        )

        # 💡 Inject localization rules dynamically inside the prompt string:
        if language == "fr":
            prompt += "\nIMPORTANT: Please respond strictly in French language."
        else:
            prompt += "\nIMPORTANT: Please respond strictly in English language."

        messages = [
            {"role": "system", "content": "You are RecruitAI Assistant, a helpful recruitment advisor."},
            {"role": "user", "content": prompt},
        ]

        return await self.groq_service.create_chat_completion(messages=messages, temperature=0.5)

    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                return json.loads(content[start : end + 1])
            raise ValueError(f"Unable to parse JSON from Groq response: {content[:200]}")

def extract_cv_skills(cv_json: dict) -> List[str]:
    skills: set[str] = set()
    technical = cv_json.get("technical_skills", {})
    if isinstance(technical, dict):
        for values in technical.values():
            if isinstance(values, list):
                for skill in values:
                    skills.add(str(skill))  # 💡 Fixed closing parenthesis here
            elif isinstance(values, str):
                skills.add(values)
    soft = cv_json.get("soft_skills", [])
    if isinstance(soft, list):
        for skill in soft:
            skills.add(str(skill))
    return sorted(skills)

def extract_job_skills(job, job_json: dict) -> List[str]:
    skills: set[str] = set()
    if job.skills:
        for skill in job.skills:
            skills.add(str(skill))
    if job.requirements:
        for req in job.requirements:
            skills.add(str(req))
    req_skills = job_json.get("required_skills", [])
    if isinstance(req_skills, list):
        for skill in req_skills:
            skills.add(str(skill))
    return sorted(skills)


def compute_skill_overlap(cv_json: dict, job, job_json: dict) -> tuple[List[str], List[str]]:
    cv_set = {s.lower() for s in extract_cv_skills(cv_json)}
    job_set = {s.lower() for s in extract_job_skills(job, job_json)}
    matched = sorted(cv_set & job_set)
    missing = sorted(job_set - cv_set)
    return matched, missing


def cv_to_data(cv, user) -> CVData:
    parsed = cv.parsed_json or {}
    education_parts = []
    for edu in parsed.get("education", []) or []:
        if isinstance(edu, dict):
            education_parts.append(
                f"{edu.get('degree', '')} at {edu.get('institution', '')}".strip()
            )

    return CVData(
        candidate_name=parsed.get("full_name") or f"{user.first_name} {user.last_name}",
        summary=parsed.get("summary") or parsed.get("bio"),
        skills=extract_cv_skills(parsed),
        experience=cv_experience_text(parsed) or None,
        education="; ".join(education_parts) or None,
        raw_text=cv.raw_text,
    )


def job_to_data(job, company: str) -> JobOfferData:
    parsed = job.parsed_json or {}
    responsibilities = parsed.get("responsibilities", [])
    if isinstance(responsibilities, list):
        resp_text = "; ".join(str(r) for r in responsibilities)
    else:
        resp_text = str(responsibilities) if responsibilities else None

    return JobOfferData(
        title=job.title,
        company=company,
        description=job.description,
        required_skills=extract_job_skills(job, parsed),
        nice_to_have=parsed.get("nice_to_have", []) or [],
        responsibilities=resp_text,
    )


def format_analyze_reply(response: ChatbotAnalyzeResponse) -> str:
    lines = [
        f"**Compatibility: {response.compatibility_level}**",
        f"**Should you apply?** {'Yes' if response.can_apply else 'Not yet — improve your CV first'}",
    ]
    if response.detail:
        lines.append(f"\n{response.detail}")
    if response.recommendations:
        lines.append("\n**Recommendations:**")
        lines.extend(f"- {r}" for r in response.recommendations)
    if response.missing_skills_explanations:
        lines.append("\n**Missing skills:**")
        lines.extend(f"- {e}" for e in response.missing_skills_explanations)
    if response.cv_improvement_suggestions:
        lines.append("\n**CV improvements:**")
        lines.extend(f"- {s}" for s in response.cv_improvement_suggestions)
    return "\n".join(lines)