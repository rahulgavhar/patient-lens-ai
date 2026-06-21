from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from server.modules.multimodal_engine import cdss_orchestrator
from server.logger import logger

router = APIRouter(prefix="/multimodal-decision", tags=["Clinical Decision Support"])

@router.post("")
async def run_multimodal_cdss(
    clinical_text: str = Form(..., description="The clinical notes or case description of the patient"),
    image: UploadFile = File(..., description="The medical image scan (X-ray, MRI, CT scan)")
):
    logger.info(f"Received Multimodal CDSS analysis request. Text length: {len(clinical_text)}")
    
    if not clinical_text.strip():
        raise HTTPException(status_code=400, detail="Clinical notes/text cannot be empty.")

    try:
        # Read the file contents
        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded medical scan image file is empty.")

        # Run analysis (Bio_ClinicalBERT + ViT Fusion)
        result = cdss_orchestrator.analyze(clinical_text, image_bytes)
        return result

    except Exception as e:
        logger.error(f"Error executing CDSS Multimodal analysis: {e}")
        raise HTTPException(status_code=500, detail=f"CDSS Engine failed: {str(e)}")
