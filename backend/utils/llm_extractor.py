import os
import json
from groq import Groq
from utils.ocr_extractor import extract_text, parse_cv  # reuse the OCR text extractor and native parser

# Load GROQ_API_KEY from environment, fallback to the placeholder
API_KEY = os.getenv("GROQ_API_KEY", "la cle")

def cv_to_json_llm(pdf_path: str, output_path: str = None) -> dict:
    """
    Complete pipeline: PDF -> raw text -> Groq LLM (Llama) -> structured JSON.
    If Groq fails (e.g. invalid API key, 401, or no network), falls back gracefully
    to the native local regex-based parser so the CV upload NEVER crashes.
    """
    print("[INFO] Extracting text from PDF...")
    raw_text = extract_text(pdf_path)

    if not raw_text.strip():
        print("[WARNING] No text extracted from PDF!")
        return {}

    print(f"[INFO] Text extracted successfully ({len(raw_text)} characters)")

    # 1. Attempt Groq LLM Extraction
    try:
        client = Groq(api_key=API_KEY)
        print("[INFO] Sending raw text to Groq Llama for structured extraction...")

        prompt = f"""
Here is the raw text extracted from a CV:

{raw_text}

Extract all information and return ONLY a valid JSON.
No text before or after, no markdown, no ```json.

IMPORTANT RULES:
1. ALL keys and ALL values must be in ENGLISH (translate if needed)
2. ALWAYS return the exact same structure below, even if information is missing
3. If a simple field is missing -> use null
4. If a list field is missing -> use null (NOT an empty list)
5. For competences_techniques: only include categories that exist in the CV, others -> null

Exact structure to follow:
{{
  "full_name": "...",
  "title": "...",
  "contact": {{
    "email": "...",
    "phone": "...",
    "linkedin": "...",
    "location": "..."
  }},
  "education": [
    {{
      "institution": "...",
      "degree": "...",
      "period": "..."
    }}
  ],
  "work_experience": [
    {{
      "position": "...",
      "company": "...",
      "period": "...",
      "tasks": ["...", "..."]
    }}
  ],
  "projects": [
    {{
      "title": "...",
      "description": ["...", "..."]
    }}
  ],
  "technical_skills": {{
    "languages": ["..."],
    "frameworks": ["..."],
    "databases": ["..."],
    "tools": ["..."],
    "cloud_devops": ["..."],
    "big_data": ["..."]
  }},
  "soft_skills": ["...", "..."],
  "languages": [
    {{
      "language": "...",
      "level": "..."
    }}
  ]
}}

Return only the JSON, nothing else.
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert CV data extractor. You always return valid JSON only, no text before or after, no markdown. All keys and values must be in English. Missing fields must be null, never omitted."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1
        )
        json_text = response.choices[0].message.content.strip()

        # Clean and parse JSON
        if json_text.startswith("```"):
            json_text = json_text.split("```")[1]
            if json_text.startswith("json"):
                json_text = json_text[4:]
        json_text = json_text.strip()

        result = json.loads(json_text)
        print("[SUCCESS] JSON structured successfully via Groq!")
        
        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
        return result

    except Exception as e:
        print(f"[WARNING] Groq extraction failed ({e}). Falling back to native local parser...")
        
        # 2. Graceful Fallback to Native regex-based parsing
        try:
            native_data = parse_cv(raw_text)
            
            # Map French native structure to standard English JSON structure
            fallback_result = {
                "full_name": native_data.get("nom") or "Candidate Profile",
                "title": native_data.get("titre") or "Software Professional",
                "contact": {
                    "email": native_data.get("contact", {}).get("email") or None,
                    "phone": native_data.get("contact", {}).get("telephone") or None,
                    "linkedin": native_data.get("contact", {}).get("linkedin") or None,
                    "location": "Not specified"
                },
                "education": [
                    {
                        "institution": edu.get("etablissement", "Institution"),
                        "degree": edu.get("diplome", "Degree"),
                        "period": edu.get("periode", "Period")
                    } for edu in native_data.get("formations", [])
                ] if native_data.get("formations") else None,
                
                "work_experience": [
                    {
                        "position": exp.get("intitule", "Experience"),
                        "company": "Not specified",
                        "period": exp.get("periode", "Period"),
                        "tasks": exp.get("taches", [])
                    } for exp in native_data.get("experiences", [])
                ] if native_data.get("experiences") else None,
                
                "projects": [
                    {
                        "title": proj.get("titre", "Project"),
                        "description": proj.get("description", [])
                    } for proj in native_data.get("projets", [])
                ] if native_data.get("projets") else None,
                
                "technical_skills": {
                    "languages": native_data.get("competences_techniques", {}).get("Langues", []) or None,
                    "frameworks": native_data.get("competences_techniques", {}).get("Frameworks", []) or None,
                    "databases": native_data.get("competences_techniques", {}).get("Bases de données", []) or None,
                    "tools": native_data.get("competences_techniques", {}).get("Outils", []) or None,
                    "cloud_devops": None,
                    "big_data": None
                },
                "soft_skills": native_data.get("soft_skills") or None,
                "languages": [
                    {
                        "language": lang,
                        "level": "Fluent"
                    } for lang in native_data.get("langues", [])
                ] if native_data.get("langues") else None
            }

            print("[SUCCESS] Local regex parsing completed successfully as fallback!")
            if output_path:
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(fallback_result, f, ensure_ascii=False, indent=2)
            return fallback_result

        except Exception as fallback_err:
            print(f"[ERROR] Native fallback parser also failed: {fallback_err}")
            return {}
