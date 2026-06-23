import sys
import os
sys.path.append(r"c:\Users\HP\Desktop\PFA\backend")

from database import SessionLocal
import models

db = SessionLocal()
try:
    cvs = db.query(models.CV).all()
    print(f"Total CVs found: {len(cvs)}")
    for cv in cvs:
        user = db.query(models.User).filter(models.User.id == cv.user_id).first()
        uname = f"{user.first_name} {user.last_name}" if user else "UNKNOWN"
        print(f"CV ID: {cv.id} | User: {uname} ({cv.user_id}) | Active: {cv.is_active}")
except Exception as e:
    print(e)
finally:
    db.close()
