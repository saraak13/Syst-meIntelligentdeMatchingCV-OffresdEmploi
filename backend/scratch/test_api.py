import sys
sys.path.append('.')
from fastapi.testclient import TestClient
from main import app
import uuid
import database
import models

client = TestClient(app)

# Let's find an existing user ID in the database to use
db = next(database.get_db())
first_user = db.query(models.User).first()
if first_user:
    user_id = str(first_user.id)
    print(f"Using existing user: {first_user.email} (ID: {user_id})")
else:
    # Create a mock user
    new_user = models.User(
        first_name="Test",
        last_name="User",
        email="test_temp@recruit.ai",
        password_hash="hashedpassword",
        role=models.UserRole.candidate
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    user_id = str(new_user.id)
    print(f"Created temporary user (ID: {user_id})")

# Call the /upload endpoint with the TestClient
try:
    with open("../bibliographie_CV_Matching.pdf", "rb") as f:
        pdf_content = f.read()
    
    real_file = ("bibliographie_CV_Matching.pdf", pdf_content, "application/pdf")
    response = client.post(
        "/api/cvs/upload",
        data={"user_id": user_id},
        files={"file": real_file}
    )
    print(f"Status Code: {response.status_code}")
    print("Body:")
    print(response.json() if response.headers.get("content-type") == "application/json" else response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
