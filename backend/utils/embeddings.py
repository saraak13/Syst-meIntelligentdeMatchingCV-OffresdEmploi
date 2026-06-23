import os
import ollama
from dotenv import load_dotenv

load_dotenv()

# Note: The active PostgreSQL schema expects VECTOR(768), which aligns natively 
# with Ollama's nomic-embed-text embeddings.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def generate_embedding(text: str) -> list[float]:
    """
    Generates a 768-dimensional embedding vector for the given text, 
    perfectly matching the recruit_ai PostgreSQL table constraints.
    """
    if not text.strip():
        # Return a zero vector of 768 dimensions if text is empty
        return [0.0] * 768

    if OPENAI_API_KEY:
        try:
            # If OpenAI is installed and key is provided, use OpenAI and truncate to 768
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            emb = response.data[0].embedding
            if len(emb) > 768:
                emb = emb[:768]
            elif len(emb) < 768:
                emb = emb + [0.0] * (768 - len(emb))
            return emb
        except ImportError:
            pass

    # Fallback/Default to Ollama (nomic-embed-text)
    # nomic-embed-text natively outputs exactly 768 dimensions.
    try:
        response = ollama.embeddings(
            model="nomic-embed-text",
            prompt=text
        )
        emb = response["embedding"]
        if len(emb) < 768:
            emb = emb + [0.0] * (768 - len(emb))
        elif len(emb) > 768:
            emb = emb[:768]
        return emb
    except Exception as e:
        print(f"Error generating embedding via Ollama: {e}")
        # Return fallback zero vector of 768 dimensions if Ollama is not running/available
        return [0.0] * 768
