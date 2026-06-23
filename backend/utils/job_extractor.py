import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY", "la cle")

def extract_job_from_text(description: str, position: str = "Not specified", company_name: str = "Not specified") -> dict:
    """
    Sends a raw job description to Groq Llama to extract highly structured JSON.
    """
    if not description.strip():
        return {}

    client = Groq(api_key=API_KEY)

    prompt = f"""
You are a recruitment data extraction expert.

Read the job offer below and extract all structured information.
Translate ALL content into English.
Return ONLY a valid JSON object. No explanation, no markdown, no code fences.

--- FULL JOB DESCRIPTION ---
{description}

--- RECRUITER METADATA ---
position        : {position}
company_name    : {company_name}

--- FIELDS TO EXTRACT (translate everything to English) ---
- location        : City and country if mentioned, else "Not specified"
- contract_type   : Full-time / Part-time / Freelance / Contract / Not specified
- sector          : Industry domain (e.g. IT, Blockchain, Finance...)
- required_skills : List of all technical skills
- soft_skills     : List of soft skills
- education       : Required degree and field, or "Not specified"
- responsibilities: List of main duties (max 5 items)
- salary          : Salary if mentioned, else "Not specified"
- benefits        : List of perks and benefits
- seniority_level : Junior / Middle / Senior / Lead / Not specified
- remote_policy   : Remote / Hybrid / On-site / Not specified

Return a JSON with exactly these keys:
{{
  "position": "...",
  "company_name": "...",
  "location": "...",
  "contract_type": "...",
  "sector": "...",
  "required_skills": ["...", "..."],
  "soft_skills": ["...", "..."],
  "education": "...",
  "responsibilities": ["...", "..."],
  "salary": "...",
  "benefits": ["...", "..."],
  "seniority_level": "...",
  "remote_policy": "..."
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a data extraction expert. Always respond with valid JSON only. No markdown, no explanation, no code fences."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0
    )

    reponse_texte = response.choices[0].message.content.strip()

    if reponse_texte.startswith("```"):
        lignes = reponse_texte.split("\n")
        lignes = [l for l in lignes if not l.strip().startswith("```")]
        reponse_texte = "\n".join(lignes).strip()

    try:
        resultat = json.loads(reponse_texte)
        return resultat
    except json.JSONDecodeError as e:
        print(f"Error parsing job extraction JSON: {e}")
        return {}
