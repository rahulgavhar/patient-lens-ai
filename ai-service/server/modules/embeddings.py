import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()


def get_embedding_dimension() -> int:
    return int(os.getenv("EMBEDDING_DIMENSION", "768"))


def create_embedding_model():
    provider = os.getenv("EMBEDDING_PROVIDER", "google").lower()
    embedding_dimension = get_embedding_dimension()

    if provider == "local":
        local_model = os.getenv("LOCAL_EMBEDDING_MODEL", "sentence-transformers/all-mpnet-base-v2")
        return HuggingFaceEmbeddings(model_name=local_model)

    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("GOOGLE_API_KEY not found in .env")

    google_model = os.getenv("GOOGLE_EMBEDDING_MODEL", "models/gemini-embedding-001")
    return GoogleGenerativeAIEmbeddings(
        model=google_model,
        api_key=google_api_key,
        output_dimensionality=embedding_dimension,
    )


def format_embedding_error(error: Exception) -> str:
    message = str(error)
    if "NOT_FOUND" in message and "embed" in message.lower():
        return (
            "Embedding model not found. Set GOOGLE_EMBEDDING_MODEL to a supported model "
            "(for example: models/gemini-embedding-001) or set EMBEDDING_PROVIDER=local."
        )
    if "RESOURCE_EXHAUSTED" in message or "quota" in message.lower():
        return (
            "Google embedding quota exceeded. Add billing/quota, or set EMBEDDING_PROVIDER=local "
            "to use sentence-transformers locally."
        )
    return message

