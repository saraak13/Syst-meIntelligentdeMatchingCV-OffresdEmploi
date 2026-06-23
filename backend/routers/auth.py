import os
import uuid
import hashlib
import logging
from typing import List, Optional
import cv2
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

import models
from database import get_db
from utils.face_service import FaceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Directory configuration for saving biometric reference portraits
UPLOAD_DIR = "storage/faces"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class FaceLoginRequest(BaseModel):
    email: str
    image_base64: str


# 📸 NEW: Email-free request schema requiring ONLY the camera snapshot matrix
class AnonymousFaceLoginRequest(BaseModel):
    image_base64: str


class RegisterSchema(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: models.UserRole = models.UserRole.candidate
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    image_base64: Optional[str] = None  # 📸 Captures base64 strings during onboarding


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    role: models.UserRole


class UpdateProfileSchema(BaseModel):
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    avatar_url: Optional[str] = None


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# 📸 NEW: Passwordless, Email-free 1-to-N Biometric Authentication Endpoint
@router.post("/login-face-anonymous")
async def login_with_face_anonymous(payload: AnonymousFaceLoginRequest, db: Session = Depends(get_db)):
    # 1. Decode the incoming base64 frame matrix array
    try:
        live_frame = FaceService.decode_base64_image(payload.image_base64)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Search through the entire face storage folder to discover an embedding match
    matched_filename = FaceService.find_face(live_frame, UPLOAD_DIR)
    
    if not matched_filename:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Biometric signatures could not be identified. Please use standard credentials log-in."
        )

    # 3. Reconstruct the full profile path string to find the user row in the PostgreSQL database
    reconstructed_path = os.path.join(UPLOAD_DIR, matched_filename)
    user = db.query(models.User).filter(models.User.profile_photo_path == reconstructed_path).first()
    
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="Biometric baseline matched on disk, but relational profile could not be found."
        )
        
    return {
        "message": "Biometric verification successful",
        "user": {
            "id": str(user.id), 
            "email": user.email, 
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "company": user.company,
            "location": user.location,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url
        }
    }


@router.post("/login-face")
async def login_with_face(payload: FaceLoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch the user profile parameters safely from the relational tables
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="No registered profile found matching this email address."
        )
        
    # 2. Decode the incoming base64 payload matrix string array
    try:
        live_frame = FaceService.decode_base64_image(payload.image_base64)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # 3. Path pointer targeting the baseline photo saved during onboarding
    baseline_path = getattr(user, "profile_photo_path", None)
    
    # 4. Perform the model comparison math
    is_match = FaceService.verify_face(live_frame, baseline_path)
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Biometric verification failed. Face signatures do not match reference data."
        )
        
    return {
        "message": "Biometric verification successful",
        "user": {
            "id": str(user.id), 
            "email": user.email, 
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "company": user.company,
            "location": user.location,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url
        }
    }


@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    saved_face_path = None

    # 📸 Process and write FaceID matrix frame to disk if provided
    if data.image_base64:
        try:
            live_frame = FaceService.decode_base64_image(data.image_base64)
            
            # Formulate clear alphanumeric profile file signatures
            safe_email = data.email.replace("@", "_").replace(".", "_")
            filename = f"{safe_email}.jpg"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            # Save via CV2
            cv2.imwrite(file_path, live_frame)
            saved_face_path = file_path
        except Exception as e:
            logger.error(f"Biometric background registration writing failure: {str(e)}")
            raise HTTPException(
                status_code=400, 
                detail="Failed to process FaceID snapshot. Account creation suspended."
            )

    new_user = models.User(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone_number=data.phone_number,
        password_hash=hash_password(data.password),
        role=data.role,
        avatar_url=data.avatar_url,
        company=data.company,
        location=data.location,
        profile_photo_path=saved_face_path  # 📸 Binds biometric path safely to user row
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User registered successfully",
        "user": {
            "id": str(new_user.id),
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email,
            "role": new_user.role,
            "phone_number": new_user.phone_number,
            "avatar_url": new_user.avatar_url,
            "company": new_user.company,
            "location": new_user.location
        }
    }


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == data.email,
        models.User.role == data.role
    ).first()
    
    if not user or user.password_hash != hash_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or role"
        )
    
    return {
        "message": "Login successful",
        "user": {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "company": user.company,
            "location": user.location,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url
        }
    }


@router.put("/profile/{user_id}")
def update_profile(user_id: uuid.UUID, data: UpdateProfileSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.first_name = data.first_name
    user.last_name = data.last_name
    user.phone_number = data.phone_number
    user.location = data.location
    user.company = data.company
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
        
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url,
            "company": user.company,
            "location": user.location
        }
    }