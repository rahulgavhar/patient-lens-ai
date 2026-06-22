import os
import json
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class MedicalRecordItem(BaseModel):
    id: str
    createdAt: str
    doctorName: str
    diagnosis: str
    prescription: Optional[str] = ""
    labResults: Optional[str] = ""
    vitals: Optional[str] = ""
    consultationNotes: Optional[str] = ""

class TimelineRequest(BaseModel):
    records: List[MedicalRecordItem]

@router.post("/timeline-summary")
async def generate_timeline_summary(payload: TimelineRequest, request: Request):
    try:
        logger.info(f"Generating timeline summaries for {len(payload.records)} medical records")
        
        if not payload.records:
            return JSONResponse(content={"summaries": {}})
            
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in environment")
            
        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = ChatGroq(
            api_key=groq_api_key,
            model=groq_model,
            temperature=0.1
        )
        
        # Format list of records for context
        records_context = ""
        for rec in payload.records:
            records_context += (
                f"Record ID: {rec.id}\n"
                f"Date: {rec.createdAt}\n"
                f"Doctor: {rec.doctorName}\n"
                f"Diagnosis: {rec.diagnosis}\n"
                f"Prescription: {rec.prescription or 'None'}\n"
                f"Lab Results: {rec.labResults or 'None'}\n"
                f"Vitals: {rec.vitals or 'None'}\n"
                f"Consultation Notes: {rec.consultationNotes or 'None'}\n"
                f"-----------------------------------------\n"
            )
            
        system_prompt = (
            "You are an expert clinical AI. Your task is to analyze the patient's medical records and generate a concise, "
            "one-sentence summary for each record, suitable for a chronological visual timeline.\n\n"
            "Each summary must be a brief overview of the visit (e.g. 'Patient presented with seasonal allergies; prescribed Antihistamines and vitals were normal.') "
            "and should focus on the primary diagnosis, actions taken (like prescriptions), and key outcomes.\n\n"
            "You MUST return your output as a valid JSON object where the keys are the Record IDs and values are their corresponding one-sentence summaries. "
            "Do not include any conversational padding, introduction, or markdown wrapping. Output only the pure JSON.\n\n"
            "Example response format:\n"
            "{\n"
            '  "some-uuid-1": "Summary of record 1.",\n'
            '  "some-uuid-2": "Summary of record 2."\n'
            "}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Here are the patient's medical records:\n\n{records}"),
        ])
        
        chain = prompt | llm
        llm_response = await chain.ainvoke({"records": records_context})
        
        raw_output = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        
        # Clean any markdown code blocks
        clean_json_str = raw_output.replace("```json", "").replace("```", "").strip()
        
        try:
            parsed_json = json.loads(clean_json_str)
            return JSONResponse(content={"summaries": parsed_json})
        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response as JSON: {clean_json_str}")
            # Generate fallback summaries if parsing failed
            fallbacks = {}
            for rec in payload.records:
                fallbacks[rec.id] = f"Consultation with {rec.doctorName} for {rec.diagnosis}."
            return JSONResponse(content={"summaries": fallbacks})
            
    except Exception as e:
        logger.error(f"Error in generate_timeline_summary: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
