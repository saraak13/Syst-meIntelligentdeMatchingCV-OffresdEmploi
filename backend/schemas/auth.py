from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: str
    company: Optional[str] = None
    # 📸 ADD THIS LINE RIGHT HERE:
    image_base64: Optional[str] = None