import sys
sys.path.append('.')

from database import SessionLocal
import models

db = SessionLocal()
try:
    users_count = db.query(models.User).count()
    cvs_count = db.query(models.CV).count()
    cv_embs_count = db.query(models.CVEmbedding).count()
    jobs_count = db.query(models.JobOffer).count()
    job_embs_count = db.query(models.JobEmbedding).count()
    apps_count = db.query(models.Application).count()

    print(f"Users: {users_count}")
    print(f"CVs: {cvs_count}")
    print(f"CV Embeddings: {cv_embs_count}")
    print(f"Job Offers: {jobs_count}")
    print(f"Job Embeddings: {job_embs_count}")
    print(f"Applications: {apps_count}")

    # Check some sample applications
    apps = db.query(models.Application).all()
    for app in apps:
        print(f"Application id: {app.id}, cv_id: {app.cv_id}, job_offer_id: {app.job_offer_id}")

except Exception as e:
    print("Error:", e)
finally:
    db.close()
