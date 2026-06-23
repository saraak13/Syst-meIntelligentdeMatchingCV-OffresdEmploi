import sys
import os
import uuid
import hashlib

# Add the parent directory to the Python path to resolve backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
import models

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_admin_user():
    print("[INFO] Starting admin user seeder...")
    db = next(database.get_db())

    # Check if admin user already exists
    existing_admin = db.query(models.User).filter(
        models.User.email == "admin@recruitai.com"
    ).first()
    
    if existing_admin:
        print(f"[INFO] Admin user already exists: {existing_admin.email}")
        print("[INFO] Updating password to match demo credentials...")
        existing_admin.password_hash = hash_password("demo123")
        db.commit()
        db.refresh(existing_admin)
        print(f"[SUCCESS] Admin password updated: {existing_admin.email}")
        return

    # Create admin user with demo credentials
    print("[INFO] Creating admin user with demo credentials...")
    admin_user = models.User(
        id=uuid.uuid4(),
        first_name="Admin",
        last_name="User",
        email="admin@recruitai.com",
        password_hash=hash_password("demo123"),
        role=models.UserRole.admin,
        location="System",
        company="RecruitAI"
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"[SUCCESS] Admin user created: {admin_user.email}")
    print(f"[SUCCESS] Admin ID: {admin_user.id}")
    print("[SUCCESS] You can now log in with:")
    print("  Email: admin@recruitai.com")
    print("  Password: demo123")
    print("  Role: admin")

if __name__ == "__main__":
    seed_admin_user()
