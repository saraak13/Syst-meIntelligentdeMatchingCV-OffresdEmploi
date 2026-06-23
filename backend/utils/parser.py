def clean_parts(parts: list) -> list[str]:
    """Helper to sanitize list items, ensuring only valid strings are returned and ignoring None."""
    sanitized = []
    for item in parts:
        if item is not None:
            if isinstance(item, list):
                sanitized.extend([str(x) for x in item if x is not None])
            else:
                sanitized.append(str(item))
    return sanitized

def cv_to_text(cv: dict) -> str:
    parts = []
    parts.append(cv.get("full_name") or "")
    parts.append(cv.get("title") or "")

    technical = cv.get("technical_skills", {})
    if isinstance(technical, dict):
        for values in technical.values():
            if isinstance(values, list):
                parts.extend(values)
            elif isinstance(values, str):
                parts.append(values)
    return "\n".join(clean_parts(parts))

def cv_skills_text(cv: dict) -> str:
    skills = []
    technical = cv.get("technical_skills", {})
    if isinstance(technical, dict):
        for values in technical.values():
            if isinstance(values, list):
                skills.extend(values)
            elif isinstance(values, str):
                skills.append(values)
    return "\n".join(clean_parts(skills))

def cv_experience_text(cv: dict) -> str:
    parts = []
    work_exp = cv.get("work_experience", [])
    if isinstance(work_exp, list):
        for exp in work_exp:
            if isinstance(exp, dict):
                parts.append(exp.get("position") or "")
                tasks = exp.get("tasks", [])
                if isinstance(tasks, list):
                    parts.extend(tasks)
                elif isinstance(tasks, str):
                    parts.append(tasks)
    return "\n".join(clean_parts(parts))

def cv_projects_text(cv: dict) -> str:
    parts = []
    projects = cv.get("projects", [])
    if isinstance(projects, list):
        for project in projects:
            if isinstance(project, dict):
                parts.append(project.get("title") or "")
                desc = project.get("description", [])
                if isinstance(desc, list):
                    parts.extend(desc)
                elif isinstance(desc, str):
                    parts.append(desc)
    return "\n".join(clean_parts(parts))

def offer_to_text(job: dict) -> str:
    parts = []
    parts.append(job.get("position") or "")
    parts.append(job.get("company_name") or "")
    req_skills = job.get("required_skills", [])
    if isinstance(req_skills, list):
        parts.extend(req_skills)
    elif isinstance(req_skills, str):
        parts.append(req_skills)
    return "\n".join(clean_parts(parts))

def job_skills_text(job: dict) -> str:
    req_skills = job.get("required_skills", [])
    if isinstance(req_skills, list):
        return "\n".join(clean_parts(req_skills))
    return str(req_skills) if req_skills is not None else ""

def job_responsibilities_text(job: dict) -> str:
    resp = job.get("responsibilities", [])
    if isinstance(resp, list):
        return "\n".join(clean_parts(resp))
    return str(resp) if resp is not None else ""
