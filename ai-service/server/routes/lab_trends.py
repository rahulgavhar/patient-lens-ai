import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

# Read target microservice base URLs with fallback to localhost for host development
PATIENT_SERVICE_URL = os.getenv("PATIENT_SERVICE_URL", "http://localhost:4000")
MEDICAL_RECORD_SERVICE_URL = os.getenv("MEDICAL_RECORD_SERVICE_URL", "http://localhost:4007")

@router.post("/lab-trends/{patient_id}")
async def generate_lab_trends(patient_id: str, request: Request):
    try:
        logger.info(f"Generating clinical lab trends analysis for patient: {patient_id}")
        
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in environment")
            
        auth_header = request.headers.get("Authorization")
        headers = {}
        if auth_header:
            headers["Authorization"] = auth_header
            
        # 1. Fetch patient profile details
        patient_info = {}
        try:
            patient_url = f"{PATIENT_SERVICE_URL}/patients/{patient_id}"
            logger.info(f"Fetching patient details from: {patient_url}")
            async with httpx.AsyncClient() as client:
                res = await client.get(patient_url, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    patient_info = res.json()
                else:
                    logger.warning(f"Failed to fetch patient details, status code: {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling patient-service: {e}")
            
        # 2. Fetch patient's medical records
        medical_records = []
        try:
            records_url = f"{MEDICAL_RECORD_SERVICE_URL}/medical-records/patient/{patient_id}"
            logger.info(f"Fetching medical records from: {records_url}")
            async with httpx.AsyncClient() as client:
                res = await client.get(records_url, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    medical_records = res.json()
                else:
                    logger.warning(f"Failed to fetch medical records, status code: {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling medical-record-service: {e}")

        # Format patient info for LLM context
        patient_summary = (
            f"Name: {patient_info.get('name', 'N/A')}\n"
            f"DOB: {patient_info.get('dateOfBirth', 'N/A')}\n"
            f"Blood Group: {patient_info.get('bloodGroup', 'N/A')}\n"
            f"Height: {patient_info.get('height', 'N/A')} cm, Weight: {patient_info.get('weight', 'N/A')} kg\n"
        )
        
        # Sort medical records chronologically (oldest to newest) to analyze trends
        if medical_records:
            medical_records.sort(key=lambda x: x.get("createdAt", ""))
            
        # Format medical records history for LLM context
        records_context = ""
        if medical_records:
            for idx, rec in enumerate(medical_records):
                records_context += (
                    f"--- Consultation Event #{idx+1} ({rec.get('createdAt', 'Unknown Date')}) ---\n"
                    f"Diagnosis: {rec.get('diagnosis', 'N/A')}\n"
                    f"Vitals: {rec.get('vitals', 'N/A')}\n"
                    f"Lab Results: {rec.get('labResults', 'N/A')}\n"
                    f"Prescription: {rec.get('prescription', 'N/A')}\n"
                    f"Notes: {rec.get('consultationNotes', 'N/A')}\n\n"
                )
        else:
            records_context = "No previous medical records found for this patient."
            
        # Setup LangChain Groq LLM
        groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        llm = ChatGroq(
            api_key=groq_api_key,
            model=groq_model,
        )
        
        system_prompt = (
            "You are an expert clinical data analyst and assistant. Your task is to analyze the patient's chronological "
            "vitals and lab records over time and produce a detailed Lab Trend Analysis progression report for a clinician.\n\n"
            "Identify quantitative progressions (e.g. blood pressure, fasting glucose, HbA1c, cholesterol levels, kidney or liver panel, CBC counts, etc.) "
            "and classify the trend direction and clinical trajectory.\n\n"
            "Format the output cleanly in plain text paragraphs and bullet points (do not use markdown tables as they fail to align in text blocks). Organize as follows:\n"
            "1. CHRONOLOGICAL METRICS TIMELINE: A bulleted list showing Date -> BP -> Glucose -> Other key lab results.\n"
            "2. METRIC PROGRESSION & TRAJECTORY:\n"
            "   - List each identified metric category (e.g. Glucose/HbA1c Progression, Hypertension Trend, Lipid Profile Progression).\n"
            "   - Under each category, provide: Chronological progression values, Trajectory classification (e.g. Worsening, Improving, Stable, Fluctuating), and a brief analysis.\n"
            "3. CLINICAL ACTION CHECKS & WARNINGS: High priority clinical follow-up checks (e.g. if sugar is rising continuously, flag risk of diabetes development).\n\n"
            "Be professional, precise, and objective. Keep the analysis strictly focused on clinical metrics from the records."
        )
        
        human_content = (
            f"=== PATIENT INFO ===\n{patient_summary}\n"
            f"=== CHRONOLOGICAL MEDICAL RECORDS ===\n{records_context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", human_content),
        ])
        
        chain = prompt | llm
        llm_response = await chain.ainvoke({})
        
        summary_text = llm_response.content if hasattr(llm_response, "content") else str(llm_response)
        
        return JSONResponse(content={
            "patientId": patient_id,
            "patientName": patient_info.get("name", "Unknown"),
            "trends": summary_text
        })
        
    except Exception as e:
        logger.error(f"Error in generate_lab_trends: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
