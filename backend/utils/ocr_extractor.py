import re
import json
import sys
import io
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
import pdfplumber
import fitz          # PyMuPDF
from PIL import Image

def extract_text(pdf_path: str) -> str:
    """
    Extrait le texte d'un CV PDF.
    - Stratégie 1 : pdfplumber  (PDF avec texte sélectionnable, meilleur pour la mise en page)
    - Stratégie 2 : Tesseract OCR (fallback pour PDF scannés)
    """
    text = ""

    # Tentative pdfplumber
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception:
        pass

    # Si trop peu de texte → PDF scanné → OCR via Tesseract
    if len(text.strip()) < 100:
        text = _ocr_fallback(pdf_path)

    return text

def _ocr_fallback(pdf_path: str) -> str:
    """Rasterise chaque page et applique Tesseract OCR."""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            pix = page.get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text += pytesseract.image_to_string(img, lang="fra+eng")
    except Exception as e:
        print(f"[WARNING] OCR Fallback failed (Tesseract may not be installed or PDF is invalid): {e}")
    return text


# Patterns des sections du CV (ordre important pour délimitation)
SECTION_PATTERNS = [
    ("formation",       r"Formation"),
    ("experience",      r"Expérience\s+Professionnelle"),
    ("projets",         r"Projets\s+Académiques"),
    ("competences",     r"Compétences\s+Techniques"),
    ("soft_skills",     r"Compétences\s+Interpersonnelles"),
    ("langues",         r"Langues\s*:"),
]

def _get_section(text: str, start_pattern: str, end_patterns: list[str]) -> str:
    """Extrait le texte entre start_pattern et le premier end_pattern trouvé."""
    start = re.search(start_pattern, text, re.I)
    if not start:
        return ""
    end_pos = len(text)
    for ep in end_patterns:
        m = re.search(ep, text[start.end():], re.I)
        if m:
            end_pos = min(end_pos, start.end() + m.start())
    return text[start.end():end_pos].strip()

def _parse_contact(text: str) -> dict:
    email_m   = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone_m   = re.search(r"\+?\d[\d\s\-\.]{7,14}\d", text)
    linkedin_m= re.search(r"linkedin\.com/in/[\w\-]+", text, re.I)
    return {
        "email":     email_m.group(0)    if email_m    else None,
        "telephone": phone_m.group(0).strip() if phone_m else None,
        "linkedin":  linkedin_m.group(0) if linkedin_m else None,
    }

def _parse_formations(section_text: str) -> list[dict]:
    formations = []
    lines = [l.strip() for l in section_text.splitlines() if l.strip()]
    i = 0
    while i < len(lines):
        line = lines[i]
        date_m = re.search(r"(\d{4})\s*[–\-]\s*(\d{4}|présent|present)", line, re.I)
        if date_m or re.search(r"\d{4}", line):
            diplome = re.sub(r"\s*\d{4}\s*[–\-].*$", "", line).strip()
            periode = date_m.group(0) if date_m else re.search(r"\d{4}.*", line).group(0)
            etablissement = lines[i + 1].strip() if i + 1 < len(lines) else ""
            formations.append({
                "etablissement": etablissement,
                "diplome": diplome,
                "periode": periode,
            })
            i += 2
        else:
            i += 1
    return formations

def _parse_experiences(section_text: str) -> list[dict]:
    experiences = []
    blocks = re.split(r"\n(?=[A-ZÀÉÈÊ][^\n]+(?:—|–)[^\n]+)", section_text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        first_line = block.splitlines()[0]
        date_m = re.search(
            r"([\w\.]+\s+\d{4})\s*[–\-]\s*([\w\.]+\s+\d{4}|présent|present)",
            first_line, re.I
        )
        intitule = re.sub(r"\s+([\w\.]+\s+\d{4})\s*[–\-].*$", "", first_line).strip()
        taches = [
            l.strip().lstrip("•-– ").strip()
            for l in block.splitlines()[1:]
            if l.strip() and l.strip()[0] in ("•", "-", "–")
        ]
        experiences.append({
            "intitule":  intitule,
            "periode":   date_m.group(0) if date_m else "",
            "taches":    taches,
        })
    return experiences

def _parse_projets(section_text: str) -> list[dict]:
    projets = []
    blocks = re.split(r"\n(?=[A-ZÀÉÈÊ][^\n]+(?:\s{2,}|\t)\w)", section_text)
    if len(blocks) <= 1:
        blocks = re.split(r"\n(?=[A-ZÀÉÈÊ][^\n]{5,})", section_text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        first_line = block.splitlines()[0].strip()
        titre = re.sub(r"\s+([\w\.]+\s+\d{4})\s*[–\-].*$", "", first_line).strip()
        taches = [
            l.strip().lstrip("•-– ").strip()
            for l in block.splitlines()[1:]
            if l.strip() and l.strip()[0] in ("•", "-", "–")
        ]
        projets.append({"titre": titre, "description": taches})
    return projets

def _parse_competences(section_text: str) -> dict:
    competences = {}
    for line in section_text.splitlines():
        line = line.strip()
        m = re.match(r"^(.+?)\s*:\s*(.+)$", line)
        if m:
            key  = m.group(1).strip()
            vals = [v.strip() for v in m.group(2).split(",") if v.strip()]
            competences[key] = vals
    return competences

def _parse_langues(text: str) -> list[str]:
    m = re.search(r"Langues\s*:\s*(.+)", text, re.I)
    if not m:
        return []
    return [l.strip() for l in re.split(r"\|", m.group(1)) if l.strip()]

def _parse_soft_skills(text: str) -> list[str]:
    m = re.search(r"Compétences\s+Interpersonnelles\s*\n(.+)", text, re.I)
    if not m:
        return []
    return [s.strip() for s in re.split(r"\|", m.group(1)) if s.strip()]

def parse_cv(text: str) -> dict:
    """Transforme le texte brut extrait en JSON structuré."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    nom   = lines[0] if lines else ""
    titre = lines[1] if len(lines) > 1 else ""

    all_end_patterns = [p for _, p in SECTION_PATTERNS]

    sections = {}
    for i, (name, pattern) in enumerate(SECTION_PATTERNS):
        end_patterns = all_end_patterns[i + 1:]
        sections[name] = _get_section(text, pattern, end_patterns)

    return {
        "nom":   nom,
        "titre": titre,
        "contact": _parse_contact(text),
        "formations":            _parse_formations(sections.get("formation", "")),
        "experiences":           _parse_experiences(sections.get("experience", "")),
        "projets":               _parse_projets(sections.get("projets", "")),
        "competences_techniques":_parse_competences(sections.get("competences", "")),
        "soft_skills":           _parse_soft_skills(text),
        "langues":               _parse_langues(text),
    }

def cv_to_json(pdf_path: str, output_path: str = None) -> dict:
    raw_text = extract_text(pdf_path)
    result   = parse_cv(raw_text)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

    return result
