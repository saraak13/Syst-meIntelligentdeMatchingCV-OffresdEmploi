from fastapi import APIRouter, UploadFile, File, HTTPException
import pdfplumber
import docx
import io

router = APIRouter()

def extract_text_from_pdf(file_bytes):
    text = ""
    # Open from binary memory buffer bytes directly to prevent server lockups
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_docx(file_bytes):
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])


def analyze_ats(text: str):
    score = 0
    strengths = []
    weaknesses = []
    recommendations = []

    text_lower = text.lower()

    # Structure check
    if "experience" in text_lower or "expérience" in text_lower:
        score += 20
        strengths.append("Section expérience présente")
    else:
        weaknesses.append("Pas de section expérience")
        recommendations.append("Ajouter une section Expérience")

    if "education" in text_lower or "formation" in text_lower:
        score += 15
        strengths.append("Section formation présente")
    else:
        weaknesses.append("Pas de section formation")
        recommendations.append("Ajouter Formation")

    # Expanded to align with your platform's AI, Data, and Full-Stack focus!
    skills_keywords = ["python", "java", "sql", "react", "node", "javascript", "docker", "spark", "hadoop", "flask"]
    found_skills = [skill for skill in skills_keywords if skill in text_lower]

    if found_skills:
        score += 25
        strengths.append(f"Compétences détectées: {', '.join(found_skills)}")
    else:
        weaknesses.append("Peu de compétences techniques détectées")
        recommendations.append("Ajouter des compétences techniques (ex: Python, SQL, React)")

    # Length check
    if len(text) > 1000:
        score += 15
    else:
        recommendations.append("CV trop court ou pas assez détaillé pour passer les filtres ATS")

    # Keyword richness
    if len(found_skills) >= 3:
        score += 25

    is_compliant = score >= 75

    return {
        "atsScore": min(score, 100),
        "isATSCompliant": is_compliant,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        # 🚀 system_prompt payload prepared cleanly for your Groq message history injection
        "ai_prompt_context": (
            f"SYSTEM CONTEXT - THE CANDIDATE JUST UPLOADED A CV. ATS ANALYSIS RESULTS:\n"
            f"- ATS Score: {min(score, 100)}%\n"
            f"- Compliant: {is_compliant}\n"
            f"- Strengths: {', '.join(strengths)}\n"
            f"- Weaknesses: {', '.join(weaknesses)}\n"
            f"- Recommendations: {', '.join(recommendations)}\n"
            f"Acknowledge these results in a natural, supportive way and guide the candidate on how to fix their gaps."
        )
    }


@router.post("/api/cv/analyze")
async def analyze_cv(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Format non supporté. Fournir un fichier .pdf ou .docx")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Impossible d'extraire du texte de ce fichier.")

    return analyze_ats(text)