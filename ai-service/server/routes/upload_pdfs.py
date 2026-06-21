from fastapi import APIRouter, UploadFile, File, Request
from typing import List
from server.modules.load_vectorstore import load_vectorstore
from fastapi.responses import JSONResponse
from loguru import logger

router = APIRouter()


def _format_upload_error(error: Exception) -> str:
    message = str(error)
    if "NOT_FOUND" in message and "embed" in message.lower():
        return (
            "Embedding model not found. Set GOOGLE_EMBEDDING_MODEL in .env to a supported model, "
            "for example: models/gemini-embedding-001"
        )
    if "RESOURCE_EXHAUSTED" in message or "quota" in message.lower():
        return "Google embedding quota exceeded. Check Gemini API quotas/billing and retry."
    return message


@router.post("/upload_pdfs")
async def upload_pdfs(request: Request, files: List[UploadFile] = File(...)):
    try:
        logger.info(f"Received {len(files)} files for upload")
        username = request.headers.get("x-user-username") or "default"
        load_vectorstore(files, namespace=username)
        logger.info(f"Successfully loaded {len(files)} files for upload under namespace: {username}")
        return JSONResponse(content={"message": "Files uploaded and processed successfully"})
    except Exception as e:
        logger.error(f"Error in upload_pdfs: {e}")
        return JSONResponse(content={"error": _format_upload_error(e)}, status_code=500)
