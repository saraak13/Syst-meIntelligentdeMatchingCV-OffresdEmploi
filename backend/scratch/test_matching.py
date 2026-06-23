import sys
sys.path.append('.')
from fastapi.testclient import TestClient
from main import app
import database
import models

client = TestClient(app)

db = next(database.get_db())
cv = db.query(models.CV).filter(models.CV.is_active == True).first()
if not cv:
    print("No active CV found!")
else:
    print(f"Testing matching for user_id: {cv.user_id}")
    response = client.get(f"/api/matching/top-jobs/{cv.user_id}")
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(response.json())
