import os
import json
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class SymptomRequest(BaseModel):
    symptoms: str

@router.post("/symptom-intake")
async def analyze_symptom_intake(payload: SymptomRequest, request: Request):
    try:
        logger.info(f"Analyzing symptom intake description: {payload.symptoms}")
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in environment")
            
        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = ChatGroq(
            api_key=groq_api_key,
            model=groq_model,
            temperature=0.1  # Low temperature for highly structured schema extraction
        )
        
        system_prompt = (
            "You are an expert medical triage assistant. Your task is to analyze the patient's symptom description "
            "and extract structured clinical indicators in JSON format.\n\n"
            "You MUST output a valid JSON object containing exactly the following keys, with NO other conversational text, padding, or markdown wraps (do not wrap in ```json or ```):\n"
            "{\n"
            '  "symptoms": "Extracted main symptoms in clear medical terms",\n'
            '  "duration": "Duration described by the patient (e.g. 2 days, 1 week, unknown)",\n'
            '  "severity": "Mild, Moderate, Severe, or Emergency",\n'
            '  "associatedSymptoms": "Associated symptoms described (e.g. nausea, dizziness, none)",\n'
            '  "recommendedTriage": "Clinic Visit, Urgent Care, Emergency Room, or Home Care",\n'
            '  "triageScore": 1, 2, or 3 (integers only: 1 = Normal/Mild, 2 = Urgent/Moderate, 3 = Emergency/Severe)\n'
            "}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "Patient Symptom Description: {symptoms}"),
        ])
        
        chain = prompt | llm
        llm_response = await chain.ainvoke({"symptoms": payload.symptoms})
        
        raw_output = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        
        # Clean any markdown code blocks if the LLM outputted them despite instructions
        clean_json_str = raw_output.replace("```json", "").replace("```", "").strip()
        
        try:
            parsed_json = json.loads(clean_json_str)
            if "triageScore" in parsed_json:
                try:
                    parsed_json["triageScore"] = int(parsed_json["triageScore"])
                except (ValueError, TypeError):
                    parsed_json["triageScore"] = 2
            return JSONResponse(content=parsed_json)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM response as JSON: {clean_json_str}")
            return JSONResponse(content={
                "symptoms": payload.symptoms[:100],
                "duration": "Unknown",
                "severity": "Moderate",
                "associatedSymptoms": "None",
                "recommendedTriage": "Clinic Visit",
                "triageScore": 2
            })
            
    except Exception as e:
        logger.error(f"Error in analyze_symptom_intake: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
