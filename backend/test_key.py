import os
from dotenv import load_dotenv

# Force reload from the exact path
load_dotenv(override=True)

print("--- ENV LOG ---")
print("DATABASE_URL found:", bool(os.getenv("DATABASE_URL")))
print("GROQ_API_KEY found:", bool(os.getenv("GROQ_API_KEY")))
if os.getenv("GROQ_API_KEY"):
    print("Key starts with:", os.getenv("GROQ_API_KEY")[:8])